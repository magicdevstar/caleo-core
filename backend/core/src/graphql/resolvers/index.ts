import { health } from './health';
import { notification } from './notification';
import { organizationFields, organizationMutation, organizationQuery } from './organization';
import { vehicleCategoriesFields, vehicleCategoriesMutation, vehicleCategoriesQuery } from './vehicleCategories';
import { rankGroupFields, rankGroupMutation, rankGroupQuery } from './rankGroup';
import { rank } from './rank';
import { skill } from './skills';
import { equipment } from './equipments';
import { user } from './user';
import { venue } from './venue';
import { eventsFields, eventsMutation, eventsQuery } from './events';
import { assignmentsFields, assignmentsMutation, assignmentsQuery } from './assignments';
import { shiftsQuery, shiftsFields, shiftsMutation } from './shifts';
import { shiftBufferRequests } from './shiftBufferRequests';
import { shiftLotteryRequests } from './shiftLotteryRequests';
import { lotteryCounter } from './lotteryCounter';
import { siteLock } from './siteLock';
import { browserNotificationSubscriptions } from './browserNotificationSubscriptions';
import { lotteryAnalytics } from './lotteryAnalytics';
import { shiftInterestRequests } from './shiftInterestRequests';
import { unit } from './unit';
import { division } from './division';
import { docusignEvents } from './docusignEvents';

export default {
  Query: {
    ...health.Query,
    ...organizationQuery,
    ...user.Query,
    ...rank.Query,
    ...skill.Query,
    ...venue.Query,
    ...notification.Query,
    ...eventsQuery,
    ...assignmentsQuery,
    ...shiftsQuery,
    ...shiftBufferRequests.Query,
    ...shiftLotteryRequests.Query,
    ...lotteryCounter.Query,
    ...siteLock.Query,
    ...browserNotificationSubscriptions.Query,
    ...lotteryAnalytics.Query,
    ...shiftInterestRequests.Query,
    ...equipment.Query,
    ...unit.Query,
    ...division.Query,
    ...docusignEvents.Query,
    ...vehicleCategoriesQuery,
    ...rankGroupQuery,
  },
  Mutation: {
    ...health.Mutation,
    ...organizationMutation,
    ...user.Mutation,
    ...rank.Mutation,
    ...skill.Mutation,
    ...venue.Mutation,
    ...notification.Mutation,
    ...eventsMutation,
    ...assignmentsMutation,
    ...shiftsMutation,
    ...shiftBufferRequests.Mutation,
    ...shiftLotteryRequests.Mutation,
    ...lotteryCounter.Mutation,
    ...siteLock.Mutation,
    ...browserNotificationSubscriptions.Mutation,
    ...lotteryAnalytics.Mutation,
    ...shiftInterestRequests.Mutation,
    ...equipment.Mutation,
    ...unit.Mutation,
    ...division.Mutation,
    ...vehicleCategoriesMutation,
    ...rankGroupMutation,
  },
  ...health.fields,
  ...organizationFields,
  ...user.fields,
  ...rank.fields,
  ...skill.fields,
  ...venue.fields,
  ...notification.fields,
  ...eventsFields,
  ...assignmentsFields,
  ...shiftsFields,
  ...shiftBufferRequests.fields,
  ...shiftLotteryRequests.fields,
  ...lotteryCounter.fields,
  ...siteLock.fields,
  ...browserNotificationSubscriptions.fields,
  ...lotteryAnalytics.fields,
  ...shiftInterestRequests.fields,
  ...equipment.fields,
  ...unit.fields,
  ...division.fields,
  ...docusignEvents.fields,
  ...vehicleCategoriesFields,
  ...rankGroupFields,
};
