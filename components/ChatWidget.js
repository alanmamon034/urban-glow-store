import { useEffect, useRef, useState } from "react";

export default function ChatWidget({ sessionId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/chat/messages?sessionId=${sessionId}`, { cache: "no-store" });
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

  async function handleFileSelect(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !preset) {
      alert("Payment proof uploads aren't configured yet.");
      return;
    }

    const isVideo = file.type.startsWith("video/");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", preset);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${isVideo ? "video" : "image"}/upload`,
        { method: "POST", body: fd }
      );
      const data = await res.json();
      if (!data.secure_url) {
        alert("Upload failed — please try again.");
        return;
      }

      const mediaType = isVideo ? "video" : "image";
      setMessages((m) => [...m, { from: "customer", text: "Payment proof", mediaUrl: data.secure_url, mediaType, ts: Date.now() }]);

      await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text: "Payment proof", mediaUrl: data.secure_url, mediaType }),
      });
    } catch (e) {
      alert("Upload failed — please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (!sessionId) return null;

  return (
    <div
      style={{
        position: "fixed", bottom: "20px", right: "20px", width: "320px",
        maxWidth: "92vw", background: "#FFFFFF", borderRadius: "10px",
        boxShadow: "0 16px 40px -12px #2A1A1C66", zIndex: 70,
        display: "flex", flexDirection: "column", overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{
        background: "#6E2A2E", color: "#F4EDE2", padding: "12px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: "15px" }}>Chat with us</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", opacity: 0.6 }}>{sessionId}</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#F4EDE2", cursor: "pointer", fontSize: "16px" }}>
          ✕
        </button>
      </div>

      <div ref={scrollRef} style={{ height: "280px", overflowY: "auto", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {messages.length === 0 && (
          <div style={{ fontSize: "12px", color: "#8A6A6E", textAlign: "center", marginTop: "20px" }}>
            We got your order — ask us anything, or upload a screenshot of your payment once sent.
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.from === "customer" ? "flex-end" : "flex-start",
              background: m.from === "customer" ? "#6E2A2E" : "#F4EDE2",
              color: m.from === "customer" ? "#F4EDE2" : "#2A1A1C",
              padding: "8px 11px", borderRadius: "10px", fontSize: "13px", maxWidth: "80%",
            }}
          >
            {m.mediaUrl && m.mediaType === "video" ? (
              <video src={m.mediaUrl} controls style={{ maxWidth: "180px", borderRadius: "6px", display: "block", marginBottom: m.text ? "6px" : 0 }} />
            ) : m.mediaUrl ? (
              <img src={m.mediaUrl} alt="Payment proof" style={{ maxWidth: "180px", borderRadius: "6px", display: "block", marginBottom: m.text ? "6px" : 0 }} />
            ) : null}
            {m.text}
          </div>
        ))}
        {uploading && (
          <div style={{ alignSelf: "flex-end", fontSize: "12px", color: "#8A6A6E" }}>Uploading…</div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", borderTop: "1px solid #DCCBAE", padding: "8px", gap: "6px" }}>
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <button
          type="button"
          title="Upload payment proof"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: "1px solid #DCCBAE", background: "none", borderRadius: "6px",
            padding: "6px 9px", cursor: "pointer", fontSize: "15px",
          }}
        >
          📎
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          style={{ flex: 1, border: "none", outline: "none", fontSize: "13px", padding: "6px", minWidth: 0 }}
        />
        <button
          onClick={send}
          style={{
            border: "none", background: "#6E2A2E", color: "#F4EDE2", borderRadius: "6px",
            padding: "6px 14px", fontSize: "13px", cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
