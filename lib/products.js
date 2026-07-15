import { redis } from "./redis";

const KEY = "products";

export const DEFAULT_PRODUCTS = [
  { id: "1", cat: "Women", name: "Wrap Midi Dress", price: 58, color: "#B4442E", tag: "Bestseller", image: null, reviews: [] },
  { id: "2", cat: "Women", name: "Linen Blazer", price: 74, color: "#5C6B4A", tag: "New", image: null, reviews: [] },
  { id: "3", cat: "Women", name: "Satin Slip Skirt", price: 42, color: "#8A5A6B", tag: "", image: null, reviews: [] },
  { id: "4", cat: "Women", name: "Ribbed Knit Top", price: 29, color: "#3E4C5E", tag: "", image: null, reviews: [] },
  { id: "5", cat: "Kids", name: "Corduroy Overalls", price: 34, color: "#C98A3E", tag: "New", image: null, reviews: [] },
  { id: "6", cat: "Kids", name: "Rainbow Tee Set", price: 22, color: "#4E8B7C", tag: "", image: null, reviews: [] },
  { id: "7", cat: "Kids", name: "Fleece Zip Hoodie", price: 27, color: "#B15A7B", tag: "Bestseller", image: null, reviews: [] },
  { id: "8", cat: "Kids", name: "Denim Pinafore", price: 31, color: "#6E5A8A", tag: "", image: null, reviews: [] },
  { id: "9", cat: "Wigs", name: "Body Wave 20\"", price: 145, color: "#2E2320", tag: "Bestseller", image: null, reviews: [] },
  { id: "10", cat: "Wigs", name: "Silky Straight 24\"", price: 168, color: "#4A2E1F", tag: "New", image: null, reviews: [] },
  { id: "11", cat: "Wigs", name: "Curly Bob 12\"", price: 98, color: "#1E1B1A", tag: "", image: null, reviews: [] },
  { id: "12", cat: "Wigs", name: "Honey Balayage 22\"", price: 175, color: "#8A5A2E", tag: "", image: null, reviews: [] },
  { id: "13", cat: "Shoes", name: "Block Heel Mule", price: 64, color: "#7A3B2E", tag: "", image: null, reviews: [] },
  { id: "14", cat: "Shoes", name: "Canvas Low-Top", price: 39, color: "#3E5C4E", tag: "New", image: null, reviews: [] },
  { id: "15", cat: "Shoes", name: "Ankle Strap Sandal", price: 52, color: "#B4442E", tag: "Bestseller", image: null, reviews: [] },
  { id: "16", cat: "Shoes", name: "Kids Light-Up Sneaker", price: 36, color: "#3E4C5E", tag: "", image: null, reviews: [] },
];

export async function getProducts() {
  const raw = await redis.get(KEY);
  if (!raw) return DEFAULT_PRODUCTS;
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

export async function saveProducts(products) {
  await redis.set(KEY, JSON.stringify(products));
}

export function averageRating(reviews) {
  if (!reviews || reviews.length === 0) return null;
  const sum = reviews.reduce((s, r) => s + Number(r.rating || 0), 0);
  return sum / reviews.length;
}
