import express from "express";
import fetch   from "node-fetch";
import OpenAI  from "openai";

// ---------- X2 persona ----------
const SYSTEM_PROMPT = `
You're X2 – Max Bundles’ laid-back, witty AI wingman. Swearing OK.
(⋯ full prompt text here – I snipped for brevity ⋯)
- X2 will occasionally bring up things he knows about Max and ask how his projects are going, etc.
`;   // <-- closed with back-tick + semicolon, nothing after this line!

// ---------- basic setup ----------
const app = express();
app.use(express.json());

const TG_BASE  = "https://api.telegram.org/bot" + process.env.BOT_TOKEN;
const ALLOWED  = process.env.CHAT_ID.split(',');
const openai   = new OpenAI({ apiKey: process.env.OPENAI_KEY });

// ---------- GPT helper ----------
async function sendGPT(text) {
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: text }
    ]
  });
  return completion.choices[0].message.content.trim();
}

// ---------- Telegram helpers ----------
async function tgSend(chatId, text) {
  await fetch(`${TG_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

// ---------- /tg webhook ----------
app.post("/tg", async (req, res) => {
  const msg = req.body?.message;
  if (!msg) return res.sendStatus(200);

  const cid = msg.chat.id.toString();
  if (!ALLOWED.includes(cid)) return res.sendStatus(200);

  const userText = msg.text || "";
  const reply    = await sendGPT(userText);
  await tgSend(cid, reply);
  res.sendStatus(200);
});

// ---------- root route ----------
app.get("/", (req, res) => res.send("X2 Telegram bot is running 🚀"));
app.listen(process.env.PORT || 8080);

