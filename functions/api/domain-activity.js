import { createDomainActivityHandler } from '../../server/domain-activity.mjs';

const handle = createDomainActivityHandler({
  cache: typeof caches === 'undefined' ? undefined : caches.default,
  reportError: message => console.warn('domain-activity source unavailable:', message),
});
export const onRequest = context => handle(context);
