import { redis } from "../../../lib/redis";
import { sendTelegramMessage, sendTelegramPhoto, sendTelegramVideo } from "../../../lib/telegram";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { sessionId, text, mediaUrl, mediaType } = req.body || {};
  if (!sessionId || (!text && !mediaUrl)) return res.status(400).json({ ok: false });

  try {
    const chatKey = `chat:${sessionId}`;
    const existing = await redis.get(chatKey);
    const messages = existing ? (typeof existing === "string" ? JSON.parse(existing) : existing) : [];
    messages.push({ from: "customer", text: text || "", mediaUrl: mediaUrl || null, mediaType: mediaType || null, ts: Date.now() });
    await redis.set(chatKey, JSON.stringify(messages));

    const sessionRaw = await redis.get(`session:${sessionId}`);
    const session = sessionRaw ? (typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw) : {};
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const who = session.name || "Customer";

    let tgRes;
    if (mediaUrl && mediaType === "video") {
      tgRes = await sendTelegramVideo(chatId, mediaUrl, `🧾 <b>${who}</b> sent payment proof${text ? `: ${text}` : ""}\n\nSession: <code>${sessionId}</code>`);
    } else if (mediaUrl) {
      tgRes = await sendTelegramPhoto(chatId, mediaUrl, `🧾 <b>${who}</b> sent payment proof${text ? `: ${text}` : ""}\n\nSession: <code>${sessionId}</code>`);
    } else {
      tgRes = await sendTelegramMessage(chatId, `💬 <b>${who}</b>: ${text}\n\nSession: <code>${sessionId}</code>`);
    }

    if (tgRes.ok && tgRes.result) {
      await redis.set(`msgmap:${tgRes.result.message_id}`, sessionId);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
}
