# Urban Glow Boutique

A storefront with a real checkout flow, per-customer live chat, and Telegram
notifications for orders and site visits.

## How it works

- A customer clicks **Buy now** → fills in name/phone/address → picks a
  payment method (Zelle / Cash App / Chime) → **Complete Purchase**.
- The order is sent straight to **your** Telegram as a message, and a chat
  window opens on the customer's screen.
- You reply to that Telegram message (long-press → Reply) and your reply
  shows up live in the customer's chat window on the site. It's one-on-one:
  each customer's messages are tied to their own session, so replying to
  a specific message replies to that specific customer.
- Every time someone loads the site, you get a "someone just entered the
  store" ping on Telegram.

## One-time setup

### 1. Create your Telegram bot
1. Open Telegram, message **@BotFather**, send `/newbot`, follow the prompts.
2. BotFather gives you a token like `123456:ABC-...` — save it.

### 2. Get your own chat ID
1. Send your new bot any message first (e.g. "hi").
2. Visit this URL in your browser (replace `<TOKEN>`):
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789,...}` — that number is your
   `TELEGRAM_ADMIN_CHAT_ID`.

### 3. Create a free Redis database (stores orders & chat messages)
Easiest path: in your Vercel project dashboard → **Storage** tab →
**Create Database** → choose **Upstash Redis** (or "KV") → connect it to
this project. Vercel will automatically add `KV_REST_API_URL` and
`KV_REST_API_TOKEN` to your environment variables.

(Alternative: create a free database directly at upstash.com and copy its
REST URL + token into the env vars yourself.)

### 4. Set up an admin password
Pick any password and set it as `ADMIN_PASSWORD` — this protects `/admin`,
where you'll add/edit/delete products.

### 5. Set up Cloudinary (for product photos)
1. Sign in at [console.cloudinary.com](https://console.cloudinary.com/).
2. On your dashboard, copy your **Cloud name**.
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
4. Set **Signing Mode** to **Unsigned**, save, and copy the preset's name.
5. Add both values as env vars:
   ```
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your cloud name>
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your preset name>
   ```

### 6. Set environment variables
In Vercel → Project → Settings → Environment Variables, add everything from
`.env.example`:

```
TELEGRAM_BOT_TOKEN=<your bot token>
TELEGRAM_ADMIN_CHAT_ID=<your chat id>
KV_REST_API_URL=<from Upstash/Vercel Storage>
KV_REST_API_TOKEN=<from Upstash/Vercel Storage>
ADMIN_PASSWORD=<pick a password>
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your cloud name>
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=<your preset name>
```

### 7. Deploy
Push this folder to a GitHub repo and import it in Vercel, or run:
```
npm i -g vercel
vercel
```

### 8. Point Telegram at your deployed site
Once deployed, tell Telegram where to send your replies (replace both
placeholders):
```
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-app>.vercel.app/api/telegram/webhook"
```
You should get `{"ok":true,"result":true,...}` back. That's it — you're live.

## Managing products
Go to `https://<your-app>.vercel.app/admin`, log in with your `ADMIN_PASSWORD`,
and you can add, edit, or delete products — including uploading a real photo
for each one (stored on Cloudinary, linked automatically). The storefront
pulls the product list live, so changes show up immediately for customers.

## Replying to customers
- **Preferred:** long-press (or right-click on desktop Telegram) the order/chat
  message from that customer and hit **Reply**, then type your answer normally.
- **Fallback command** if a reply doesn't register: `/r <sessionId> your message`
  — the session ID is printed at the bottom of every order/chat notification.

## Local development
```
npm install
cp .env.example .env.local   # fill in the values above
npm run dev
```
Note: the Telegram webhook only works on a real public URL, so replies won't
come through on `localhost` — but placing test orders and seeing them land
in Telegram works fine locally.

## Notes for later
- Domain: once you buy one, just add it in Vercel → Settings → Domains.
  Nothing else in this code needs to change.
- Product photos: swap the colored blocks in `pages/index.js` for real
  images by adding files to `/public` and using `<img src="/your-photo.jpg" />`.
- Payment: this flow collects the order and lets you arrange payment
  manually over chat (as shown in your original mockup). It does not
  process card payments — Zelle/Cash App/Chime are handled outside the site.
