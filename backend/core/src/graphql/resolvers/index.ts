import { health } from './health';
import { organization } from './organization';
import { user } from './user';

export default {
  Query: {
    ...health.Query,
    ...organization.Query,
    ...user.Query,
  },
  Mutation: {
    ...health.Mutation,
    ...organization.Mutation,
    ...user.Mutation,
  },
  ...health.fields,
  ...organization.fields,
  ...user.fields,
};
