import { sendTelegramMessage } from "../../lib/telegram";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    await sendTelegramMessage(chatId, "👀 Someone just entered Urban Glow Boutique.");
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
}
