/** Task category keys (DB may store Spanish labels; map via lib/i18n/categoryLabels.ts). */
export const categoryKeys = [
  'hogar',
  'trabajo',
  'personal',
  'salud',
  'contenido',
  'marca',
  'otros',
] as const;

export type CategoryKey = (typeof categoryKeys)[number];

export const categoriesEs = {
  hogar: 'Hogar',
  trabajo: 'Trabajo',
  personal: 'Personal',
  salud: 'Salud',
  contenido: 'Contenido',
  marca: 'Marca',
  otros: 'Otros',
} as const;

export const categoriesEn = {
  hogar: 'Home',
  trabajo: 'Work',
  personal: 'Personal',
  salud: 'Health',
  contenido: 'Content',
  marca: 'Brand',
  otros: 'Other',
} as const;
