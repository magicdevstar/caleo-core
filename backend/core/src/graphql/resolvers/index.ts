import { health } from './health';
import { notification } from './notification';
import { organization } from './organization';
import { rank } from './rank';
import { skill } from './skills';
import { user } from './user';
import { venue } from './venue';
import { event } from './event';
import { assignments } from './assignments';
import { shift } from './shifts';
import { shiftBufferRequests } from './shiftBufferRequests';
import { shiftLotteryRequests } from './shiftLotteryRequests';
import { lotteryCounter } from './lotteryCounter';
import { siteLock } from './siteLock';
import { browserNotificationSubscriptions } from './browserNotificationSubscriptions';
import { lotteryAnalytics } from './lotteryAnalytics';
import { shiftInterestRequests } from './shiftInterestRequests';

export default {
  Query: {
    ...health.Query,
    ...organization.Query,
    ...user.Query,
    ...rank.Query,
    ...skill.Query,
    ...venue.Query,
    ...notification.Query,
    ...event.Query,
    ...assignments.Query,
    ...shift.Query,
    ...shiftBufferRequests.Query,
    ...shiftLotteryRequests.Query,
    ...lotteryCounter.Query,
    ...siteLock.Query,
    ...browserNotificationSubscriptions.Query,
    ...lotteryAnalytics.Query,
    ...shiftInterestRequests.Query,
  },
  Mutation: {
    ...health.Mutation,
    ...organization.Mutation,
    ...user.Mutation,
    ...rank.Mutation,
    ...skill.Mutation,
    ...venue.Mutation,
    ...notification.Mutation,
    ...event.Mutation,
    ...assignments.Mutation,
    ...shift.Mutation,
    ...shiftBufferRequests.Mutation,
    ...shiftLotteryRequests.Mutation,
    ...lotteryCounter.Mutation,
    ...siteLock.Mutation,
    ...browserNotificationSubscriptions.Mutation,
    ...lotteryAnalytics.Mutation,
    ...shiftInterestRequests.Mutation,
  },
  ...health.fields,
  ...organization.fields,
  ...user.fields,
  ...rank.fields,
  ...skill.fields,
  ...venue.fields,
  ...notification.fields,
  ...event.fields,
  ...assignments.fields,
  ...shift.fields,
  ...shiftBufferRequests.fields,
  ...shiftLotteryRequests.fields,
  ...lotteryCounter.fields,
  ...siteLock.fields,
  ...browserNotificationSubscriptions.fields,
  ...lotteryAnalytics.fields,
  ...shiftInterestRequests.fields,
};
