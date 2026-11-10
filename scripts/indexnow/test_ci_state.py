import unittest,tempfile,json,os,io,zipfile
from pathlib import Path
from unittest.mock import patch
import ci_state as c
class GuardTests(unittest.TestCase):
    def call_guard(self,branch='main',sha='abc',app=85455):
        with tempfile.TemporaryDirectory() as d:
            event=Path(d)/'event.json';event.write_text(json.dumps({'check_run':{'id':12}}))
            check={'name':'Cloudflare Pages','app':{'id':app,'slug':'cloudflare-workers-and-pages'},'status':'completed','conclusion':'success','head_sha':sha,'check_suite':{'id':99},'details_url':'https://dash.cloudflare.com/?to=/3e189c3946c80c757e01a4162fa83a98/pages/view/kolosei-hub/123-abc'}
            def api(path):
                if 'commits/main' in path:return {'sha':'abc'}
                if 'check-runs' in path:return check
                return {'head_branch':branch,'head_sha':sha}
            with patch.dict(os.environ,{'GITHUB_REPOSITORY':c.REPO,'GITHUB_EVENT_PATH':str(event),'GITHUB_EVENT_NAME':'check_run','GITHUB_OUTPUT':str(Path(d)/'out')},clear=True),patch.object(c,'api',api):c.guard()
    def test_main(self):self.call_guard()
    def test_preview(self):
        with self.assertRaises(RuntimeError):self.call_guard(branch='preview')
    def test_old_sha(self):
        with self.assertRaises(RuntimeError):self.call_guard(sha='old')
    def test_wrong_app(self):
        with self.assertRaises(RuntimeError):self.call_guard(app=99)
    def restore_case(self,kind):
        with tempfile.TemporaryDirectory() as d:
            old=os.getcwd();os.chdir(d)
            try:
                a={'id':20,'name':'indexnow-intent-2-1','workflow_run':{'id':2},'created_at':'2026-11-10T17:13:15Z','expired':kind=='expired'}
                data=io.BytesIO()
                with zipfile.ZipFile(data,'w') as z:
                    z.writestr('manifest.json','{}');z.writestr('pending.json','{}')
                def api(path):
                    if 'artifacts?' in path:return {'artifacts':[] if kind=='missing' else [a]}
                    return {'path':c.WORKFLOW,'head_branch':'main','event':'check_run','id':2}
                with patch.dict(os.environ,{'GITHUB_RUN_ID':'3','GITHUB_EVENT_NAME':'check_run'},clear=True),patch.object(c,'api',api),patch.object(c.subprocess,'check_output',return_value=data.getvalue()):
                    with self.assertRaises(RuntimeError):c.restore()
            finally:os.chdir(old)
    def test_artifact_ids_not_chronological(self):
        intent={'id':99,'name':'indexnow-intent-2-1','workflow_run':{'id':2},'created_at':'2026-11-10T17:13:15Z'}
        final={'id':20,'name':'indexnow-state-2-1','workflow_run':{'id':2},'created_at':'2026-11-10T17:13:20Z'}
        self.assertEqual(c.ordered_artifacts([intent,final])[0]['id'],20)
        final['created_at']=intent['created_at']
        self.assertEqual(c.ordered_artifacts([intent,final])[0]['id'],20)
        final['name']='indexnow-state-3-1'; final['workflow_run']['id']=3
        with self.assertRaises(RuntimeError):c.ordered_artifacts([intent,final])
    def test_missing(self):self.restore_case('missing')
    def test_expired(self):self.restore_case('expired')
    def test_pending_intent(self):self.restore_case('pending')
if __name__=='__main__':unittest.main()
