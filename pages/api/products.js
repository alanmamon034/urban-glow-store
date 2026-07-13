import { getProducts } from "../../lib/products";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const products = await getProducts();
    res.status(200).json({ ok: true, products });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
}
