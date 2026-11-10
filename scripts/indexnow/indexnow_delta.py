#!/usr/bin/env python3
"""Bounded IndexNow notifier. No credentials generated; dry-run is the default."""
import argparse, datetime as dt, hashlib, json, os, re, sys, urllib.request, urllib.error
import urllib.parse, urllib.robotparser, xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

HOST = 'kolosei.com'
ORIGIN = 'https://' + HOST
ENDPOINT = 'https://api.indexnow.org/indexnow'
MAX_BYTES = 3_000_000
NS = {'s': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
AGENT = 'KoloseiIndexNowVerifier/1.0'

class Abort(Exception): pass

def now(): return dt.datetime.now(dt.timezone.utc).isoformat()
def digest(value): return hashlib.sha256(value.encode('utf-8')).hexdigest()
def canonical_url(url):
    p = urllib.parse.urlsplit(url)
    if p.scheme != 'https' or p.netloc != HOST or p.query or p.fragment or p.username or p.password:
        raise Abort('Out-of-scope URL: ' + url)
    path = urllib.parse.unquote(p.path)
    if '%' in path or '\\' in path or '..' in path.split('/') or '//' in path:
        raise Abort('Ambiguous URL: ' + url)
    if path not in ('/', '/ru/') and not re.fullmatch(r'/(?:ru/)?(?:about|agents|contact|guides|imprint|privacy|products|technology|terms)(?:/[a-z0-9-]+)*/', path):
        raise Abort('Not a public page allowlist URL: ' + url)
    return url

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl): return None
OPENER = urllib.request.build_opener(NoRedirect)
def fetch(url, method='GET', data=None):
    headers = {'User-Agent': AGENT, 'Cache-Control': 'no-cache'}
    if data is not None: headers['Content-Type'] = 'application/json; charset=utf-8'
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with OPENER.open(req, timeout=30) as r:
            body = r.read(MAX_BYTES + 1)
            if len(body) > MAX_BYTES: raise Abort('Response too large: ' + url)
            return r.status, dict(r.headers), body.decode('utf-8-sig', errors='strict')
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read(10000).decode('utf-8', errors='replace')
    except (OSError, UnicodeError) as e: raise Abort('Fetch failed: ' + url + ': ' + str(e)) from e

def header(headers, name): return ','.join(v for k,v in headers.items() if k.lower() == name.lower())
def forbidden(value): return bool(re.search(r'\b(noindex|none)\b', value, re.I))

class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.robots=[]; self.canonicals=[]; self.title=[]; self.main=[]; self.h1=[]
        self.in_title=0; self.in_main=0; self.in_h1=0; self.skip=0
        self.links=[]; self.structured=[]; self.in_json=False; self.metadata=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag=='meta' and (a.get('name','').lower()=='description' or a.get('property','').startswith('og:')): self.metadata.append(a)
        if tag=='link' and 'alternate' in a.get('rel','').split(): self.metadata.append(a)
        if tag=='meta' and a.get('name','').lower() in ('robots','bingbot'): self.robots.append(a.get('content',''))
        if tag=='link' and 'canonical' in a.get('rel','').split(): self.canonicals.append(a.get('href',''))
        if tag=='title': self.in_title+=1
        if tag=='main': self.in_main+=1
        if tag=='h1' and self.in_main: self.in_h1+=1
        if self.in_main and tag=='a': self.links.append(a.get('href',''))
        if tag in ('script','style'):
            self.skip+=1
            self.in_json = tag=='script' and a.get('type','')=='application/ld+json'
    def handle_endtag(self, tag):
        if tag=='title': self.in_title=max(0,self.in_title-1)
        if tag=='main': self.in_main=max(0,self.in_main-1)
        if tag=='h1': self.in_h1=max(0,self.in_h1-1)
        if tag in ('script','style'): self.skip=max(0,self.skip-1); self.in_json=False
    def handle_data(self, data):
        if self.in_json: self.structured.append(data)
        if self.skip: return
        if self.in_title: self.title.append(data)
        if self.in_main: self.main.append(data)
        if self.in_h1: self.h1.append(data)

def normalize(parts): return ' '.join(' '.join(parts).split())
def inspect_page(url, headers, html):
    canonical_url(url)
    if 'text/html' not in header(headers,'Content-Type').lower(): raise Abort('Not HTML: '+url)
    p=Page(); p.feed(html)
    if p.canonicals != [url]: raise Abort('Canonical mismatch: '+url)
    if forbidden(header(headers,'X-Robots-Tag')) or any(map(forbidden,p.robots)): raise Abort('Noindex: '+url)
    if not normalize(p.h1) or len(normalize(p.main)) < 80: raise Abort('Missing public main content: '+url)
    # Hash only stable editorial content, not banners, visitor counters, scripts or footers.
    data={'title':normalize(p.title),'main':normalize(p.main),'links':p.links,'structured':normalize(p.structured),'metadata':p.metadata}
    return {'sha256':digest(json.dumps(data,sort_keys=True,ensure_ascii=False)), 'title':normalize(p.title)}

def sitemap():
    index=ORIGIN+'/sitemap-index.xml'
    status,_,body=fetch(index)
    if status!=200: raise Abort('Sitemap index HTTP '+str(status))
    try: root=ET.fromstring(body)
    except ET.ParseError as e: raise Abort('Invalid sitemap index') from e
    maps=[e.text for e in root.findall('s:sitemap/s:loc',NS)]
    if not maps or len(maps)>10: raise Abort('Unexpected sitemap count')
    urls=[]
    for url in maps:
        if not re.fullmatch(re.escape(ORIGIN)+r'/sitemap-[0-9]+\.xml',url or ''): raise Abort('Out-of-scope sitemap')
        status,_,body=fetch(url)
        if status!=200: raise Abort('Sitemap HTTP '+str(status))
        try: doc=ET.fromstring(body)
        except ET.ParseError as e: raise Abort('Invalid sitemap') from e
        urls += [canonical_url(e.text or '') for e in doc.findall('s:url/s:loc',NS)]
    if not urls or len(urls)>100 or len(set(urls))!=len(urls): raise Abort('Unexpected/duplicate URL count')
    return sorted(urls)

def atomic_json(path, value):
    path.parent.mkdir(parents=True,exist_ok=True)
    temp=path.with_suffix(path.suffix+'.tmp')
    temp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    os.replace(temp,path)

def main(argv=None):
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--config',required=True,help='Existing scripts/indexnow.json')
    ap.add_argument('--expected-dist',help='Require content-equivalence with this exact production build')
    ap.add_argument('--prepare-only',action='store_true',help='Persist intent before externally durable upload; requires --apply and --intent-id')
    ap.add_argument('--intent-id',default='',help='Current CI run identity; cannot resume another run intent')
    ap.add_argument('--state-dir',default=str(Path(__file__).parent/'state'))
    mode=ap.add_mutually_exclusive_group(); mode.add_argument('--apply',action='store_true'); mode.add_argument('--initialize',action='store_true',help='Establish checked baseline, without notifying search engines')
    ap.add_argument('--allow-large-delta',action='store_true',help='Explicit manual review of >25 changed/removed URLs')
    args=ap.parse_args(argv)
    folder=Path(args.state_dir); folder.mkdir(parents=True,exist_ok=True)
    lock=folder/'run.lock'
    try: fd=os.open(lock,os.O_CREAT|os.O_EXCL|os.O_WRONLY)
    except FileExistsError: raise Abort('Run lock exists; verify no active run before manual removal')
    os.close(fd)
    try:
        manifest=folder/'manifest.json'; prior=json.loads(manifest.read_text('utf-8')) if manifest.exists() else None
        if prior and (prior.get('host')!=HOST or prior.get('schema')!=1): raise Abort('Manifest identity mismatch')
        if args.initialize and prior: raise Abort('Baseline already exists; will not overwrite')
        pending=json.loads((folder/'pending.json').read_text('utf-8')) if (folder/'pending.json').exists() else None
        if pending and (not args.intent_id or pending.get('intentId')!=args.intent_id or args.prepare_only): raise Abort('Unresolved earlier submission; review pending.json and receipt before any retry')
        if args.prepare_only and (not args.apply or not args.intent_id): raise Abort('Prepare requires apply and a unique intent-id')
        if args.apply and not prior: raise Abort('Initialize a reviewed baseline first; bulk first-run submission is disabled')
        cfg=json.loads(Path(args.config).read_text('utf-8-sig'))
        if cfg.get('host')!=HOST or not re.fullmatch(r'[a-zA-Z0-9-]{8,128}',cfg.get('key','')): raise Abort('Invalid existing key config')
        if cfg.get('keyLocation') != ORIGIN+'/'+cfg['key']+'.txt': raise Abort('Unexpected key URL')
        urls=sitemap()
        status,_,robots=fetch(ORIGIN+'/robots.txt')
        if status!=200: raise Abort('Robots fetch failed')
        rp=urllib.robotparser.RobotFileParser(); rp.parse(robots.splitlines())
        current={}
        def verify(url):
            if not rp.can_fetch('bingbot',url): raise Abort('Robots disallows Bing: '+url)
            status,headers,html=fetch(url)
            if status!=200: raise Abort('Public page HTTP '+str(status)+': '+url)
            return url, inspect_page(url,headers,html)
        with ThreadPoolExecutor(max_workers=4) as pool:
            current=dict(pool.map(verify,urls))
        if args.expected_dist:
            dist=Path(args.expected_dist)
            local_urls=[]
            for file in dist.glob('sitemap-[0-9]*.xml'):
                doc=ET.fromstring(file.read_text('utf-8'))
                local_urls += [canonical_url(e.text or '') for e in doc.findall('s:url/s:loc',NS)]
            if sorted(local_urls)!=urls: raise Abort('Live sitemap differs from expected production build')
            if (dist/'robots.txt').read_text('utf-8').strip()!=robots.strip(): raise Abort('Live robots differs from expected build')
            for url in urls:
                path=urllib.parse.urlsplit(url).path.strip('/')
                expected=inspect_page(url,{'Content-Type':'text/html'},(dist/path/'index.html').read_text('utf-8'))
                if expected!=current[url]: raise Abort('Live editorial content differs from expected build: '+url)
        old=prior['pages'] if prior else {}
        changed=[u for u in urls if old.get(u,{}).get('sha256')!=current[u]['sha256']]
        removed=[]; blocked=[]
        for url in sorted(set(old)-set(current)):
            canonical_url(url)
            status,_,_=fetch(url)
            if status in (404,410): removed.append(url)
            else: blocked.append({'url':url,'status':status})
        if blocked: raise Abort('Removed sitemap URL is not confirmed gone: '+json.dumps(blocked))
        delta=changed+removed
        report={'checkedAt':now(),'host':HOST,'mode':'apply' if args.apply else 'initialize' if args.initialize else 'dry-run','currentCount':len(current),'changed':changed,'removed':removed,'deltaCount':len(delta),'baselineExists':bool(prior),'indexed':'NOT_ASSERTED'}
        stamp=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ')
        atomic_json(folder/'reports'/('preflight-'+stamp+'.json'),report)
        if args.initialize:
            atomic_json(manifest,{'schema':1,'host':HOST,'updatedAt':now(),'reason':'verified baseline; not a notification receipt','pages':current})
        elif args.apply and delta:
            if len(delta)>25 and not args.allow_large_delta: raise Abort('Large delta requires explicit review')
            status,_,key=fetch(cfg['keyLocation'])
            if status!=200 or key.strip()!=cfg['key']: raise Abort('Live key mismatch')
            payload={**cfg,'urlList':delta}
            plan_hash=digest(json.dumps({'urls':delta,'pages':current},sort_keys=True))
            if pending and pending.get('planHash')!=plan_hash: raise Abort('Content changed since durable intent; no POST')
            if args.intent_id and not pending and not args.prepare_only: raise Abort('CI apply requires prepared durable intent')
            if not pending:
                atomic_json(folder/'pending.json',{'startedAt':now(),'intentId':args.intent_id,'planHash':plan_hash,'urls':delta,'status':'OUTCOME_UNKNOWN_UNTIL_RECEIPT'})
            if args.prepare_only:
                print(json.dumps(report,ensure_ascii=False,indent=2)); return
            status,_,body=fetch(ENDPOINT,'POST',json.dumps(payload).encode('utf-8'))
            receipt={**report,'submittedAt':now(),'endpoint':ENDPOINT,'httpStatus':status,'responseBody':body,'urls':delta,'outcome':'RECEIVED' if status==200 else 'KEY_VALIDATION_PENDING' if status==202 else 'FAILED'}
            atomic_json(folder/'receipts'/('receipt-'+stamp+'.json'),receipt)
            if status not in (200,202): (folder/'pending.json').unlink(missing_ok=True)
            if status!=200: raise Abort('IndexNow HTTP '+str(status)+'; manifest NOT advanced; review receipt before retry')
            atomic_json(manifest,{'schema':1,'host':HOST,'updatedAt':now(),'reason':'accepted delta notification','pages':current})
            (folder/'pending.json').unlink(missing_ok=True)
        print(json.dumps(report,ensure_ascii=False,indent=2))
    finally: lock.unlink(missing_ok=True)

if __name__=='__main__':
    try: main()
    except (Abort,ValueError,KeyError) as e: print('ABORT: '+str(e),file=sys.stderr); sys.exit(1)
