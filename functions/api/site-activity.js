import { createActivityHandler } from '../../server/site-activity.mjs';

const handle = createActivityHandler({
  cache: typeof caches === 'undefined' ? undefined : caches.default,
  reportError: message => console.warn('site-activity source unavailable:', message),
});
export const onRequest = (context) => handle(context);
