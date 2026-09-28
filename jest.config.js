module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '^react-native-mmkv$': '<rootDir>/__mocks__/react-native-mmkv.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|react-native-screens|react-native-safe-area-context|@react-navigation)/)',
  ],
};
