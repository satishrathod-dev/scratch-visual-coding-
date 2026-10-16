module.exports = {
  testEnvironment: "jest-environment-jsdom",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "<rootDir>/src/__tests__/__mocks__/fileMock.js",
    "\\.(png|jpg|jpeg|gif|svg)$": "<rootDir>/src/__tests__/__mocks__/fileMock.js",
  },
  testMatch: ["**/__tests__/**/*.test.js"],
};
