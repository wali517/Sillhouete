/**
 * Product descriptions come from the store's own Shopify export as HTML
 * (Description, Price Includes, Colour, Fabric Detail, Customization, Note and a
 * size-chart <img>). This helper cleans that HTML for rendering and separates the
 * size-chart image(s) so they can be shown in their own section.
 */
export interface ParsedDescription {
  bodyHtml: string;
  images: string[];
}

export function parseDescription(html: string | undefined | null): ParsedDescription {
  let s = (html ?? "").replace(/<!--[\s\S]*?-->/g, "");

  // Safety: never render scripts, iframes, inline handlers or javascript: URLs.
  s = s
    .replace(/<\s*(script|style|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript:/gi, "");

  const images: string[] = [];
  s = s.replace(/<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi, (_m, src: string) => {
    images.push(src.startsWith("//") ? `https:${src}` : src);
    return "";
  });

  // Drop Shopify's inline font-size noise and empty wrappers.
  s = s
    .replace(/\sstyle="[^"]*"/gi, "")
    // The product page already shows a "Disclaimer" line, so skip the duplicate "Note".
    .replace(/<span>\s*<strong>\s*Note:\s*<\/strong>[\s\S]*?<\/span>/gi, "")
    .replace(/<span>\s*<\/span>/gi, "")
    .trim();

  return { bodyHtml: s, images };
}
