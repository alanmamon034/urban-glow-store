import { useEffect, useState } from "react";
import Head from "next/head";

const CATEGORIES = ["Women", "Kids", "Wigs", "Shoes", "2026 Swim", "Cowgirls", "Cowboys", "Mommas", "Nursery Decor"];
const SIZE_PRESETS = {
  "Baby (0-24M)": "0-3M, 3-6M, 6-12M, 12-18M, 18-24M",
  "Baby+Toddler (0/3M-5T)": "0/3M, 3/6M, 6/12M, 12/18M, 2T, 3T, 4T, 5T",
  "Kids (2T-14)": "2T, 3T, 4T, 5, 6, 7, 8, 10, 12, 14",
  "Adult (XS-XL)": "XS, S, M, L, XL",
};
const EMPTY_FORM = { name: "", price: "", category: "Women", tag: "", images: [], description: "", sizes: "", preorder: false };

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewOpenId, setReviewOpenId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ name: "", rating: "5", text: "", verified: true });
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem("ugb_admin_pw") : null;
    if (saved) {
      setPassword(saved);
      login(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(pw) {
    setAuthError("");
    setChecking(true);
    try {
      const res = await fetch("/api/admin/products", { headers: { "x-admin-password": pw } });
      const data = await res.json();
      if (data.ok) {
        setAuthed(true);
        setProducts(data.products);
        sessionStorage.setItem("ugb_admin_pw", pw);
      } else {
        setAuthError("Wrong password.");
      }
    } catch (e) {
      setAuthError("Couldn't reach the server.");
    } finally {
      setChecking(false);
    }
  }

  async function refreshProducts() {
    const res = await fetch("/api/admin/products", { headers: { "x-admin-password": password } });
    const data = await res.json();
    if (data.ok) setProducts(data.products);
  }

  async function uploadImages(files) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      alert("Cloudinary isn't configured yet — add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your environment variables.");
      return;
    }
    const fileArray = Array.from(files).slice(0, 10);
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of fileArray) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", preset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (data.secure_url) uploaded.push(data.secure_url);
      }
      if (uploaded.length === 0) {
        alert("Upload failed — check your Cloudinary preset settings.");
        return;
      }
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded].slice(0, 10) }));
    } catch (e) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  async function submitProduct() {
    if (!form.name.trim() || !form.price) {
      alert("Name and price are required.");
      return;
    }
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...form, id: editingId } : form;
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.ok) {
        setForm(EMPTY_FORM);
        setEditingId(null);
        await refreshProducts();
      } else {
        alert(data.error || "Couldn't save the product.");
      }
    } finally {
      setSaving(false);
    }
  }

  function startEdit(p) {
    setForm({
      name: p.name, price: p.price, category: p.cat, tag: p.tag || "",
      images: (p.images && p.images.length ? p.images : (p.image ? [p.image] : [])),
      description: p.description || "", sizes: (p.sizes || []).join(", "), preorder: !!p.preorder,
    });
    setEditingId(p.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }

  async function deleteProduct(id) {
    if (!confirm("Delete this product? This can't be undone.")) return;
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (data.ok) refreshProducts();
  }

  async function submitReview(productId) {
    if (!reviewForm.name.trim()) {
      alert("Reviewer name is required.");
      return;
    }
    setSavingReview(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ productId, ...reviewForm }),
      });
      const data = await res.json();
      if (data.ok) {
        setReviewForm({ name: "", rating: "5", text: "", verified: true });
        await refreshProducts();
      } else {
        alert(data.error || "Couldn't save the review.");
      }
    } finally {
      setSavingReview(false);
    }
  }

  async function deleteReview(productId, reviewId) {
    if (!confirm("Delete this review?")) return;
    const res = await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ productId, reviewId }),
    });
    const data = await res.json();
    if (data.ok) refreshProducts();
  }

  if (!authed) {
    return (
      <div style={pageWrap}>
        <Head><title>Admin — Urban Glow Boutique</title></Head>
        <div style={{ background: "#fff", padding: "28px", borderRadius: "8px", width: "300px" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", marginTop: 0, color: "#6E2A2E" }}>Admin Login</h2>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login(password)}
            style={inputStyle}
          />
          {authError && <div style={{ color: "#B4442E", fontSize: "12px", marginBottom: "10px" }}>{authError}</div>}
          <button onClick={() => login(password)} disabled={checking} style={primaryBtn}>
            {checking ? "Checking…" : "Log in"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F4EDE2", fontFamily: "'Inter', sans-serif", padding: "28px" }}>
      <Head><title>Admin — Urban Glow Boutique</title></Head>

      <h1 style={{ fontFamily: "'Fraunces', serif", color: "#6E2A2E", marginBottom: "4px" }}>Urban Glow Boutique — Admin</h1>
      <p style={{ color: "#8A6A6E", marginTop: 0, fontSize: "13px" }}>
        <a href="/" style={{ color: "#8A6A6E" }}>← Back to store</a>
      </p>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", maxWidth: "460px", marginBottom: "34px" }}>
        <h3 style={{ marginTop: 0, color: "#6E2A2E" }}>{editingId ? "Edit product" : "Add a product"}</h3>

        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        <input placeholder="Price (USD)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Tag (optional — e.g. New, Bestseller)" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} style={inputStyle} />
        <textarea
          placeholder="Description (details, care instructions, etc. — shown on the product page)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#8A6A6E", marginBottom: "12px" }}>
          <input
            type="checkbox"
            checked={form.preorder}
            onChange={(e) => setForm({ ...form, preorder: e.target.checked })}
          />
          Pre-order item (not in stock yet)
        </label>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "12px", color: "#8A6A6E", display: "block", marginBottom: "6px" }}>
            Product photos ({form.images.length}/10 — select multiple at once, or add more one at a time)
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files.length && uploadImages(e.target.files)}
          />
          {uploading && <div style={{ fontSize: "12px", color: "#8A6A6E", marginTop: "6px" }}>Uploading…</div>}
          {form.images.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
              {form.images.map((url, i) => (
                <div key={url + i} style={{ position: "relative" }}>
                  <img src={url} alt={`photo ${i + 1}`} style={{ height: "70px", width: "70px", objectFit: "cover", borderRadius: "5px", display: "block" }} />
                  <button
                    onClick={() => removeImage(i)}
                    title="Remove photo"
                    style={{
                      position: "absolute", top: "-6px", right: "-6px", background: "#B4442E", color: "#fff",
                      border: "none", borderRadius: "50%", width: "18px", height: "18px", fontSize: "11px",
                      cursor: "pointer", lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                  {i === 0 && (
                    <span style={{ position: "absolute", bottom: "-6px", left: "0", right: "0", textAlign: "center", fontSize: "9px", background: "#6E2A2E", color: "#F4EDE2", borderRadius: "3px", padding: "1px 0" }}>
                      MAIN
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "12px", color: "#8A6A6E", display: "block", marginBottom: "6px" }}>Size list</label>
          <select
            onChange={(e) => e.target.value && setForm({ ...form, sizes: SIZE_PRESETS[e.target.value] })}
            defaultValue=""
            style={{ ...inputStyle, marginBottom: "6px" }}
          >
            <option value="">— Pick a preset (optional) —</option>
            {Object.keys(SIZE_PRESETS).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            placeholder="Sizes, comma-separated (e.g. 0/3M, 3/6M, 6/12M, 12/18M, 2T, 3T, 4T, 5T)"
            value={form.sizes}
            onChange={(e) => setForm({ ...form, sizes: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={submitProduct} disabled={saving} style={primaryBtn}>
            {saving ? "Saving…" : editingId ? "Save changes" : "Add product"}
          </button>
          {editingId && (
            <button onClick={cancelEdit} style={secondaryBtn}>Cancel</button>
          )}
        </div>
      </div>

      <h3 style={{ color: "#6E2A2E" }}>Products ({products.length})</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
        {products.map((p) => (
          <div key={p.id} style={{ background: "#fff", borderRadius: "6px", padding: "12px" }}>
            {p.image ? (
              <img src={p.image} alt={p.name} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "4px" }} />
            ) : (
              <div style={{ width: "100%", height: "120px", background: p.color || "#6E2A2E", borderRadius: "4px" }} />
            )}
            <div style={{ fontWeight: 600, marginTop: "8px", fontSize: "14px", color: "#6E2A2E" }}>{p.name}</div>
            <div style={{ fontSize: "12px", color: "#8A6A6E" }}>{p.cat} · ${p.price}{p.tag ? ` · ${p.tag}` : ""}</div>
            <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
              <button onClick={() => startEdit(p)} style={smallBtn}>Edit</button>
              <button onClick={() => deleteProduct(p.id)} style={{ ...smallBtn, color: "#B4442E", borderColor: "#B4442E55" }}>Delete</button>
              <button onClick={() => setReviewOpenId(reviewOpenId === p.id ? null : p.id)} style={smallBtn}>
                Reviews ({(p.reviews || []).length})
              </button>
            </div>

            {reviewOpenId === p.id && (
              <div style={{ marginTop: "10px", borderTop: "1px dashed #DCCBAE", paddingTop: "10px" }}>
                {(p.reviews || []).map((r) => (
                  <div key={r.id} style={{ marginBottom: "8px", fontSize: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>
                        <span style={{ fontWeight: 600, color: "#6E2A2E" }}>{r.name}</span>
                        {r.verified && (
                          <span style={{ marginLeft: "6px", background: "#6E2A2E", color: "#F4EDE2", fontSize: "9px", padding: "1px 5px", borderRadius: "3px", letterSpacing: "0.03em" }}>
                            VERIFIED
                          </span>
                        )}
                      </span>
                      <button onClick={() => deleteReview(p.id, r.id)} style={{ background: "none", border: "none", color: "#B4442E", cursor: "pointer", fontSize: "11px" }}>
                        remove
                      </button>
                    </div>
                    <div style={{ color: "#D4A544" }}>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                    {r.text && <div style={{ color: "#8A6A6E" }}>{r.text}</div>}
                  </div>
                ))}
                {(p.reviews || []).length === 0 && (
                  <div style={{ fontSize: "12px", color: "#8A6A6E", marginBottom: "8px" }}>No reviews yet.</div>
                )}

                <div style={{ marginTop: "6px" }}>
                  <input
                    placeholder="Reviewer name"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                    style={{ ...inputStyle, marginBottom: "6px", fontSize: "12px", padding: "7px" }}
                  />
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: e.target.value })}
                    style={{ ...inputStyle, marginBottom: "6px", fontSize: "12px", padding: "7px" }}
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{"★".repeat(n)} ({n})</option>
                    ))}
                  </select>
                  <textarea
                    placeholder="Review text (optional)"
                    value={reviewForm.text}
                    onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })}
                    rows={2}
                    style={{ ...inputStyle, marginBottom: "6px", fontSize: "12px", padding: "7px", resize: "vertical" }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#8A6A6E", marginBottom: "8px" }}>
                    <input
                      type="checkbox"
                      checked={reviewForm.verified}
                      onChange={(e) => setReviewForm({ ...reviewForm, verified: e.target.checked })}
                    />
                    Verified purchase
                  </label>
                  <button onClick={() => submitReview(p.id)} disabled={savingReview} style={{ ...primaryBtn, fontSize: "12px", padding: "7px 12px" }}>
                    {savingReview ? "Saving…" : "Add review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const pageWrap = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "'Inter', sans-serif", background: "#F4EDE2",
};
const inputStyle = {
  width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "5px",
  border: "1px solid #DCCBAE", fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const primaryBtn = {
  padding: "10px 16px", border: "none", background: "#6E2A2E", color: "#fff",
  borderRadius: "5px", cursor: "pointer", fontSize: "13px",
};
const secondaryBtn = {
  padding: "10px 16px", border: "1px solid #DCCBAE", background: "none",
  borderRadius: "5px", cursor: "pointer", fontSize: "13px", color: "#6E2A2E",
};
const smallBtn = {
  fontSize: "12px", padding: "5px 10px", border: "1px solid #DCCBAE",
  background: "none", borderRadius: "4px", cursor: "pointer", color: "#6E2A2E",
};
