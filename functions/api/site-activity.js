import { createActivityHandler } from '../../server/site-activity.mjs';

const handle = createActivityHandler({ cache: typeof caches === 'undefined' ? undefined : caches.default });
export const onRequest = (context) => handle(context);
