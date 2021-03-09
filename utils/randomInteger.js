export default function randomInteger(min, max) {
  const num = min + Math.random() * (max + 1 - min)
  return Math.floor(num)
}
