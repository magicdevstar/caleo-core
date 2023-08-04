import { health } from './health';
import { organization } from './organization';

export default {
  Query: {
    ...health.Query,
  },
  Mutation: {
    ...organization.Mutation,
  },
};
