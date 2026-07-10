// > Background image pool — one random image per pageload
// ! IMG_*.JPG 为相机原图，尺寸较大；生产环境建议压缩为 WebP
export const BG_IMAGES = [
  '1.jpg',
  '2.jpg',
  '6.jpg',
  'IMG_0201.JPG',
  'wp10079179.png',
  'wp10079181.jpg',
  'wp10079182.jpg',
  'wp10079184.png',
]

export function getRandomBg(): string {
  const img = BG_IMAGES[Math.floor(Math.random() * BG_IMAGES.length)]
  return `/images/bg/${img}`
}
