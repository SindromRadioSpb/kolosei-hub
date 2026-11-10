import unittest, tempfile, json
from pathlib import Path
from unittest.mock import patch
import indexnow_delta as m

URL=m.ORIGIN+'/products/'
HTML='<html><head><title>Public page</title><link rel="canonical" href="'+URL+'"><meta name="robots" content="index,follow"></head><body><main><h1>Products</h1><p>'+('Public product details. '*8)+'</p></main><aside>Visitors: 123</aside></body></html>'
class Tests(unittest.TestCase):
    def test_allowlist(self):
        for u in [m.ORIGIN+'/',m.ORIGIN+'/ru/',URL,m.ORIGIN+'/ru/products/mediatheque/']: self.assertEqual(m.canonical_url(u),u)
        for path in ['/api/','/play/solidworks-instructor/bracket/','/private/','/products/?x=1','/products/#a','/products/%2e%2e/']:
            with self.assertRaises(m.Abort): m.canonical_url(m.ORIGIN+path)
        with self.assertRaises(m.Abort): m.canonical_url('https://evil.com/products/')
    def test_noindex(self):
        for h in [HTML.replace('index,follow','noindex,follow'),HTML.replace('index,follow','none')]:
            with self.assertRaises(m.Abort): m.inspect_page(URL,{'Content-Type':'text/html'},h)
        with self.assertRaises(m.Abort): m.inspect_page(URL,{'Content-Type':'text/html','X-Robots-Tag':'bingbot: noindex'},HTML)
    def test_canonical(self):
        with self.assertRaises(m.Abort): m.inspect_page(URL,{'Content-Type':'text/html'},HTML.replace('href="'+URL,'href="'+m.ORIGIN+'/about/'))
    def test_dynamic_stability(self):
        a=m.inspect_page(URL,{'Content-Type':'text/html'},HTML)
        b=m.inspect_page(URL,{'Content-Type':'text/html'},HTML.replace('Visitors: 123','Visitors: 999'))
        self.assertEqual(a,b)
        c=m.inspect_page(URL,{'Content-Type':'text/html'},HTML.replace('Public product details','New product details'))
        self.assertNotEqual(a,c)
    def run_flow(self, status=200, initialize=False, apply=False, old=True, deleted=False):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); cfg={'host':m.HOST,'key':'12345678','keyLocation':m.ORIGIN+'/12345678.txt'}
            (p/'config.json').write_text(json.dumps(cfg))
            if old: (p/'manifest.json').write_text(json.dumps({'schema':1,'host':m.HOST,'pages':{URL:{'sha256':'old'}}}))
            calls=[]
            def fake(url,method='GET',data=None):
                calls.append((url,method))
                if url.endswith('robots.txt'): return 200,{},'User-agent: *\nAllow: /'
                if url.endswith('12345678.txt'): return 200,{},'12345678'
                if url==m.ENDPOINT: return status,{},''
                return (410,{},'') if deleted else (200,{'Content-Type':'text/html'},HTML)
            args=['--config',str(p/'config.json'),'--state-dir',d]+(['--initialize'] if initialize else ['--apply'] if apply else [])
            with patch.object(m,'fetch',fake),patch.object(m,'sitemap',return_value=[] if deleted else [URL]):
                if apply and status!=200:
                    with self.assertRaises(m.Abort):m.main(args)
                    self.assertEqual(json.loads((p/'manifest.json').read_text())['pages'][URL]['sha256'],'old')
                else: m.main(args)
            return calls,(p/'manifest.json').exists(),list((p/'receipts').glob('*')) if (p/'receipts').exists() else []
    def test_dry_run_no_post(self): self.assertFalse(any(x[1]=='POST' for x in self.run_flow()[0]))
    def test_baseline_no_post(self): self.assertFalse(any(x[1]=='POST' for x in self.run_flow(initialize=True,old=False)[0]))
    def test_apply_one_post(self): self.assertEqual(sum(x[1]=='POST' for x in self.run_flow(apply=True)[0]),1)
    def test_202_no_advance(self): self.run_flow(apply=True,status=202)
    def test_503_no_advance(self): self.run_flow(apply=True,status=503)
    def test_confirmed_deletion(self): self.assertEqual(sum(x[1]=='POST' for x in self.run_flow(apply=True,deleted=True)[0]),1)
    def test_empty_delta_no_post(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); cfg={'host':m.HOST,'key':'12345678','keyLocation':m.ORIGIN+'/12345678.txt'}
            (p/'config.json').write_text(json.dumps(cfg))
            page=m.inspect_page(URL,{'Content-Type':'text/html'},HTML)
            (p/'manifest.json').write_text(json.dumps({'schema':1,'host':m.HOST,'pages':{URL:page}}))
            def fake(url,*args):
                if url==m.ENDPOINT: self.fail('No-change run attempted notification')
                return (200,{},'User-agent: *\nAllow: /') if url.endswith('robots.txt') else (200,{'Content-Type':'text/html'},HTML)
            with patch.object(m,'fetch',fake),patch.object(m,'sitemap',return_value=[URL]): m.main(['--config',str(p/'config.json'),'--state-dir',d,'--apply'])
    def test_unconfirmed_delete_aborts(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); (p/'config.json').write_text(json.dumps({'host':m.HOST,'key':'12345678','keyLocation':m.ORIGIN+'/12345678.txt'}))
            (p/'manifest.json').write_text(json.dumps({'schema':1,'host':m.HOST,'pages':{URL:{'sha256':'old'}}}))
            with patch.object(m,'sitemap',return_value=[]),patch.object(m,'fetch',return_value=(200,{},'User-agent: *\nAllow: /')):
                with self.assertRaises(m.Abort):m.main(['--config',str(p/'config.json'),'--state-dir',d,'--apply'])
    def test_pending_blocks_retry(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); (p/'pending.json').write_text('{}')
            with self.assertRaises(m.Abort):m.main(['--config','unused','--state-dir',d,'--apply'])
    def test_two_phase_intent_and_no_duplicate(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); cfg={'host':m.HOST,'key':'12345678','keyLocation':m.ORIGIN+'/12345678.txt'}
            (p/'config.json').write_text(json.dumps(cfg))
            (p/'manifest.json').write_text(json.dumps({'schema':1,'host':m.HOST,'pages':{URL:{'sha256':'old'}}}))
            calls=[]
            def fake(url,method='GET',data=None):
                calls.append(method)
                if url.endswith('robots.txt'): return 200,{},'User-agent: *\nAllow: /'
                if url.endswith('12345678.txt'): return 200,{},'12345678'
                if url==m.ENDPOINT: return 200,{},''
                return 200,{'Content-Type':'text/html'},HTML
            args=['--config',str(p/'config.json'),'--state-dir',d,'--apply','--intent-id','run-1']
            with patch.object(m,'fetch',fake),patch.object(m,'sitemap',return_value=[URL]):
                m.main(args+['--prepare-only'])
                self.assertNotIn('POST',calls); self.assertTrue((p/'pending.json').exists())
                # Restored pending cannot be replayed by another workflow run.
                with self.assertRaises(m.Abort): m.main(args[:-1]+['run-2'])
                m.main(args)
                self.assertEqual(calls.count('POST'),1); self.assertFalse((p/'pending.json').exists())
                m.main(args)
                self.assertEqual(calls.count('POST'),1)
    def test_expected_build_mismatch(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d); (p/'config.json').write_text(json.dumps({'host':m.HOST,'key':'12345678','keyLocation':m.ORIGIN+'/12345678.txt'}))
            (p/'manifest.json').write_text(json.dumps({'schema':1,'host':m.HOST,'pages':{URL:{'sha256':'old'}}}))
            dist=p/'dist';dist.mkdir();(dist/'sitemap-0.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>'+URL+'</loc></url></urlset>')
            (dist/'robots.txt').write_text('User-agent: *\nAllow: /'); (dist/'products').mkdir();(dist/'products/index.html').write_text(HTML.replace('Public page','Wrong page'))
            def fake(url,*args): return (200,{},'User-agent: *\nAllow: /') if url.endswith('robots.txt') else (200,{'Content-Type':'text/html'},HTML)
            with patch.object(m,'fetch',fake),patch.object(m,'sitemap',return_value=[URL]):
                with self.assertRaises(m.Abort):m.main(['--config',str(p/'config.json'),'--state-dir',d,'--expected-dist',str(dist),'--apply'])
if __name__=='__main__': unittest.main()
