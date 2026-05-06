/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/login` | `/(tabs)` | `/(tabs)/` | `/(tabs)/journal` | `/(tabs)/journal/` | `/(tabs)/profile` | `/_sitemap` | `/journal` | `/journal/` | `/login` | `/profile`;
      DynamicRoutes: `/(tabs)/journal/daily/${Router.SingleRoutePart<T>}` | `/journal/daily/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/(tabs)/journal/daily/[day]` | `/journal/daily/[day]`;
    }
  }
}
