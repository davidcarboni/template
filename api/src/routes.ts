
import { Routes } from '@scloud/lambda-api/dist/types';
import { ping } from './routes/ping';

const routes: Routes = {
  '/api/ping': { GET: { handler: ping } },
};

export default routes;
