/* =========================================================
   COGNITIVE FORGE - GEMINI QUESTION GENERATION API
   Primary: Gemini 3.5 Flash-Lite
   Backup:  Gemini 3.8 Flash
   ========================================================= */

const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash"
];

const MAX_RETRIES = 2;

/* ================= HELPERS ================= */

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    error: message
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ================= JSON PARSER ================= */

function parseModelJSON(text) {
  const cleaned = String(text || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start < 0 || end < start) {
    throw new Error("Gemini returned incomplete JSON.");
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (error) {
    console.error("Gemini JSON parsing failed:", error.message);
    throw new Error(
      "Gemini returned invalid JSON. Please retry."
    );
  }
}

/* ================= ANSWER VALIDATION ================= */

function normaliseAnswer(answer, options) {
  if (Number.isInteger(answer)) {
    return answer >= 0 && answer < options.length
      ? answer
      : -1;
  }

  if (typeof answer !== "string") {
    return -1;
  }

  const value = answer.trim();

  if (/^[A-D]$/i.test(value)) {
    return value.toUpperCase().charCodeAt(0) - 65;
  }

  if (/^[1-4]$/.test(value)) {
    return Number(value) - 1;
  }

  return options.findIndex(
    option =>
      option.toLowerCase() === value.toLowerCase()
  );
}

/* ================= QUESTION VALIDATION ================= */

function validateQuestions(data, count) {
  if (!Array.isArray(data.questions)) {
    throw new Error(
      "Gemini response does not contain a questions array."
    );
  }

  const questions = data.questions
    .map(item => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const question = String(
        item.question || ""
      ).trim();

      const options = item.options;

      if (
        !question ||
        !Array.isArray(options) ||
        options.length !== 4
      ) {
        return null;
      }

      const cleanOptions = options.map(option =>
        String(option).trim()
      );

      if (cleanOptions.some(option => !option)) {
        return null;
      }

      const answer = normaliseAnswer(
        item.answer,
        cleanOptions
      );

      if (answer < 0) {
        return null;
      }

      return {
        question,
        options: cleanOptions,
        answer,
        explanation: String(
          item.explanation || "Review the topic and try again."
        ),
        type: "MCQ"
      };
    })
    .filter(Boolean);

  if (!questions.length) {
    throw new Error(
      "No valid questions were generated."
    );
  }

  return questions.slice(0, count);
}

/* ================= STRUCTURED OUTPUT SCHEMA ================= */

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    questions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          question: {
            type: "STRING"
          },
          options: {
            type: "ARRAY",
            items: {
              type: "STRING"
            }
          },
          answer: {
            type: "INTEGER"
          },
          explanation: {
            type: "STRING"
          }
        },
        required: [
          "question",
          "options",
          "answer",
          "explanation"
        ],
        propertyOrdering: [
          "question",
          "options",
          "answer",
          "explanation"
        ]
      }
    }
  },
  required: ["questions"]
};

/* ================= GEMINI REQUEST ================= */

async function callGemini(apiKey, model, prompt) {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },

    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],

      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 8192
      }
    })
  });

  const raw = await response.text();

  let result;

  try {
    result = JSON.parse(raw);
  } catch {
    const error = new Error(
      `Invalid Gemini API response. HTTP ${response.status}`
    );
    error.status = response.status;
    throw error;
  }

  if (!response.ok) {
    const error = new Error(
      result.error?.message ||
      `Gemini API error: ${response.status}`
    );

    error.status = response.status;
    throw error;
  }

  const candidate = result.candidates?.[0];

  if (!candidate) {
    throw new Error(
      "Gemini did not return a response candidate."
    );
  }

  if (candidate.finishReason === "MAX_TOKENS") {
    throw new Error(
      "Gemini response was cut short. Try fewer questions."
    );
  }

  const text = candidate.content?.parts
    ?.map(part => part.text || "")
    .join("");

  if (!text) {
    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return text;
}

/* ================= RETRY AND FALLBACK ================= */

async function generateWithFallback(apiKey, prompt) {
  const configuredModel = process.env.GEMINI_MODEL;

  const models = [
    ...(configuredModel ? [configuredModel] : []),
    ...MODELS
  ];

  const uniqueModels = [...new Set(models)];

  let lastError;

  for (const model of uniqueModels) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `Gemini attempt: ${model}, attempt ${attempt}`
        );

        return await callGemini(
          apiKey,
          model,
          prompt
        );

      } catch (error) {
        lastError = error;

        console.error(
          `${model} attempt ${attempt} failed:`,
          error.message
        );

        const retryable =
          !error.status ||
          [429, 500, 502, 503, 504].includes(error.status);

        if (!retryable) {
          throw error;
        }

        if (attempt < MAX_RETRIES) {
          const delay = 1000 * attempt;
          console.log(`Retrying after ${delay}ms.`);
          await sleep(delay);
        }
      }
    }

    console.log(
      `${model} unavailable. Trying next model.`
    );
  }

  throw new Error(
    `All Gemini models failed. ${
      lastError?.message || "Please try again later."
    }`
  );
}

/* ================= MAIN API HANDLER ================= */

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "Cognitive Forge API connected.",
      primaryModel: MODELS[0],
      backupModel: MODELS[1]
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return sendError(res, 405, "Method not allowed.");
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return sendError(
      res,
      500,
      "GEMINI_API_KEY is missing. Check .env.local."
    );
  }

  try {
    const body = req.body || {};

    const level = String(
      body.level || "Engineering"
    );

    const subject = String(
      body.subject || "General"
    );

    const difficulty = String(
      body.difficulty || "Medium"
    );

    const questionType = String(
      body.questionType || "MCQs"
    );

    const count = Math.min(
      30,
      Math.max(1, Number(body.count) || 20)
    );

    const topics = Array.isArray(body.topics)
      ? body.topics.map(String).slice(0, 40)
      : [];

    const slideText = String(
      body.slideText || ""
    ).slice(0, 20000);

    const extraInstructions = String(
      body.extraInstructions || ""
    ).slice(0, 2000);

    /* Build prompt */

    const prompt = `
You are an expert educational question setter
for Cognitive Forge.

Generate ${count} original multiple-choice questions.

STUDENT LEVEL: ${level}
SUBJECT: ${subject}
DIFFICULTY: ${difficulty}
QUESTION TYPE: ${questionType}

TOPICS:
${topics.length ? topics.join(", ") : "Use the subject syllabus."}

PRESENTATION CONTENT:
${slideText || "No presentation uploaded."}

EXTRA INSTRUCTIONS:
${extraInstructions || "None."}

RULES:
1. Generate original, accurate questions.
2. Match the student's academic level.
3. Use the listed topics.
4. If presentation content exists, prioritize it.
5. Every question must have exactly four options.
6. Exactly one option must be correct.
7. Answer must be a zero-based integer: 0, 1, 2, or 3.
8. Include a clear explanation.
9. Do not repeat questions.
10. Do not invent facts or contradict supplied material.
11. Generate exactly ${count} questions if possible.

Return data matching the supplied JSON response schema.
Do not include markdown or commentary.
`;

    /* Generate */

    const generatedText = await generateWithFallback(
      apiKey,
      prompt
    );

    /* Parse */

    const parsed = parseModelJSON(generatedText);

    /* Validate */

    const questions = validateQuestions(
      parsed,
      count
    );

    /* Return expected frontend format */

    return res.status(200).json({
      success: true,
      level,
      subject,
      requestedCount: count,
      returnedCount: questions.length,
      questions
    });

  } catch (error) {
    console.error(
      "Cognitive Forge API error:",
      error
    );

    const status = [429, 503].includes(error.status)
      ? error.status
      : 500;

    return sendError(
      res,
      status,
      error.message || "Question generation failed."
    );
  }
}

