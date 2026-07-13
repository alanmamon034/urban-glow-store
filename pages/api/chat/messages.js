import { redis } from "../../../lib/redis";

export default async function handler(req, res) {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ ok: false });

  try {
    const raw = await redis.get(`chat:${sessionId}`);
    const messages = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : [];
    res.status(200).json({ ok: true, messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
}
