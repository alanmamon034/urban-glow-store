import { redis } from "../../../lib/redis";
import { sendTelegramMessage } from "../../../lib/telegram";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { sessionId, text } = req.body || {};
  if (!sessionId || !text) return res.status(400).json({ ok: false });

  try {
    const chatKey = `chat:${sessionId}`;
    const existing = await redis.get(chatKey);
    const messages = existing ? (typeof existing === "string" ? JSON.parse(existing) : existing) : [];
    messages.push({ from: "customer", text, ts: Date.now() });
    await redis.set(chatKey, JSON.stringify(messages));

    const sessionRaw = await redis.get(`session:${sessionId}`);
    const session = sessionRaw ? (typeof sessionRaw === "string" ? JSON.parse(sessionRaw) : sessionRaw) : {};
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    const tgRes = await sendTelegramMessage(
      chatId,
      `💬 <b>${session.name || "Customer"}</b>: ${text}\n\nSession: <code>${sessionId}</code>`
    );

    if (tgRes.ok && tgRes.result) {
      await redis.set(`msgmap:${tgRes.result.message_id}`, sessionId);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
}
