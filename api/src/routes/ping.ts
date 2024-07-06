import { Request, Response } from '@scloud/lambda-api/dist/types';

export async function ping(request: Request): Promise<Response> {
  console.log('ping', request.query);
  return {
    statusCode: 200,
    body: { message: 'pong' },
  };
}
