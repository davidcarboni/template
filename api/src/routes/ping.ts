import { Request, Response } from '@scloud/lambda-api/dist/types';

export async function ping(request: Request): Promise<Response> {
  console.log('ping', request.query);
  return {
    body: { message: 'pong' },
  };
}
