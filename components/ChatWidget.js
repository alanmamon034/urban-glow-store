import { useEffect, useRef, useState } from "react";

export default function ChatWidget({ sessionId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`);
        const data = await res.json();
        if (!cancelled && data.ok) setMessages(data.messages);
      } catch (e) {
        // silent retry
      }
    }

    poll();
    const interval = setInterval(poll, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft("");
    setSending(true);
    setMessages((m) => [...m, { from: "customer", text, ts: Date.now() }]);
    try {
      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text }),
      });
    } catch (e) {
      // message will still show locally; next poll reconciles
    } finally {
      setSending(false);
    }
  }

  if (!sessionId) return null;

  return (
    <div
      style={{
        position: "fixed", bottom: "20px", right: "20px", width: "320px",
        maxWidth: "92vw", background: "#FFFFFF", borderRadius: "10px",
        boxShadow: "0 16px 40px -12px #1A0F1F66", zIndex: 70,
        display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{
        background: "#22112B", color: "#F3EEF5", padding: "12px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontFamily: "'Fraunces', serif", fontSize: "15px" }}>Chat with us</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#F3EEF5", cursor: "pointer", fontSize: "16px" }}>
          ✕
        </button>
      </div>

      <div ref={scrollRef} style={{ height: "260px", overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 && (
          <div style={{ fontSize: "12px", color: "#7A6A80", textAlign: "center", marginTop: "20px" }}>
            We got your order — ask us anything while we set up your payment details.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === "customer" ? "flex-end" : "flex-start",
              background: m.from === "customer" ? "#22112B" : "#F3EEF5",
              color: m.from === "customer" ? "#F3EEF5" : "#1A0F1F",
              padding: "8px 11px", borderRadius: "10px", fontSize: "13px", maxWidth: "80%",
            }}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", borderTop: "1px solid #22112B22", padding: "8px" }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: "13px", padding: "6px" }}
        />
        <button
          onClick={send}
          style={{
            border: "none", background: "#22112B", color: "#F3EEF5", borderRadius: "6px",
            padding: "6px 14px", fontSize: "13px", cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
