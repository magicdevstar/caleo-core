import { health } from './health';
import { organization } from './organization';
import { rank } from './rank';
import { user } from './user';

export default {
  Query: {
    ...health.Query,
    ...organization.Query,
    ...user.Query,
    ...rank.Query,
  },
  Mutation: {
    ...health.Mutation,
    ...organization.Mutation,
    ...user.Mutation,
    ...rank.Mutation,
  },
  ...health.fields,
  ...organization.fields,
  ...user.fields,
  ...rank.fields,
};
