
import { Route } from '@scloud/lambda-api/dist/types';
import { paths } from '@shared/routes';
import { ping } from './routes/ping';

export const routes: { [P in keyof typeof paths]: Route } = {
  '/ping': { GET: { handler: ping } },
  '/auth/apple': { POST: { handler: async () => ({ body: 'ok' }) } },
  '/auth/google': { POST: { handler: async () => ({ body: 'ok' }) } },
  '/user': { GET: { handler: async () => ({ body: 'ok' }) } },
  '/user/privacy-policy': { POST: { handler: async () => ({ body: 'ok' }) } },
};

export default routes;
