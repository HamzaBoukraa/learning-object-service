module.exports = {
    globalSetup: './src/tests/test_environment/setup.js',
    globalTeardown: './src/tests/test_environment/teardown.js',
    testEnvironment: './src/tests/test_environment/environment.js',
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