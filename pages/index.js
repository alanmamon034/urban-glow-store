import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import CheckoutModal from "../components/CheckoutModal";
import ChatWidget from "../components/ChatWidget";

const NAV_ITEMS = ["Home", "New Arrivals", "2026 Swim", "Cowgirls", "Cowboys", "Mommas", "Nursery Decor"];
const ALL_CATEGORIES = ["Women", "Kids", "Wigs", "Shoes", "2026 Swim", "Cowgirls", "Cowboys", "Mommas", "Nursery Decor"];

function Tag({ text }) {
  if (!text) return null;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em",
      textTransform: "uppercase", background: "#6E2A2E", color: "#F4EDE2",
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
      border: "1px solid #DCCBAE", borderRadius: "8px", padding: "14px",
      display: "flex", flexDirection: "column", gap: "10px", background: "#FFFFFF",
    }}>
      <div style={{
        height: "150px", borderRadius: "6px",
        background: p.image ? `#F4EDE2` : `linear-gradient(155deg, ${p.color}, ${p.color}CC)`,
        backgroundImage: p.image ? `url(${p.image})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "10px",
      }}>
        <Tag text={p.tag} />
        <button onClick={share} title="Share this product" style={{
          background: "#F4EDE2CC", border: "none", borderRadius: "4px", cursor: "pointer",
          fontSize: "13px", padding: "4px 6px",
        }}>
          {copied ? "Copied!" : "🔗 Share"}
        </button>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: "15px", color: "#2A1A1C", fontWeight: 600 }}>{p.name}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#8A6A6E", marginTop: "2px" }}>{p.cat}</div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "14px", color: "#6E2A2E", fontWeight: 600 }}>${p.price}</div>
      </div>
      <button onClick={() => onBuy(p)} style={{
        marginTop: "2px", border: "none", background: "#4FB8AE", color: "#0F2E2A",
        fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.06em",
        textTransform: "uppercase", padding: "9px 0", borderRadius: "4px", cursor: "pointer", fontWeight: 700,
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
  const [active, setActive] = useState("Home");
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
    return products.filter((p) => {
      const matchesNav =
        active === "Home" ||
        (active === "New Arrivals" ? p.tag === "New" : p.cat === active);
      return matchesNav && p.name.toLowerCase().includes(query.toLowerCase());
    });
  }, [products, active, query]);

  return (
    <div style={{ minHeight: "100vh" }}>
      <Head>
        <title>Urban Glow Boutique</title>
        <meta name="description" content="Women's & kids' clothing, wigs, and shoes." />
      </Head>

      <div style={{ background: "#4E1D20", color: "#F4EDE2", textAlign: "center", padding: "7px", fontSize: "12px", fontFamily: "'IBM Plex Mono', monospace" }}>
        FREE US SHIPPING OVER $75 · NEW ARRIVALS EVERY WEEK
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

      <header style={{ background: "#F4EDE2", padding: "24px 32px 18px", textAlign: "center", borderBottom: "1px solid #DCCBAE" }}>
        <img
          src="/logo.png"
          alt="Urban Glow Boutique"
          style={{
            height: "140px", width: "auto", display: "block", margin: "0 auto 16px",
            filter: "brightness(0) saturate(100%) invert(52%) sepia(56%) saturate(680%) hue-rotate(140deg) brightness(90%) contrast(92%)",
          }}
        />
        <nav style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px 16px" }}>
          {NAV_ITEMS.map((c) => (
            <button key={c} onClick={() => setActive(c)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px", letterSpacing: "0.02em",
              color: active === c ? "#6E2A2E" : "#8A6A6E",
              borderBottom: active === c ? "2px solid #4FB8AE" : "2px solid transparent", paddingBottom: "4px",
              fontWeight: active === c ? 700 : 400,
            }}>
              {c}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", background: "#FFFFFF", border: "1px solid #DCCBAE", borderRadius: "20px", padding: "6px 12px", gap: "6px" }}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search"
              style={{ border: "none", outline: "none", fontSize: "12px", width: "140px", background: "transparent" }} />
          </div>
        </div>
      </header>

      <section style={{ padding: "60px 32px", textAlign: "center", background: "linear-gradient(180deg,#6E2A2E,#4E1D20)" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "12px", color: "#4FB8AE", letterSpacing: "0.15em", marginBottom: "16px" }}>
          TURQUOISE. GRIT. GLOW.
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: "36px", lineHeight: 1.2, margin: 0, color: "#F4EDE2" }}>
          Western roots.<br />Modern glow.
        </h1>
        <p style={{ maxWidth: "440px", margin: "16px auto 0", color: "#E8D9BC", fontSize: "15px" }}>
          Everyday western wear for the whole family — cowgirls, cowboys, mommas, and little ones too.
        </p>
        <button style={{
          marginTop: "24px", background: "#4FB8AE", color: "#0F2E2A", border: "none",
          padding: "13px 30px", fontFamily: "'Space Grotesk', sans-serif", fontSize: "13px",
          fontWeight: 700, borderRadius: "4px", cursor: "pointer",
        }}>
          Shop new arrivals
        </button>
      </section>

      <section style={{ padding: "36px 32px 60px", background: "#F4EDE2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "18px" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", margin: 0, color: "#2A1A1C" }}>
            {active === "Home" ? "All Products" : active}
          </h2>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#8A6A6E" }}>{filtered.length} items</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "16px" }}>
          {loading && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#8A6A6E", padding: "40px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px" }}>
              Loading products…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#8A6A6E", padding: "40px 0", fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px" }}>
              New arrivals coming soon — check back shortly!
            </div>
          )}
          {filtered.map((p) => (
            <ProductCard key={p.id} p={p} onBuy={setCheckoutProduct} />
          ))}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #DCCBAE", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", background: "#F4EDE2" }}>
        <img
          src="/logo.png"
          alt="Urban Glow Boutique"
          style={{
            height: "34px", width: "auto",
            filter: "brightness(0) saturate(100%) invert(52%) sepia(56%) saturate(680%) hue-rotate(140deg) brightness(90%) contrast(92%)",
          }}
        />
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#8A6A6E" }}>
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
