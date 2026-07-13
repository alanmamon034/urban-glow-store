import { useState } from "react";

const PAYMENT_METHODS = [
  { id: "zelle", label: "Zelle", icon: "💙" },
  { id: "cashapp", label: "Cash App", icon: "💚" },
  { id: "chime", label: "Chime", icon: "🟡" },
];

export default function CheckoutModal({ product, onClose, onPlaced }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState("zelle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
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
          name,
          phone,
          address,
          payment: PAYMENT_METHODS.find((p) => p.id === payment).label,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        onPlaced(data.sessionId);
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
        position: "fixed", inset: 0, background: "#1A0F1F77",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 60, padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFFFF", borderRadius: "10px", width: "420px", maxWidth: "100%",
          maxHeight: "90vh", overflowY: "auto", padding: "22px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: "20px", margin: 0, color: "#22112B" }}>
            Complete Your Order
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#7A6A80" }}>
            ✕
          </button>
        </div>

        <div style={{ marginTop: "14px", padding: "12px", background: "#F3EEF5", borderRadius: "6px" }}>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#22112B" }}>{product.name}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", color: "#7A6A80", marginTop: "2px" }}>
            ${product.price} USD
          </div>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h3 style={{ fontSize: "14px", margin: "0 0 4px", color: "#22112B" }}>Your Details</h3>
          <p style={{ fontSize: "12px", color: "#7A6A80", margin: "0 0 10px" }}>
            We need these to arrange your delivery.
          </p>
          <input
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={inputStyle}
          />
          <textarea
            placeholder="Delivery address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ marginTop: "18px", borderTop: "1px dashed #22112B33", paddingTop: "14px" }}>
          <h3 style={{ fontSize: "14px", margin: "0 0 8px", color: "#22112B" }}>Order Summary</h3>
          <Row label="Product price" value={`$${product.price}`} />
          <Row label="Delivery" value="Free" />
          <Row label="Total" value={`$${product.price}`} bold />
        </div>

        <div style={{ marginTop: "18px" }}>
          <h3 style={{ fontSize: "14px", margin: "0 0 6px", color: "#22112B" }}>Payment</h3>
          <p style={{ fontSize: "12px", color: "#7A6A80", margin: "0 0 10px" }}>
            Our team will send you account details in the chat right after you place your order.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayment(m.id)}
                style={{
                  flex: 1, padding: "10px 6px", borderRadius: "6px", cursor: "pointer",
                  border: payment === m.id ? "2px solid #22112B" : "1px solid #22112B33",
                  background: payment === m.id ? "#F3EEF5" : "#FFFFFF",
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
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            marginTop: "18px", width: "100%", padding: "13px 0", border: "none",
            borderRadius: "6px", background: "#22112B", color: "#F3EEF5",
            fontFamily: "'IBM Plex Mono', monospace", fontSize: "13px", letterSpacing: "0.04em",
            textTransform: "uppercase", cursor: submitting ? "default" : "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Placing order…" : "Complete Purchase →"}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "4px 0", fontWeight: bold ? 700 : 400 }}>
      <span style={{ color: bold ? "#22112B" : "#7A6A80" }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#22112B" }}>{value}</span>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "10px", marginBottom: "8px", borderRadius: "5px",
  border: "1px solid #22112B33", fontSize: "13px", outline: "none",
};
