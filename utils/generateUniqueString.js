export default function generateUniqueString(length) {
  return Math.random()
    .toString(36)
    .substring(2, 2 + length)
}
