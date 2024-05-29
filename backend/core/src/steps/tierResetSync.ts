import middy from '@middy/core';
import { injectLambdaContext } from '@aws-lambda-powertools/logger';

import logger from '../utils/logger';
import { createContext } from '../utils/createContext';
import { MemberStatus, MemberTier } from '../__generated__/resolvers-types';

const tierResetSync = async () => {
  const { users } = await createContext();

  logger.setLogLevel('INFO');

  const res = await users.collection.updateMany({
    'member.tier': MemberTier.Tier_2,
    'member.status': MemberStatus.Active,
    '$or': [
      {'member.tierResetOnNextLottery': false},
      // Not sure how this is happening
      {'member.tierResetOnNextLottery': null},
    ],
    'member.tierUntil': { $lte: Date.now() }
  }, {
    $set: {
      'member.tier': MemberTier.Tier_1,
      'member.tierResetOnNextLottery': false,
    },
    $unset: {
      'member.tierUntil': '',
    }
  });

  logger.info('Tier reset results', { res });
};

export const handler = middy(tierResetSync)
  .use(injectLambdaContext(logger, {
    logEvent: process.env.STAGE !== 'prod',
    clearState: true
  }));
