/**
 * next/image yükleyicisi. Unsplash görselleri kendi CDN'inde (imgix) istenen genişlikte
 * kırpılıp sıkıştırılır — sunucumuz orijinal 8000 px dosyayı hiç çekmez. Diğer her şey
 * olduğu gibi döner.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (!src.startsWith('https://images.unsplash.com/')) return src;
  const url = new URL(src);
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality ?? 72));
  url.searchParams.set('auto', 'format');
  url.searchParams.set('fit', 'crop');
  return url.toString();
}
