// https://aws.amazon.com/blogs/mobile/understanding-amazon-cognito-user-pool-oauth-2-0-grants/
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { apiHandler } from '@scloud/lambda-api';
import { Request, Response } from '@scloud/lambda-api/dist/types';
import { webappLocal } from '@scloud/lambda-local';
import routes from './routes';
import { slackLog } from './helpers/slack';

async function errorHandler(request: Request, e: Error): Promise<Response> {
  await slackLog(`${e.stack}`);
  return { statusCode: 500, body: { error: `Internal server error: ${request.path}` } };
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  try {
    const result = await apiHandler(event, context, routes, errorHandler);
    return result;
  } catch (e) {
    await slackLog(`${(e as Error).stack}`);
    return {
      statusCode: 500,
      body: 'Error',
    };
  }
}

// Used when running the function locally via 'local.sh'
(async () => {
  if (process.argv.includes('--local')) {
    webappLocal(handler);
  }
})();
