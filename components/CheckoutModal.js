import { useEffect, useState } from "react";

const PAYMENT_METHODS = [
  { id: "zelle", label: "Zelle", icon: "💙" },
  { id: "cashapp", label: "Cash App", icon: "💚" },
  { id: "chime", label: "Chime", icon: "🟡" },
];

const STORAGE_KEY = "ugb_saved_details";

export default function CheckoutModal({ product, orderDetails, onClose, onPlaced }) {
  const sizes = orderDetails?.sizes || [];
  const quantity = orderDetails?.quantity || 1;
  const total = orderDetails?.total ?? product.price;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("zelle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedDetails, setSavedDetails] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSavedDetails(JSON.parse(raw));
    } catch (e) {
      // ignore corrupted storage
    }
  }, []);

  function useSavedDetails() {
    if (!savedDetails) return;
    setName(savedDetails.name || "");
    setPhone(savedDetails.phone || "");
    setEmail(savedDetails.email || "");
    setAddress(savedDetails.address || "");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError("Please fill in your name, phone, and address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.name,
          price: product.price,
          quantity,
          sizes: sizes.length ? sizes.join(", ") : undefined,
          total,
          name,
          phone,
          email,
          address,
          payment: PAYMENT_METHODS.find((p) => p.id === payment).label,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, phone, email, address }));
        } catch (e) {
          // storage may be unavailable, non-fatal
        }
        onPlaced(data.sessionId, data.orderRef);
      } else {
        setError("Something went wrong placing your order. Please try again.");
      }
    } catch (e) {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "#2A1A1C77",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 60, padding: "16px",
      }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: "#FFFFFF", borderRadius: "10px", width: "420px", maxWidth: "100%",
          maxHeight: "90vh", overflowY: "auto", padding: "22px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", margin: 0, color: "#6E2A2E" }}>
            Complete Your Order
          </h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#8A6A6E" }}>
            ✕
          </button>
        </div>

        <div style={{ marginTop: "14px", padding: "12px", background: "#F4EDE2", borderRadius: "6px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#6E2A2E" }}>{product.name}</div>
          {sizes.length > 0 && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#6E2A2E", marginTop: "2px" }}>
              Size{sizes.length > 1 ? "s" : ""}: {sizes.join(", ")}
            </div>
          )}
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#6E2A2E", marginTop: "2px" }}>
            Qty: {quantity}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: "#8A6A6E", marginTop: "2px" }}>
            ${product.price} USD
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontSize: "14px", margin: "0 0 4px", color: "#6E2A2E" }}>Your Details</h3>
            {savedDetails && (
              <button
                type="button"
                onClick={useSavedDetails}
                style={{
                  background: "none", border: "none", color: "#6E2A2E", fontSize: "12px",
                  textDecoration: "underline", cursor: "pointer", padding: 0,
                }}
              >
                Use saved details
              </button>
            )}
          </div>
          <p style={{ fontSize: "12px", color: "#8A6A6E", margin: "0 0 10px" }}>
            We need these to arrange your delivery.
          </p>
          <input
            name="name"
            autoComplete="name"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            name="tel"
            autoComplete="tel"
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <textarea
            name="address"
            autoComplete="street-address"
            placeholder="Delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ marginTop: "18px", borderTop: "1px dashed #DCCBAE", paddingTop: "14px" }}>
          <h3 style={{ fontSize: "14px", margin: "0 0 8px", color: "#6E2A2E" }}>Order Summary</h3>
          <Row label={`Product price ${quantity > 1 ? `× ${quantity}` : ""}`} value={`$${product.price} ${quantity > 1 ? `× ${quantity}` : ""}`} />
          <Row label="Delivery" value="Free" />
          <Row label="Total" value={`$${total.toFixed(2)}`} bold />
        </div>

        <div style={{ marginTop: "18px" }}>
          <h3 style={{ fontSize: "14px", margin: "0 0 6px", color: "#6E2A2E" }}>Payment</h3>
          <p style={{ fontSize: "12px", color: "#8A6A6E", margin: "0 0 10px" }}>
            Our team will send you account details in the chat right after you place your order.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPayment(m.id)}
                style={{
                  flex: 1, padding: "10px 6px", borderRadius: "6px", cursor: "pointer",
                  border: payment === m.id ? "2px solid #6E2A2E" : "1px solid #DCCBAE",
                  background: payment === m.id ? "#F4EDE2" : "#FFFFFF",
                  fontSize: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                }}
              >
                <span style={{ fontSize: "18px" }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: "12px", color: "#B4442E", fontSize: "12px" }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: "18px", width: "100%", padding: "13px 0", border: "none",
            borderRadius: "6px", background: "#4FB8AE", color: "#0F2E2A",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", letterSpacing: "0.04em",
            textTransform: "uppercase", cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Placing order…" : "Complete Purchase →"}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", fontWeight: bold ? 700 : 400 }}>
      <span style={{ color: bold ? "#6E2A2E" : "#8A6A6E" }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#6E2A2E" }}>{value}</span>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px", marginBottom: "8px", borderRadius: "5px",
  border: "1px solid #DCCBAE", fontSize: "13px", outline: "none", boxSizing: "border-box",
};
