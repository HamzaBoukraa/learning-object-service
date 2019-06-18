module.exports = {
    testMatch: ["**/*.spec.js"],
    transform: {
      '^.+\\.js$': 'babel-jest'
    },
    moduleFileExtensions: [
      "js",
      "jsx"
    ],
    transformIgnorePatterns: ['<rootDir>/node_modules/']
  };



