const DEFAULT_MODEL = "gemini-3.5-flash";

function cleanText(value, maxLength = 12000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function getHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .slice(-12)
    .filter(
      (item) =>
        item &&
        ["user", "model"].includes(item.role) &&
        typeof item.text === "string"
    )
    .map((item) => ({
      role: item.role,
      parts: [{ text: cleanText(item.text, 4000) }]
    }))
    .filter((item) => item.parts[0].text.length > 0);
}

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "Cognitive Forge AI Chat API is running."
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST."
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "GEMINI_API_KEY is missing in environment variables."
      });
    }

    const body = req.body || {};

    const message = cleanText(body.message, 5000);
    const level = cleanText(body.level, 100);
    const subject = cleanText(body.subject, 150);
    const topics = cleanText(body.topics, 5000);
    const slideText = cleanText(body.slideText, 12000);
    const languagePreference = cleanText(
      body.languagePreference || "Automatically detect the student's language",
      150
    );

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Please enter your doubt or question."
      });
    }

    const history = getHistory(body.history);

    const systemPrompt = `
You are Forge AI Tutor, the personal AI doubt-solving assistant
of Cognitive Forge, an Indian EdTech learning platform.

YOUR MAIN JOB:
Help students understand concepts, solve doubts, learn programming,
prepare for exams, and improve their problem-solving skills.

LANGUAGE RULES — VERY IMPORTANT:

1. Automatically identify the language used by the student.
2. Reply in the SAME language and writing style as the student.
3. Support Indian languages and mixed-language conversations.
4. Examples include:
   - Hinglish: Hindi + English
   - Tenglish: Telugu + English
   - Tanglish: Tamil + English
   - Kanglish: Kannada + English
   - Manglish: Malayalam + English
   - Benglish: Bengali + English
   - Marathi-English
   - Gujarati-English
   - Punjabi-English
   - Odia-English
   - Assamese-English
   - Urdu-English
   - Other Indian languages and combinations.
5. Understand Roman-script Indian languages too.
   Example: "Inheritance ante enti?" or "Photosynthesis kya hai?"
6. Do not force the student to use English.
7. Do not translate everything into English unless requested.
8. Preserve important technical terms, programming keywords,
   mathematical symbols and scientific terminology.
9. If the student changes language, follow the new language.
10. If the student uses mixed languages, respond naturally
    using a similar mixture.
11. Use simple, student-friendly language.

TEACHING STYLE:

- Be friendly, patient and encouraging.
- Explain difficult concepts in simple steps.
- Use examples from everyday Indian life when helpful.
- For mathematics, show formulas and calculation steps.
- For programming, explain the logic and provide code examples.
- For code errors, identify the likely cause and show a correction.
- For exam questions, explain why the answer is correct.
- Use headings and bullet points when they improve readability.
- Do not invent facts, syllabus details or textbook references.
- If you are unsure, clearly say so.
- Never claim to have read a PPT unless its content is provided.

ANSWER FORMAT:

For a concept question:
1. Simple explanation
2. Step-by-step breakdown
3. Example
4. Short summary

For a programming question:
1. Explain the concept or error
2. Give corrected code if appropriate
3. Explain how the code works

For a short doubt, give a concise answer.
Do not force a long format for every question.

STUDENT CONTEXT:
Education level: ${level || "Not specified"}
Selected subject: ${subject || "Not specified"}
Selected topics: ${topics || "Not specified"}
Preferred language: ${languagePreference}

UPLOADED STUDY MATERIAL:
${slideText || "No uploaded PPT content was provided."}

IMPORTANT:
When uploaded study material is available, prioritize it for
questions about that material. If the material does not contain
the answer, clearly distinguish your general knowledge from
the uploaded content.

You are an educational assistant. Stay focused on learning,
education, programming and student doubts.
`;

    const contents = [
      ...history,
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const model =
      cleanText(process.env.GEMINI_MODEL, 100) || DEFAULT_MODEL;

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(model)}:generateContent`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let response;

    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            temperature: 0.65,
            maxOutputTokens: 1800,
            responseMimeType: "text/plain"
          }
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", result);

      const apiMessage =
        result?.error?.message ||
        "Gemini could not process the request.";

      return res.status(response.status >= 500 ? 503 : response.status).json({
        success: false,
        error: apiMessage
      });
    }

    const reply = (
      result?.candidates?.[0]?.content?.parts || []
    )
      .map((part) => part.text || "")
      .join("\n")
      .trim();

    if (!reply) {
      return res.status(502).json({
        success: false,
        error: "AI returned an empty response. Please try again."
      });
    }

    return res.status(200).json({
      success: true,
      reply,
      model,
      usage: result.usageMetadata || null
    });

  } catch (error) {
    console.error("Cognitive Forge Chat Error:", error);

    const isTimeout = error.name === "AbortError";

    return res.status(isTimeout ? 504 : 500).json({
      success: false,
      error: isTimeout
        ? "AI is taking too long. Please try again."
        : "Something went wrong while processing your doubt."
    });
  }
}
