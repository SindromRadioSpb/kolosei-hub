import { publicFacts } from '../../data/agent-reference';
export function GET() {
  return new Response(JSON.stringify(publicFacts, null, 2) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
