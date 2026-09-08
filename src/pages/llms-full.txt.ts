import { referenceMarkdown } from '../data/agent-reference';
export function GET() {
  return new Response(referenceMarkdown(), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
