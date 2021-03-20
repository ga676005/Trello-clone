import { zhTW } from 'date-fns/locale'
import { fromUnixTime, formatDistanceToNow } from 'date-fns'
export default function formatLastEditTime(unixTime) {
  const date = fromUnixTime(unixTime)
  return formatDistanceToNow(date, { suffix: true, locale: zhTW })
}