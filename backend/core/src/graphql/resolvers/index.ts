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
};
