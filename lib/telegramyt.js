const API = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(chatId, text, extra = {}) {
  const res = await fetch(`${API()}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      ...extra,
    }),
  });
  return res.json();
}

export async function sendTelegramPhoto(chatId, photoUrl, caption = "", extra = {}) {
  const res = await fetch(`${API()}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo: photoUrl,
      caption,
      parse_mode: "HTML",
      ...extra,
    }),
  });
  return res.json();
}

export async function sendTelegramVideo(chatId, videoUrl, caption = "", extra = {}) {
  const res = await fetch(`${API()}/sendVideo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      video: videoUrl,
      caption,
      parse_mode: "HTML",
      ...extra,
    }),
  });
  return res.json();
}
