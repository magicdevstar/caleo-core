/** @type {import('ts-jest').JestConfigWithTsJest} **/

process.env.MONGODB_NAME = 'jest';
process.env.STAGE = 'jest';
process.env.DOCUSIGN_BASE = 'https://account-d.docusign.com';
process.env.MAILER_LAMBDA = 'mailer-stub';
process.env.SHIFT_NOTIFICATION_SCHEDULER = 'shift-notification-scheduler-stub';

module.exports = {
  modulePathIgnorePatterns: [
    'src/scheduled/test.ts',
    'src/workers/test.ts'
  ],
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: 'tsconfig.test.json'
    }],
  },
  preset: 'ts-jest',
  // Support for .only tests
  verbose: true,
  // Keep watching for changes in test files
  watchPathIgnorePatterns: ['node_modules'],
  // Reset mocks between tests
  resetMocks: true
};
