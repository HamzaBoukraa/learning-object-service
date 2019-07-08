module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: [7016]
      }
    }
  },
  globalSetup: './test_environment/setup.js',
  globalTeardown: './test_environment/teardown.js',
  testEnvironment: './test_environment/environment.js',
  transform: {
    "\\.(ts|tsx)$": "ts-jest"
  },
  testRegex: "(src)/.*/.*(spec).(ts|tsx|js)$",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx"
  ]
};