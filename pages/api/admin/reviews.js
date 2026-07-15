import { nanoid } from "nanoid";
import { getProducts, saveProducts } from "../../../lib/products";

function isAuthed(req) {
  const pw = req.headers["x-admin-password"];
  return !!pw && pw === process.env.ADMIN_PASSWORD;
}

export default async function handler(req, res) {
  if (!isAuthed(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  try {
    if (req.method === "POST") {
      const { productId, name, rating, text, verified } = req.body || {};
      if (!productId || !name || !rating) {
        return res.status(400).json({ ok: false, error: "Product, name, and rating are required." });
      }
      const products = await getProducts();
      const idx = products.findIndex((p) => String(p.id) === String(productId));
      if (idx === -1) return res.status(404).json({ ok: false, error: "Product not found" });

      const review = {
        id: nanoid(8),
        name,
        rating: Math.max(1, Math.min(5, Number(rating))),
        text: text || "",
        verified: verified !== false,
        createdAt: Date.now(),
      };
      const reviews = products[idx].reviews || [];
      products[idx] = { ...products[idx], reviews: [...reviews, review] };
      await saveProducts(products);
      return res.status(200).json({ ok: true, review });
    }

    if (req.method === "DELETE") {
      const { productId, reviewId } = req.body || {};
      if (!productId || !reviewId) return res.status(400).json({ ok: false, error: "Missing ids" });
      const products = await getProducts();
      const idx = products.findIndex((p) => String(p.id) === String(productId));
      if (idx === -1) return res.status(404).json({ ok: false, error: "Product not found" });

      const reviews = (products[idx].reviews || []).filter((r) => String(r.id) !== String(reviewId));
      products[idx] = { ...products[idx], reviews };
      await saveProducts(products);
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
}
