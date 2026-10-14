export const fixtureId = (value: number) =>
  `0199a000-0000-7000-8000-${String(value).padStart(12, "0")}`;
export interface Taxon {
  id: string;
  parent_id: string | null;
  slug: string;
  es: string;
  en: string;
}
export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  categories: string[];
  cuisines: string[];
  dietary: string[];
  accessibility: string[];
  tags: string[];
  priceLevel: number | null;
  prices: Partial<Record<"CRC" | "USD", number>>;
  rating: number | null;
  reviews: number;
  hours: { start: number; end: number } | null;
  description: { es: string; en: string };
  tone: string;
}
const taxon = (
  value: number,
  slug: string,
  es: string,
  en: string,
  parent: number | null = null,
): Taxon => ({
  id: fixtureId(value),
  parent_id: parent === null ? null : fixtureId(parent),
  slug,
  es,
  en,
});
export const TAXONOMIES = {
  categories: [
    taxon(1, "coffee", "Cafés", "Coffee"),
    taxon(2, "restaurants", "Restaurantes", "Restaurants"),
    taxon(3, "active", "Actividades", "Activities"),
    taxon(4, "outdoor", "Al aire libre", "Outdoors", 3),
  ],
  cuisines: [
    taxon(11, "costa-rican", "Costarricense", "Costa Rican"),
    taxon(12, "italian", "Italiana", "Italian"),
    taxon(13, "sushi", "Sushi", "Sushi"),
    taxon(14, "vegetarian", "Vegetariana", "Vegetarian"),
    taxon(15, "vegan", "Vegana", "Vegan"),
    taxon(16, "desserts", "Postres", "Desserts"),
  ],
  features: [
    taxon(21, "step-free", "Acceso sin escalones", "Step-free access"),
    taxon(22, "accessible-toilet", "Baño accesible", "Accessible toilet"),
    taxon(
      23,
      "vegetarian-options",
      "Opciones vegetarianas",
      "Vegetarian options",
    ),
    taxon(24, "vegan-options", "Opciones veganas", "Vegan options"),
  ],
  tags: [
    taxon(31, "quiet", "Tranquilo", "Quiet"),
    taxon(32, "casual", "Casual", "Casual"),
    taxon(33, "outdoor", "Al aire libre", "Outdoors"),
    taxon(34, "active", "Activo", "Active"),
    taxon(35, "first-date", "Primera cita", "First date"),
  ],
};
const ids = (...values: number[]) => values.map(fixtureId);
// Fictional editorial fixtures only. No actual business, user, external rating or provider content.
export const PLACES: Place[] = [
  {
    id: fixtureId(101),
    name: "Jardín de papel",
    address: "Barrio Amón · ubicación ilustrativa",
    latitude: 9.9391,
    longitude: -84.0745,
    categories: ids(1),
    cuisines: ids(16, 14),
    dietary: ids(23),
    accessibility: ids(21),
    tags: ids(31, 35),
    priceLevel: 1,
    prices: { CRC: 4500, USD: 9 },
    rating: 4.7,
    reviews: 12,
    hours: { start: 8, end: 20 },
    description: {
      es: "Un café de ejemplo para conversar entre libros, café y algo dulce.",
      en: "A fictional café for conversations over books, coffee and something sweet.",
    },
    tone: "sage",
  },
  {
    id: fixtureId(102),
    name: "Mesa de luna",
    address: "Barrio Escalante · ubicación ilustrativa",
    latitude: 9.9345,
    longitude: -84.0594,
    categories: ids(2),
    cuisines: ids(12, 14),
    dietary: ids(23),
    accessibility: ids(21, 22),
    tags: ids(31),
    priceLevel: 3,
    prices: { CRC: 14000, USD: 28 },
    rating: 4.8,
    reviews: 18,
    hours: { start: 12, end: 23 },
    description: {
      es: "Restaurante ficticio de pastas y mesas pequeñas para una cena pausada.",
      en: "A fictional pasta restaurant with small tables for a relaxed dinner.",
    },
    tone: "peach",
  },
  {
    id: fixtureId(103),
    name: "Sendero compartido",
    address: "La Sabana · ubicación ilustrativa",
    latitude: 9.9354,
    longitude: -84.1043,
    categories: ids(3, 4),
    cuisines: [],
    dietary: [],
    accessibility: ids(21),
    tags: ids(33, 34, 32),
    priceLevel: 0,
    prices: { CRC: 0, USD: 0 },
    rating: 4.5,
    reviews: 8,
    hours: { start: 6, end: 18 },
    description: {
      es: "Paseo de ejemplo al aire libre, sin costo, para caminar a su ritmo.",
      en: "An illustrative free outdoor walk to enjoy at your own pace.",
    },
    tone: "sand",
  },
  {
    id: fixtureId(104),
    name: "Nube de cacao",
    address: "Los Yoses · ubicación ilustrativa",
    latitude: 9.9275,
    longitude: -84.0516,
    categories: ids(1),
    cuisines: ids(16, 15),
    dietary: ids(23, 24),
    accessibility: ids(21, 22),
    tags: ids(32, 35),
    priceLevel: 1,
    prices: { CRC: 5500, USD: 11 },
    rating: 4.6,
    reviews: 9,
    hours: { start: 9, end: 21 },
    description: {
      es: "Un rincón ficticio de cacao, postres y opciones veganas.",
      en: "A fictional corner for cocoa, desserts and vegan choices.",
    },
    tone: "rose",
  },
  {
    id: fixtureId(105),
    name: "Sakura de ejemplo",
    address: "San Pedro · ubicación ilustrativa",
    latitude: 9.933,
    longitude: -84.0379,
    categories: ids(2),
    cuisines: ids(13, 14),
    dietary: ids(23),
    accessibility: [],
    tags: ids(32),
    priceLevel: 2,
    prices: { CRC: 10000, USD: 20 },
    rating: 4.4,
    reviews: 15,
    hours: { start: 11, end: 22 },
    description: {
      es: "Lugar de demostración para compartir sushi; accesibilidad sin verificar.",
      en: "A demo place to share sushi; accessibility is unverified.",
    },
    tone: "sage",
  },
  {
    id: fixtureId(106),
    name: "Patio del sol",
    address: "Barrio México · ubicación ilustrativa",
    latitude: 9.9401,
    longitude: -84.088,
    categories: ids(2),
    cuisines: ids(11, 14),
    dietary: ids(23),
    accessibility: ids(21),
    tags: ids(33, 32),
    priceLevel: 1,
    prices: { CRC: 6500, USD: 13 },
    rating: 4.3,
    reviews: 7,
    hours: { start: 7, end: 19 },
    description: {
      es: "Cocina costarricense de ejemplo en un patio abierto.",
      en: "Illustrative Costa Rican cooking in an open courtyard.",
    },
    tone: "sand",
  },
  {
    id: fixtureId(107),
    name: "Roca y risas",
    address: "Rohrmoser · ubicación ilustrativa",
    latitude: 9.949,
    longitude: -84.117,
    categories: ids(3),
    cuisines: [],
    dietary: [],
    accessibility: [],
    tags: ids(34),
    priceLevel: 2,
    prices: { CRC: 9000, USD: 18 },
    rating: 4.8,
    reviews: 6,
    hours: { start: 10, end: 22 },
    description: {
      es: "Actividad ficticia de escalada; confirme necesidades de acceso antes de una actividad real.",
      en: "A fictional climbing activity; check access needs before a real activity.",
    },
    tone: "peach",
  },
  {
    id: fixtureId(108),
    name: "Pausa verde",
    address: "Curridabat · ubicación ilustrativa",
    latitude: 9.918,
    longitude: -84.034,
    categories: ids(1, 2),
    cuisines: ids(15, 14),
    dietary: ids(23, 24),
    accessibility: ids(21),
    tags: ids(31, 33),
    priceLevel: null,
    prices: {},
    rating: null,
    reviews: 0,
    hours: null,
    description: {
      es: "Lugar ficticio con datos incompletos: precio, horario y puntuación no disponibles.",
      en: "A fictional place with incomplete data: price, hours and rating unavailable.",
    },
    tone: "sage",
  },
];
