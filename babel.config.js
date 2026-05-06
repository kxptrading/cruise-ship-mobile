module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for expo-router
      'expo-router/babel',
      // Reanimated must be last
      'react-native-reanimated/plugin',
    ],
  }
}
