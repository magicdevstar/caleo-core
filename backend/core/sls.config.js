module.exports = async ({ options, resolveVariable }) => {
  return {
    concurrency: process.env.BUILD_CONCURRENCY ? parseInt(process.env.BUILD_CONCURRENCY) : Infinity,
  };
};
