const BG_IMAGES = [
  '0.jpg',
  '1.jpg',
  '2.jpg',
  '3.jpg',
  '4.jpg',
  '5.jpg',
  '6.jpg',
  '7.webp',
  '8.jpg',
  '9.webp',
  'IMG_0201.JPG',
  'IMG_0204.JPG',
  'IMG_0208.JPG',
  'IMG_0218(1).JPG',
  'IMG_1001.JPG',
  'wp10079179.png',
  'wp10079181.jpg',
  'wp10079182.jpg',
  'wp10079184.png',
  'wp10079185.png',
]

export function getRandomBg(): string {
  const img = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)]
  return `/images/bg/${img}`
}
