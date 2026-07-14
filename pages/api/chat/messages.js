import { redis } from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const { sessionId } = req.query || {};
  if (!sessionId) return res.status(400).json({ ok: false, error: "sessionId required" });

  try {
    const chatKey = `chat:${sessionId}`;
    const existing = await redis.get(chatKey);
    const messages = existing ? (typeof existing === "string" ? JSON.parse(existing) : existing) : [];

    res.status(200).json({ ok: true, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
}
