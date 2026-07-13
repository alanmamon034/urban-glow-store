import { useEffect, useState } from "react";
import Head from "next/head";

const CATEGORIES = ["Women", "Kids", "Wigs", "Shoes"];
const EMPTY_FORM = { name: "", price: "", category: "Women", tag: "", image: "" };

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

  async function uploadImage(file) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      alert("Cloudinary isn't configured yet — add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET to your environment variables.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.secure_url) {
        setForm((f) => ({ ...f, image: data.secure_url }));
      } else {
        alert("Upload failed — check your Cloudinary preset settings.");
      }
    } catch (e) {
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
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
    setForm({ name: p.name, price: p.price, category: p.cat, tag: p.tag || "", image: p.image || "" });
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

  if (!authed) {
    return (
      <div style={pageWrap}>
        <Head><title>Admin — Urban Glow Boutique</title></Head>
        <div style={{ background: "#fff", padding: "28px", borderRadius: "8px", width: "300px" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", marginTop: 0, color: "#22112B" }}>Admin Login</h2>
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
    <div style={{ minHeight: "100vh", background: "#F3EEF5", fontFamily: "'Inter', sans-serif", padding: "28px" }}>
      <Head><title>Admin — Urban Glow Boutique</title></Head>

      <h1 style={{ fontFamily: "'Fraunces', serif", color: "#22112B", marginBottom: "4px" }}>Urban Glow Boutique — Admin</h1>
      <p style={{ color: "#7A6A80", marginTop: 0, fontSize: "13px" }}>
        <a href="/" style={{ color: "#7A6A80" }}>← Back to store</a>
      </p>

      <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", maxWidth: "460px", marginBottom: "34px" }}>
        <h3 style={{ marginTop: 0, color: "#22112B" }}>{editingId ? "Edit product" : "Add a product"}</h3>

        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
        <input placeholder="Price (USD)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inputStyle}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input placeholder="Tag (optional — e.g. New, Bestseller)" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} style={inputStyle} />

        <div style={{ marginBottom: "12px" }}>
          <label style={{ fontSize: "12px", color: "#7A6A80", display: "block", marginBottom: "6px" }}>Product photo</label>
          <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && uploadImage(e.target.files[0])} />
          {uploading && <div style={{ fontSize: "12px", color: "#7A6A80", marginTop: "6px" }}>Uploading…</div>}
          {form.image && (
            <img src={form.image} alt="preview" style={{ height: "90px", marginTop: "10px", borderRadius: "5px", display: "block" }} />
          )}
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

      <h3 style={{ color: "#22112B" }}>Products ({products.length})</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
        {products.map((p) => (
          <div key={p.id} style={{ background: "#fff", borderRadius: "6px", padding: "12px" }}>
            {p.image ? (
              <img src={p.image} alt={p.name} style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "4px" }} />
            ) : (
              <div style={{ width: "100%", height: "120px", background: p.color || "#22112B", borderRadius: "4px" }} />
            )}
            <div style={{ fontWeight: 600, marginTop: "8px", fontSize: "14px", color: "#22112B" }}>{p.name}</div>
            <div style={{ fontSize: "12px", color: "#7A6A80" }}>{p.cat} · ${p.price}{p.tag ? ` · ${p.tag}` : ""}</div>
            <div style={{ marginTop: "8px", display: "flex", gap: "6px" }}>
              <button onClick={() => startEdit(p)} style={smallBtn}>Edit</button>
              <button onClick={() => deleteProduct(p.id)} style={{ ...smallBtn, color: "#B4442E", borderColor: "#B4442E55" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const pageWrap = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "'Inter', sans-serif", background: "#F3EEF5",
};
const inputStyle = {
  width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "5px",
  border: "1px solid #22112B33", fontSize: "13px", outline: "none", boxSizing: "border-box",
};
const primaryBtn = {
  padding: "10px 16px", border: "none", background: "#22112B", color: "#fff",
  borderRadius: "5px", cursor: "pointer", fontSize: "13px",
};
const secondaryBtn = {
  padding: "10px 16px", border: "1px solid #22112B33", background: "none",
  borderRadius: "5px", cursor: "pointer", fontSize: "13px", color: "#22112B",
};
const smallBtn = {
  fontSize: "12px", padding: "5px 10px", border: "1px solid #22112B33",
  background: "none", borderRadius: "4px", cursor: "pointer", color: "#22112B",
};
