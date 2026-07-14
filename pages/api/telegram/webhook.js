import { redis } from "../../../lib/redis";
import { sendTelegramMessage } from "../../../lib/telegram";

export default async function handler(req, res) {
  // Telegram expects a fast 200 response regardless of outcome.
  if (req.method !== "POST") return res.status(200).end();

  try {
    const update = req.body || {};
    const message = update.message;
    if (!message || !message.text) return res.status(200).end();

    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    // Only accept messages from the admin's own chat with the bot.
    if (String(message.chat.id) !== String(chatId)) return res.status(200).end();

    let sessionId = null;
    let replyText = message.text;

    // Preferred: admin used Telegram's native "reply" on a forwarded message.
    if (message.reply_to_message) {
      const mapped = await redis.get(`msgmap:${message.reply_to_message.message_id}`);
      if (mapped) sessionId = mapped;
    }

    // Fallback: admin typed "/r <sessionId> message text"
    if (!sessionId) {
      const match = message.text.match(/^\/r\s+(\S+)\s+([\s\S]+)/);
      if (match) {
        sessionId = match[1];
        replyText = match[2];
      }
    }

    if (!sessionId) {
      await sendTelegramMessage(
        chatId,
        "⚠️ Couldn't tell which customer that's for. Reply directly (long-press → Reply) to their message, or use:\n/r &lt;sessionId&gt; your message"
      );
      return res.status(200).end();
    }

    const chatKey = `chat:${sessionId}`;
    const raw = await redis.get(chatKey);
    const messages = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
    messages.push({ from: "admin", text: replyText, ts: Date.now() });
    await redis.set(chatKey, JSON.stringify(messages));

    await sendTelegramMessage(chatId, `✅ Sent to <code>${sessionId}</code>`);

    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(200).end();
  }
}
