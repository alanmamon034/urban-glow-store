import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import CheckoutModal from "../components/CheckoutModal";
import ChatWidget from "../components/ChatWidget";

const NAV_ITEMS = ["Home", "New Arrivals", "2026 Swim", "Cowgirls", "Cowboys", "Mommas", "Nursery Decor"];
const ALL_CATEGORIES = ["Women", "Kids", "Wigs", "Shoes", "2026 Swim", "Cowgirls", "Cowboys", "Mommas", "Nursery Decor"];

function Tag({ text }) {
  if (!text) return null;
  const safeText = text.length > 24 ? text.slice(0, 24) + "…" : text;
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", letterSpacing: "0.06em",
      textTransform: "uppercase", background: "#6E2A2E", color: "#F4EDE2",
      padding: "3px 7px", borderRadius: "2px", maxWidth: "140px", overflow: "hidden",
      textOverflow: "ellipsis", whiteSpace: "nowrap", display: "inline-block",
    }}>
      {safeText}
    </span>
  );
}

function Stars({ value }) {
  const rounded = Math.round(value);
  return (
    <span style={{ color: "#D4A544", fontSize: "12px" }}>
      {"★".repeat(rounded)}{"☆".repeat(5 - rounded)}
    </span>
  );
}

function ProductCard({ p, onBuy }) {
  const [copied, setCopied] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedSize, setSelectedSize] = useState(p.sizes && p.sizes.length ? p.sizes[0] : null);

  const reviews = p.reviews || [];
  const avg = reviews.length ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length : null;
  const gallery = (p.images && p.images.length ? p.images : (p.image ? [p.image] : []));
  const [activeImage, setActiveImage] = useState(gallery[0] || null);

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
        height: "150px", borderRadius: "6px", overflow: "hidden",
        background: activeImage ? `#F4EDE2` : `linear-gradient(155deg, ${p.color}, ${p.color}CC)`,
        backgroundImage: activeImage ? `url(${activeImage})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "10px",
      }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <Tag text={p.tag} />
          {p.preorder && <Tag text="Pre-order" />}
        </div>
        <button onClick={share} title="Share this product" style={{
          background: "#F4EDE2CC", border: "none", borderRadius: "4px", cursor: "pointer",
          fontSize: "13px", padding: "4px 6px",
        }}>
          {copied ? "Copied!" : "🔗 Share"}
        </button>
      </div>

      {gallery.length > 1 && (
        <div style={{ display: "flex", gap: "5px", overflowX: "auto" }}>
          {gallery.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setActiveImage(url)}
              style={{
                width: "34px", height: "34px", borderRadius: "4px", padding: 0, cursor: "pointer",
                border: activeImage === url ? "2px solid #6E2A2E" : "1px solid #DCCBAE",
                backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: "15px", color: "#2A1A1C", fontWeight: 600 }}>{p.name}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#8A6A6E", marginTop: "2px" }}>{p.cat}</div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "14px", color: "#6E2A2E", fontWeight: 600 }}>${p.price}</div>
      </div>

      {p.description && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: "12px", color: "#6E2A2E", textDecoration: "underline" }}
          >
            {showDetails ? "Hide details" : "View details"}
          </button>
          {showDetails && (
            <div style={{ marginTop: "6px", fontSize: "12px", color: "#5A4A46", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {p.description}
            </div>
          )}
        </div>
      )}

      {p.sizes && p.sizes.length > 0 && (
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#8A6A6E", marginBottom: "5px", letterSpacing: "0.04em" }}>SIZE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {p.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSize(s)}
                style={{
                  padding: "4px 9px", fontSize: "11px", borderRadius: "4px", cursor: "pointer",
                  border: selectedSize === s ? "2px solid #6E2A2E" : "1px solid #DCCBAE",
                  background: selectedSize === s ? "#F4EDE2" : "#FFFFFF",
                  color: "#2A1A1C", fontWeight: selectedSize === s ? 700 : 400,
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {avg !== null ? (
        <button
          onClick={() => setShowReviews(!showReviews)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Stars value={avg} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#8A6A6E" }}>
            ({reviews.length})
          </span>
        </button>
      ) : (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#8A6A6E" }}>No reviews yet</div>
      )}

      {showReviews && reviews.length > 0 && (
        <div style={{ borderTop: "1px dashed #DCCBAE", paddingTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 600, color: "#2A1A1C" }}>{r.name}</span>
                <Stars value={r.rating} />
              </div>
              {r.text && <div style={{ color: "#8A6A6E", marginTop: "2px" }}>{r.text}</div>}
            </div>
          ))}
        </div>
      )}

      {p.preorder && (
        <div style={{ fontSize: "11px", color: "#8A6A6E", fontStyle: "italic" }}>
          Pre-order now — ships as soon as it's back in stock.
        </div>
      )}

      <button onClick={() => onBuy(p, selectedSize)} style={{
        marginTop: "2px", border: "none", background: "#4FB8AE", color: "#0F2E2A",
        fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", letterSpacing: "0.06em",
        textTransform: "uppercase", padding: "9px 0", borderRadius: "4px", cursor: "pointer", fontWeight: 700,
      }}>
        Buy now
      </button>
    </div>
  );

}

function ReviewsWall({ products }) {
  const allReviews = useMemo(() => {
    const list = [];
    products.forEach((p) => {
      (p.reviews || []).forEach((r) => {
        list.push({ ...r, productName: p.name });
      });
    });
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [products]);

  if (allReviews.length === 0) return null;

  return (
    <section style={{ padding: "10px 32px 60px", background: "#F4EDE2" }}>
      <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", margin: "0 0 18px", color: "#2A1A1C" }}>
        Customer Reviews
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
        {allReviews.map((r) => (
          <div key={r.id} style={{ background: "#FFFFFF", border: "1px solid #DCCBAE", borderRadius: "8px", padding: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <Stars value={r.rating} />
              {r.createdAt && (
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#8A6A6E" }}>
                  {new Date(r.createdAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                </span>
              )}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#8A6A6E", marginTop: "4px" }}>
              about {r.productName}
            </div>
            {r.text && (
              <div style={{ fontSize: "13px", color: "#2A1A1C", marginTop: "8px", lineHeight: 1.4 }}>{r.text}</div>
            )}
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: 600, fontSize: "13px", color: "#6E2A2E" }}>{r.name}</span>
              {r.verified && (
                <span style={{ background: "#6E2A2E", color: "#F4EDE2", fontSize: "9px", padding: "2px 6px", borderRadius: "3px", letterSpacing: "0.03em" }}>
                  VERIFIED
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
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

      <ReviewsWall products={products} />

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
