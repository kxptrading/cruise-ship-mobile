import { Image } from 'react-native'
import type { StyleProp, ImageStyle } from 'react-native'

const ASSETS = {
  // Journal sections
  tear_off_calendar:      require('../../assets/emoji/tear_off_calendar.png'),
  trophy:                 require('../../assets/emoji/trophy.png'),
  fork_and_knife:         require('../../assets/emoji/fork_and_knife.png'),
  performing_arts:        require('../../assets/emoji/performing_arts.png'),
  memo:                   require('../../assets/emoji/memo.png'),
  world_map:              require('../../assets/emoji/world_map.png'),
  // Tab bar
  water_wave:             require('../../assets/emoji/water_wave.png'),
  spiral_notepad:         require('../../assets/emoji/spiral_notepad.png'),
  bust_in_silhouette:     require('../../assets/emoji/bust_in_silhouette.png'),
  // Weather chips
  sun:                    require('../../assets/emoji/sun.png'),
  cloud:                  require('../../assets/emoji/cloud.png'),
  cloud_with_rain:        require('../../assets/emoji/cloud_with_rain.png'),
  wind_face:              require('../../assets/emoji/wind_face.png'),
  thermometer:            require('../../assets/emoji/thermometer.png'),
  sun_behind_small_cloud: require('../../assets/emoji/sun_behind_small_cloud.png'),
  snowflake:              require('../../assets/emoji/snowflake.png'),
  // Star rating
  star:                   require('../../assets/emoji/star.png'),
  // Misc
  ship:                   require('../../assets/emoji/ship.png'),
  sparkles:               require('../../assets/emoji/sparkles.png'),
  fire:                   require('../../assets/emoji/fire.png'),
} as const

export type EmojiKey = keyof typeof ASSETS

interface Props {
  name:    EmojiKey
  size?:   number
  opacity?: number
  style?:  StyleProp<ImageStyle>
}

export function FluentEmoji({ name, size = 32, opacity = 1, style }: Props) {
  return (
    <Image
      source={ASSETS[name]}
      style={[{ width: size, height: size, opacity }, style]}
      resizeMode="contain"
    />
  )
}

export { ASSETS as EMOJI }
