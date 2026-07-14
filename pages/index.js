import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import CheckoutModal from "../components/CheckoutModal";
import ChatWidget from "../components/ChatWidget";

const CATEGORIES = ["All", "Women", "Kids", "Wigs", "Shoes"];

function Tag({ text }) {
  if (!text) return null;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em",
      textTransform: "uppercase", background: "#22112B", color: "#F3EEF5",
      padding: "3px 7px", borderRadius: "2px",
    }}>
      {text}
    </span>
  );
}

function ProductCard({ p, onBuy }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}?product=${p.id}`;
    const shareData = { title: `${p.name} — Urban Glow Boutique`, text: `Check out ${p.name} for $${p.price} at Urban Glow Boutique`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  }

  return (
    <div style={{
      border: "1px dashed #C9A24B99", borderRadius: "6px", padding: "14px",
      display: "flex", flexDirection: "column", gap: "10px", background: "#FFFFFF",
    }}>
      <div style={{
        height: "150px", borderRadius: "4px",
        background: p.image ? `#F3EEF5` : `linear-gradient(155deg, ${p.color}, ${p.color}CC)`,
        backgroundImage: p.image ? `url(${p.image})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "10px",
      }}>
        <Tag text={p.tag} />
        <button onClick={share} title="Share this product" style={{
          background: "#F3EEF599", border: "none", borderRadius: "4px", cursor: "pointer",
          fontSize: "13px", padding: "4px 6px",
        }}>
          {copied ? "Copied!" : "🔗 Share"}
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: "15px", color: "#1A0F1F", fontWeight: 600 }}>{p.name}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#7A6A80", marginTop: "2px" }}>{p.cat}</div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "14px", color: "#22112B", fontWeight: 600 }}>${p.price}</div>
      </div>
      <button onClick={() => onBuy(p)} style={{
        marginTop: "2px", border: "none", background: "#22112B", color: "#F3EEF5",
        fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.06em",
        textTransform: "uppercase", padding: "9px 0", borderRadius: "3px", cursor: "pointer",
      }}>
        Buy now
      </button>
    </div>
  );
}

function PendingOrderBanner({ order, onView, onDismiss }) {
  return (
    <div style={{
      background: "#FBEFD9", borderBottom: "1px solid #C9A24B55",
      padding: "12px 28px", display: "flex", alignItems: "center",
      justifyContent: "space-between", gap: "12px", flexWrap: "wrap",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: "13px", color: "#22112B" }}>
          You have an order in progress
        </div>
        <div style={{ fontSize: "12px", color: "#7A6A80", marginTop: "2px" }}>
          Ref {order.orderRef} — {order.productName}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={onView} style={{
          background: "none", border: "none", color: "#22112B", fontWeight: 600,
          fontSize: "13px", cursor: "pointer", textDecoration: "underline", padding: 0,
        }}>
          View order &amp; confirm payment →
        </button>
        <button onClick={onDismiss} style={{
          background: "none", border: "none", color: "#7A6A80", fontSize: "16px", cursor: "pointer",
        }}>
          ✕
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [pendingOrder, setPendingOrder] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ugb_pending_order");
      if (raw) setPendingOrder(JSON.parse(raw));
    } catch (e) {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setProducts(data.products);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) =>
      (active === "All" || p.cat === active) &&
      p.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [products, active, query]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Head>
        <title>Urban Glow Boutique</title>
        <meta name="description" content="Women's & kids' clothing, wigs, and shoes." />
      </Head>

      <div style={{ background: "#22112B", color: "#F3EEF5", textAlign: "center", padding: "7px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace" }}>
        FREE US SHIPPING OVER $75 · NEW WIG ARRIVALS JUST DROPPED
      </div>

      {pendingOrder && !sessionId && (
        <PendingOrderBanner
          order={pendingOrder}
          onView={() => setSessionId(pendingOrder.sessionId)}
          onDismiss={() => {
            setPendingOrder(null);
            localStorage.removeItem("ugb_pending_order");
          }}
        />
      )}

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px dashed #22112B33", flexWrap: "wrap", gap: "12px" }}>
        <img src="/logo.png" alt="Urban Glow Boutique" style={{ height: "44px", width: "auto" }} />

        <nav style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setActive(c)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", letterSpacing: "0.05em",
              textTransform: "uppercase", color: active === c ? "#22112B" : "#7A6A80",
              borderBottom: active === c ? "2px solid #C9A24B" : "2px solid transparent", paddingBottom: "4px",
            }}>
              {c}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", background: "#FFFFFF", border: "1px solid #22112B22", borderRadius: "20px", padding: "6px 12px", gap: "6px" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search"
            style={{ border: "none", outline: "none", fontSize: "12px", width: "100px", background: "transparent" }} />
        </div>
      </header>

      <section style={{ padding: "56px 28px 40px", textAlign: "center", borderBottom: "1px dashed #22112B33" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", letterSpacing: "0.1em", color: "#C9A24B", marginBottom: "12px" }}>
          WOMEN · KIDS · WIGS · SHOES
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "44px", lineHeight: 1.1, margin: 0, color: "#22112B" }}>
          Dressed for the day<br />you actually have.
        </h1>
        <p style={{ maxWidth: "440px", margin: "16px auto 0", color: "#5A4A60", fontSize: "15px" }}>
          Urban Glow Boutique: everyday fashion for you and your kids, plus wigs and shoes that hold up outside the mirror.
        </p>
      </section>

      <section style={{ padding: "36px 28px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "18px" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", margin: 0 }}>
            {active === "All" ? "All Products" : active}
          </h2>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#7A6A80" }}>{filtered.length} items</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "16px" }}>
          {loading && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#7A6A80", padding: "40px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px" }}>
              Loading products…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#7A6A80", padding: "40px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px" }}>
              No products yet — add some from the <a href="/admin">admin page</a>.
            </div>
          )}
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} onBuy={setCheckoutProduct} />
          ))}
        </div>
      </section>

      <footer style={{ borderTop: "1px dashed #22112B33", padding: "24px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <img src="/logo.png" alt="Urban Glow Boutique" style={{ height: "34px", width: "auto" }} />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#7A6A80" }}>
          © 2026 Urban Glow Boutique · Shipping across the USA
        </span>
      </footer>

      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          onPlaced={(newSessionId, orderRef) => {
            setCheckoutProduct(null);
            setSessionId(newSessionId);
            const order = { sessionId: newSessionId, orderRef, productName: checkoutProduct.name, ts: Date.now() };
            setPendingOrder(order);
            try {
              localStorage.setItem("ugb_pending_order", JSON.stringify(order));
            } catch (e) {
              // storage may be unavailable, non-fatal
            }
          }}
        />
      )}

      {sessionId && (
        <ChatWidget sessionId={sessionId} onClose={() => setSessionId(null)} />
      )}
    </div>
  );
}
