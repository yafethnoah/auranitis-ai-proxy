import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 10000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "auranitis-ai-proxy" });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: "Missing message" });
    if (!OPENAI_API_KEY)
      return res.status(500).json({ error: "OPENAI_API_KEY not set" });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: message
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);
    const data = await response.json();

    const text =
      data?.output?.[0]?.content?.[0]?.text ??
      data?.output_text ??
      "No response";

    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`AI proxy running on port ${PORT}`);
});
