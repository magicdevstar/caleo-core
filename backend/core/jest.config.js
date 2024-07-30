/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  modulePathIgnorePatterns: [
    'src/scheduled/test.ts',
    'src/workers/test.ts'
  ],
  testEnvironment: "node",
  transform: {
    "^.+.tsx?$": ["ts-jest",{
      tsConfig: 'tsconfig.test.json'
    }],
  },
};