/**
 * Handles shown with the "New" badge on the reference homepage
 * (Maahi II Luxury Eid Pret + Silk Solids'26 rows in the supplied homepage HTML).
 *
 * The product records carry no `isNew` flag / tags, so this is a frontend-side
 * stand-in until `isNew` is populated in the product data.
 */
export const NEW_BADGE_HANDLES: ReadonlySet<string> = new Set([
  // Maahi II Luxury Eid Pret
  "iris-rm-03", "camilla", "freya", "smira", "bella", "ivy", "vienna", "livia",
  // Silk Solids'26
  "maraki", "noah", "amore", "zephyr", "moris", "sublime", "aroha", "amelie",
]);
