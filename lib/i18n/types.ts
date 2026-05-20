/** Leaf strings stay `string`; nested objects keep the same keys as the Spanish catalog. */
export type DeepStrings<T> = {
  [K in keyof T]: T[K] extends Record<string, unknown> ? DeepStrings<T[K]> : string;
};
