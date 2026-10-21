// Shopify CDN resizes via ?width=; other hosts are passed through untouched.
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("https://sillhouete.com/cdn/")) {
    return `${src}${src.includes("?") ? "&" : "?"}width=${width}`;
  }
  return src;
}
