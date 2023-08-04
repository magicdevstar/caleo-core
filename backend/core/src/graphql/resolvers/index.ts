const { health } = require('./health');
export default {
  Query: {
    ...health.Query,
  },
};
