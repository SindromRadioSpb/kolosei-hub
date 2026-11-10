"""GitHub read-only production guard and durable-artifact restore."""
import json, os, re, subprocess, sys, io, zipfile, shutil
from pathlib import Path
REPO='SindromRadioSpb/kolosei-hub'
WORKFLOW='.github/workflows/indexnow.yml'
def api(path):
    return json.loads(subprocess.check_output(['gh','api',path]))
def guard():
    if os.environ.get('GITHUB_REPOSITORY')!=REPO: raise RuntimeError('Wrong repository')
    event=json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
    head=api('repos/'+REPO+'/commits/main')['sha']
    if os.environ.get('GITHUB_EVENT_NAME')=='check_run': check=api('repos/'+REPO+'/check-runs/'+str(event['check_run']['id']))
    elif os.environ.get('GITHUB_EVENT_NAME')=='workflow_dispatch':
        checks=api('repos/'+REPO+'/commits/'+head+'/check-runs')['check_runs']
        candidates=[c for c in checks if c['name']=='Cloudflare Pages' and c['app']['id']==85455 and c['conclusion']=='success']
        if not candidates: raise RuntimeError('No successful production check')
        check=max(candidates,key=lambda x:x['id'])
    else: raise RuntimeError('Unsupported event')
    suite=api('repos/'+REPO+'/check-suites/'+str(check['check_suite']['id']))
    if not (check['name']=='Cloudflare Pages' and check['app']['id']==85455 and check['app']['slug']=='cloudflare-workers-and-pages' and check['status']=='completed' and check['conclusion']=='success' and check['head_sha']==head and suite['head_branch']=='main' and suite['head_sha']==head):
        raise RuntimeError('Not successful current production main check')
    if not re.fullmatch(r'https://dash\.cloudflare\.com/\?to=/3e189c3946c80c757e01a4162fa83a98/pages/view/kolosei-hub/[a-f0-9-]+',check['details_url']):
        raise RuntimeError('Unexpected Cloudflare project')
    expected=os.environ.get('EXPECTED_SHA')
    if expected and expected!=head: raise RuntimeError('main advanced during verification')
    with open(os.environ['GITHUB_OUTPUT'],'a') as out: out.write('sha='+head+'\n')
    print('Verified Cloudflare production check for main '+head)
def artifact_order(a):
    # GitHub artifact IDs are sharded, not chronological. Prefer creation time.
    m=re.fullmatch(r'indexnow-(state|intent)-(\d+)-(\d+)',a['name'])
    if not m or int(m[2])!=int(a['workflow_run']['id']) or not a.get('created_at'):
        raise RuntimeError('Invalid durable artifact identity/timestamp')
    return (a['created_at'], 1 if m[1]=='state' else 0)

def ordered_artifacts(values):
    values=sorted(values,key=artifact_order,reverse=True)
    for a,b in zip(values,values[1:]):
        if a['created_at']==b['created_at'] and a['name'].split('-')[2:]!=b['name'].split('-')[2:]:
            raise RuntimeError('Ambiguous cross-run artifact chronology')
    return values

def restore():
    target=Path('.indexnow-state'); target.mkdir(exist_ok=True)
    artifacts=[]
    for page in range(1,11):
        values=api(f'repos/{REPO}/actions/artifacts?per_page=100&page={page}')['artifacts']
        artifacts.extend(a for a in values if a['name'].startswith(('indexnow-state-','indexnow-intent-')))
        if len(values)<100: break
    candidates=[]
    for a in ordered_artifacts(artifacts):
        run=api(f'repos/{REPO}/actions/runs/'+str(a['workflow_run']['id']))
        if run['path']==WORKFLOW and run['head_branch']=='main' and run['event'] in ('check_run','workflow_dispatch') and int(run['id'])!=int(os.environ['GITHUB_RUN_ID']):
            candidates.append(a); break
    if not candidates:
        if os.environ.get('GITHUB_EVENT_NAME')!='workflow_dispatch' or os.environ.get('BOOTSTRAP')!='true':
            raise RuntimeError('No durable state artifact. Manual reviewed bootstrap/recovery required; never auto-init')
        # Bootstrap is an explicit one-time setup/recovery operation, never routine fallback.
        shutil.copyfile('scripts/indexnow/bootstrap-manifest.json',target/'manifest.json')
        print('Explicit reviewed baseline restored; no URLs submitted by bootstrap')
        return
    a=candidates[0]
    if a['expired']: raise RuntimeError('Latest state expired; manual recovery required')
    data=subprocess.check_output(['gh','api',f'repos/{REPO}/actions/artifacts/{a["id"]}/zip'])
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        for item in z.infolist():
            path=Path(item.filename)
            if path.is_absolute() or '..' in path.parts or '\\' in item.filename: raise RuntimeError('Unsafe artifact path')
        z.extractall(target)
    if not (target/'manifest.json').is_file(): raise RuntimeError('Missing manifest in artifact')
    if (target/'pending.json').exists(): raise RuntimeError('Previous durable intent unresolved; refuse duplicate POST')
    print('Restored durable artifact '+str(a['id']))
if __name__=='__main__':
    {'guard':guard,'restore':restore}[sys.argv[1]]()
