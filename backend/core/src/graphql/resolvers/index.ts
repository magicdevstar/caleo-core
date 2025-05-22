import { healthQuery, healthFields, healthMutation } from './health';
import { queryNotifications, mutationNotifications, notificationsFields } from './notifications';
import { organizationFields, organizationMutation, organizationQuery } from './organization';
import { vehicleCategoriesFields, vehicleCategoriesMutation, vehicleCategoriesQuery } from './vehicleCategories';
import { rankGroupFields, rankGroupMutation, rankGroupQuery } from './rankGroup';
import { queryRanks, mutationRanks, ranksFields } from './ranks';
import { skillsQuery, skillsMutation, skillsFields } from './skills';
import { queryEquipments, mutationEquipments, equipmentsFields } from './equipments';
import { userQuery, userMutation, userFields } from './users';
import { venueQuery, venueMutation, venueFields } from './venues';
import { eventsFields, eventsMutation, eventsQuery } from './events';
import { assignmentsFields, assignmentsMutation, assignmentsQuery } from './assignments';
import { shiftsQuery, shiftsFields, shiftsMutation } from './shifts';
import { shiftBufferRequestsQuery, shiftBufferRequestsMutation, shiftBufferRequestsFields } from './shiftBufferRequests';
import { shiftLotteryRequestsQuery, shiftLotteryRequestsMutation, shiftLotteryRequestsFields } from './shiftLotteryRequests';
import { queryLotteryCounter, mutationLotteryCounter, lotteryCounterFields } from './lotteryCounter';
import { siteLockQuery, siteLockMutation, siteLockFields } from './siteLock';
import {
  browserNotificationSubscriptionsFields,
  queryBrowserNotificationSubscriptions,
  mutationBrowserNotificationSubscriptions
} from './browserNotificationSubscriptions';
import { lotteryAnalyticsQuery, lotteryAnalyticsFields, lotteryAnalyticsMutation } from './lotteryAnalytics';
import { shiftInterestRequestsQuery, shiftInterestRequestsMutation, shiftInterestRequestsFields } from './shiftInterestRequests';
import { unitQuery, unitMutation, unitFields } from './unit';
import { queryDivision, mutationDivision, divisionFields } from './division';
import { queryDocusignEvents, mutationDocusignEvents, docusignEventsFields } from './docusignEvents';

export default {
  Query: {
    ...healthQuery,
    ...organizationQuery,
    ...userQuery,
    ...queryRanks,
    ...skillsQuery,
    ...venueQuery,
    ...queryNotifications,
    ...eventsQuery,
    ...assignmentsQuery,
    ...shiftsQuery,
    ...shiftBufferRequestsQuery,
    ...shiftLotteryRequestsQuery,
    ...queryLotteryCounter,
    ...siteLockQuery,
    ...queryBrowserNotificationSubscriptions,
    ...lotteryAnalyticsQuery,
    ...shiftInterestRequestsQuery,
    ...queryEquipments,
    ...unitQuery,
    ...queryDivision,
    ...queryDocusignEvents,
    ...vehicleCategoriesQuery,
    ...rankGroupQuery,
  },
  Mutation: {
    ...healthMutation,
    ...organizationMutation,
    ...userMutation,
    ...mutationRanks,
    ...skillsMutation,
    ...venueMutation,
    ...mutationNotifications,
    ...eventsMutation,
    ...assignmentsMutation,
    ...shiftsMutation,
    ...shiftBufferRequestsMutation,
    ...shiftLotteryRequestsMutation,
    ...mutationLotteryCounter,
    ...siteLockMutation,
    ...mutationBrowserNotificationSubscriptions,
    ...lotteryAnalyticsMutation,
    ...shiftInterestRequestsMutation,
    ...mutationEquipments,
    ...unitMutation,
    ...mutationDivision,
    ...vehicleCategoriesMutation,
    ...rankGroupMutation,
    ...mutationDocusignEvents,
  },
  ...healthFields,
  ...organizationFields,
  ...userFields,
  ...ranksFields,
  ...skillsFields,
  ...venueFields,
  ...notificationsFields,
  ...eventsFields,
  ...assignmentsFields,
  ...shiftsFields,
  ...shiftBufferRequestsFields,
  ...shiftLotteryRequestsFields,
  ...lotteryCounterFields,
  ...siteLockFields,
  ...browserNotificationSubscriptionsFields,
  ...lotteryAnalyticsFields,
  ...shiftInterestRequestsFields,
  ...equipmentsFields,
  ...unitFields,
  ...divisionFields,
  ...docusignEventsFields,
  ...vehicleCategoriesFields,
  ...rankGroupFields,
};
