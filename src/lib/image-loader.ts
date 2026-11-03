// Shopify CDN resizes via ?width=; other hosts are passed through with width parameter as expected by Next.js.
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}width=${width}`;
}
