import middy from '@middy/core';
import { WebClient } from '@slack/web-api';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import type { APIGatewayProxyEventV2WithLambdaAuthorizer } from 'aws-lambda';

import logger from '../../utils/logger';
import { User } from '../../__generated__/resolvers-types';

const slack = new WebClient(process.env.SLACK_TOKEN);

export interface ParsedBody {
  error: Error
  info: Info
}

export interface Error {
  message: string
  stack: string
  name: string
}

export interface Info {
  componentStack: string
}

const forwardErrors = async (event: APIGatewayProxyEventV2WithLambdaAuthorizer<{
  user?: User;
}>) => {
  if (process.env.ENABLED_ALERTS === 'true') {
    const body: ParsedBody = JSON.parse(event.body || '{}');
    
    const response = await slack.chat.postMessage({
      channel: '#ui-alerts',
      text: `${process.env.STAGE?.toUpperCase()}: Error\n\`\`\`\n${body.error.message}\n\`\`\``,
      mrkdwn: true,
    });
  
    await slack.chat.postMessage({
      channel: '#ui-alerts',
      text: `User: \`${event.requestContext?.authorizer?.lambda?.user?.id}\``,
      mrkdwn: true,
      ...(response.message?.ts && {thread_ts: response.message?.ts})
    });
    await slack.chat.postMessage({
      channel: '#ui-alerts',
      text: `Raw error stack 👇\n\`\`\`\n${body.error.stack}\n\`\`\`\n`,
      mrkdwn: true,
      ...(response.message?.ts && {thread_ts: response.message?.ts})
    });
    await slack.chat.postMessage({
      channel: '#ui-alerts',
      text: `Error Boundary stack 👇\n\`\`\`${body.info.componentStack}\n\`\`\``,
      mrkdwn: true,
      ...(response.message?.ts && {thread_ts: response.message?.ts})
    });
  }

  return { message: 'ok' };
};

export const handler = middy(forwardErrors)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
