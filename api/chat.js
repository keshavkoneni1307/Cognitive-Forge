export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured on the server."
    });
  }

  try {
    const {
      message,
      history = [],
      level = "Not specified",
      subject = "General"
    } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Please enter your doubt." });
    }

    // Keep the conversation short to reduce latency and token usage.
    const safeHistory = Array.isArray(history)
      ? history.slice(-10).filter(item =>
          item &&
          ["user", "model"].includes(item.role) &&
          typeof item.text === "string"
        )
      : [];

    const contents = [
      ...safeHistory.map(item => ({
        role: item.role,
        parts: [{ text: item.text.slice(0, 3000) }]
      })),
      {
        role: "user",
        parts: [{ text: message.trim().slice(0, 5000) }]
      }
    ];

    const systemInstruction = `
You are Forge AI Tutor, the friendly and highly capable doubt-solving assistant
inside Cognitive Forge, an Indian EdTech learning platform.

Student level: ${String(level).slice(0, 100)}
Current subject: ${String(subject).slice(0, 100)}

YOUR RULES:
1. Reply in the same language and writing style the student uses.
2. Understand and naturally respond to English, Hindi, Hinglish, Telugu,
   Tenglish, Tamil, Tanglish, Kannada, Malayalam, Marathi, Bengali, Gujarati,
   Punjabi, Odia, Urdu and other Indian languages.
3. If the student mixes languages, you may also mix languages naturally.
4. Explain concepts in simple, student-friendly language appropriate to
   the student's level.
5. Give step-by-step explanations for difficult concepts.
6. For programming doubts, include correct code examples when useful.
7. For maths, show the calculation steps clearly.
8. Use examples from everyday life when they help understanding.
9. Do not invent facts. If you are unsure, say so.
10. Be encouraging, patient and concise. Do not unnecessarily repeat the
    student's question.
11. Use readable formatting: short paragraphs, numbered steps and code blocks.
12. If the question is unrelated to learning, politely answer briefly and
    guide the student back to learning.

Do not claim to have read a student's PPT, notes or files unless their content
is actually provided in the conversation.
`;

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const googleResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents,
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1200
        }
      })
    });

    const result = await googleResponse.json();

    if (!googleResponse.ok) {
      const googleMessage =
        result?.error?.message || "Gemini could not process the request.";

      console.error("Gemini chat API error:", googleResponse.status, googleMessage);

      return res.status(googleResponse.status >= 500 ? 503 : 400).json({
        error: googleMessage
      });
    }

    const answer = (result?.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({
        error: "The AI returned an empty answer. Please try again."
      });
    }

    return res.status(200).json({
      success: true,
      answer
    });

  } catch (error) {
    console.error("Forge AI chat error:", error);

    return res.status(500).json({
      error: "Something went wrong. Please try again."
    });
  }
}
