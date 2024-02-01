import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import getClient, { AtlasError, GetClusterResponse } from "mongodb-atlas-api-client";

import logger from '../utils/logger';

const {
  cluster,
} = getClient({
  publicKey: process.env.MONGO_PUBLIC_KEY!,
  privateKey: process.env.MONGO_PRIVATE_KEY!,
  baseUrl: 'https://cloud.mongodb.com/api/atlas/v1.0',
  projectId: process.env.MONGO_PROJECT_ID!,
});

const CLUSTER_NAME = 'caleo-pro-prod';
const DESIRED_INSTANCE_SIZE = 'M10';

const mongoResize = async () => {
  try {
    const clusterMeta = await cluster.get(CLUSTER_NAME);

    if ('error' in clusterMeta) {
      throw (clusterMeta as AtlasError);
    }

    if (clusterMeta?.providerSettings?.instanceSizeName !== DESIRED_INSTANCE_SIZE) {
      const res = await cluster.update(CLUSTER_NAME, {
        name: clusterMeta.name,
        providerSettings: {
          ...(clusterMeta.providerSettings || {}),
          instanceSizeName: DESIRED_INSTANCE_SIZE,
        },
      });
      logger.info('Cluster updated', { res });
    }
  } catch(error) {
    logger.error(error);
  }
};

export const handler = middy(mongoResize)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
