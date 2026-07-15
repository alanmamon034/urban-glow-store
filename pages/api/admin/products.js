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
    if (req.method === "GET") {
      const products = await getProducts();
      return res.status(200).json({ ok: true, products });
    }

    if (req.method === "POST") {
      const { name, price, category, image, images, tag, description, sizes, preorder } = req.body || {};
      if (!name || !price || !category) {
        return res.status(400).json({ ok: false, error: "Name, price, and category are required." });
      }
      const products = await getProducts();
      const imageList = Array.isArray(images) ? images : [];
      const product = {
        id: nanoid(8),
        name,
        price: Number(price),
        cat: category,
        image: imageList[0] || image || null,
        images: imageList,
        tag: tag || "",
        color: "#22112B",
        description: description || "",
        sizes: Array.isArray(sizes) ? sizes : (sizes ? String(sizes).split(",").map((s) => s.trim()).filter(Boolean) : []),
        preorder: !!preorder,
        reviews: [],
      };
      products.push(product);
      await saveProducts(products);
      return res.status(200).json({ ok: true, product });
    }

    if (req.method === "PUT") {
      const { id, name, price, category, image, images, tag, description, sizes, preorder } = req.body || {};
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });
      const products = await getProducts();
      const idx = products.findIndex((p) => String(p.id) === String(id));
      if (idx === -1) return res.status(404).json({ ok: false, error: "Product not found" });
      const imageList = images !== undefined ? images : products[idx].images;
      products[idx] = {
        ...products[idx],
        name: name ?? products[idx].name,
        price: price !== undefined ? Number(price) : products[idx].price,
        cat: category ?? products[idx].cat,
        image: (imageList && imageList[0]) || image || products[idx].image,
        images: imageList || [],
        tag: tag !== undefined ? tag : products[idx].tag,
        description: description !== undefined ? description : products[idx].description,
        sizes: sizes !== undefined
          ? (Array.isArray(sizes) ? sizes : String(sizes).split(",").map((s) => s.trim()).filter(Boolean))
          : products[idx].sizes,
        preorder: preorder !== undefined ? !!preorder : products[idx].preorder,
      };
      await saveProducts(products);
      return res.status(200).json({ ok: true, product: products[idx] });
    }

    if (req.method === "DELETE") {
      const { id } = req.body || {};
      if (!id) return res.status(400).json({ ok: false, error: "Missing id" });
      const products = await getProducts();
      const next = products.filter((p) => String(p.id) !== String(id));
      await saveProducts(next);
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
}
