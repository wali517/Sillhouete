/** Format price exactly as the real sillhouete.com: Rs.44,900 (no decimals) */
export const formatPrice = (n: number) =>
  `Rs.${Math.round(n).toLocaleString("en-US")}`;
