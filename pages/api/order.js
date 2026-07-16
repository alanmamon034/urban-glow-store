import { nanoid, customAlphabet } from "nanoid";
import { redis } from "../../lib/redis";
import { sendTelegramMessage } from "../../lib/telegram";

const refAlphabet = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { product, price, quantity, sizes, total, name, phone, email, address, payment } = req.body || {};

  if (!product || !price || !name || !phone || !address || !payment) {
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  try {
    const sessionId = nanoid(10);
    const orderRef = `ORD-${refAlphabet()}`;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
    const qty = quantity || 1;
    const orderTotal = total !== undefined ? total : price;

    await redis.set(`session:${sessionId}`, JSON.stringify({
      orderRef, product, price, quantity: qty, sizes, total: orderTotal, name, phone, email, address, payment, createdAt: Date.now(),
    }));
    await redis.set(`chat:${sessionId}`, JSON.stringify([]));

    const text =
      `🛍️ <b>New Order</b> (${orderRef})\n\n` +
      `<b>Product:</b> ${product}\n` +
      (sizes ? `<b>Size(s):</b> ${sizes}\n` : ``) +
      `<b>Qty:</b> ${qty}\n` +
      `<b>Price:</b> $${price} each\n` +
      `<b>Total:</b> $${Number(orderTotal).toFixed(2)}\n\n` +
      `<b>Customer:</b> ${name}\n` +
      `<b>Phone:</b> ${phone}\n` +
      (email ? `<b>Email:</b> ${email}\n` : ``) +
      `<b>Address:</b> ${address}\n` +
      `<b>Payment method:</b> ${payment}\n\n` +
      `Reply directly to THIS message to chat with the customer.\n` +
      `Session: <code>${sessionId}</code>`;

    const tgRes = await sendTelegramMessage(chatId, text);

    if (tgRes.ok && tgRes.result) {
      await redis.set(`msgmap:${tgRes.result.message_id}`, sessionId);
    }

    res.status(200).json({ ok: true, sessionId, orderRef });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
}
