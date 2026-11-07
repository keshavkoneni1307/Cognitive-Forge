/* =========================================================
   COGNITIVE FORGE — MAIN APPLICATION
   AI endpoint: POST /api/generate-questions
   ========================================================= */

"use strict";

const CATALOG = {
  "Class X": {
    "Mathematics": ["Real Numbers","Polynomials","Pair of Linear Equations","Quadratic Equations","Arithmetic Progressions","Triangles","Coordinate Geometry","Trigonometry","Circles","Areas Related to Circles","Surface Areas and Volumes","Statistics","Probability"],
    "Science": ["Chemical Reactions","Acids Bases and Salts","Metals and Non-metals","Carbon Compounds","Life Processes","Control and Coordination","Reproduction","Heredity","Light","Human Eye","Electricity","Magnetic Effects of Current","Our Environment"],
    "Social Science": ["Nationalism in Europe","Nationalism in India","Global World","Industrialisation","Print Culture","Resources and Development","Forest and Wildlife","Water Resources","Agriculture","Minerals and Energy","Manufacturing Industries","Lifelines of National Economy","Power Sharing","Federalism","Political Parties","Outcomes of Democracy","Development","Sectors of Indian Economy","Money and Credit","Globalisation"],
    "English Language and Literature": ["Reading Skills","Writing Skills","Grammar","First Flight Prose","First Flight Poetry","Footprints Without Feet"],
    "English Communicative": ["Reading","Writing","Grammar","Literature Reader"],
    "Hindi Course A": ["क्षितिज","कृतिका","व्याकरण","लेखन"],
    "Hindi Course B": ["स्पर्श","संचयन","व्याकरण","लेखन"],
    "Sanskrit": ["व्याकरण","रचनात्मक कार्य","पठित अवबोधन"],
    "Computer Applications": ["Networking","HTML","CSS","Cyber Safety","Internet Services"],
    "Information Technology": ["Digital Documentation","Spreadsheets","Database Management","Web Applications"],
    "Artificial Intelligence": ["AI Project Cycle","Data Literacy","Machine Learning","NLP","AI Evaluation"],
    "Painting": ["Elements of Art","Principles of Art","Composition","Art Appreciation"]
  },

  "Class XII": {
    "Physics": ["Electric Charges and Fields","Electrostatic Potential","Current Electricity","Moving Charges and Magnetism","Magnetism and Matter","Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Ray Optics","Wave Optics","Dual Nature","Atoms","Nuclei","Semiconductor Electronics"],
    "Chemistry": ["Solutions","Electrochemistry","Chemical Kinetics","d and f Block Elements","Coordination Compounds","Haloalkanes","Alcohols Phenols and Ethers","Aldehydes and Ketones","Amines","Biomolecules"],
    "Mathematics": ["Relations and Functions","Inverse Trigonometry","Matrices","Determinants","Continuity","Differentiation","Applications of Derivatives","Integrals","Differential Equations","Vector Algebra","Three Dimensional Geometry","Linear Programming","Probability"],
    "Biology": ["Sexual Reproduction in Flowering Plants","Human Reproduction","Reproductive Health","Inheritance","Molecular Basis of Inheritance","Evolution","Human Health and Disease","Microbes","Biotechnology","Organisms and Populations","Ecosystem","Biodiversity"],
    "Computer Science": ["Python Revision","Functions","Exception Handling","File Handling","Stack","Queue","Searching","Sorting","Database Concepts","SQL","Computer Networks"],
    "Informatics Practices": ["Pandas","Data Handling","Data Visualization","SQL","Computer Networks","Societal Impacts"],
    "Accountancy": ["Partnership Accounts","Admission of Partner","Retirement of Partner","Dissolution","Share Capital","Debentures","Financial Statements","Accounting Ratios","Cash Flow Statement"],
    "Business Studies": ["Principles of Management","Business Environment","Planning","Organising","Staffing","Directing","Controlling","Financial Management","Marketing Management","Consumer Protection"],
    "Economics": ["National Income","Money and Banking","Income and Employment","Government Budget","Balance of Payments","Economic Reforms","Human Capital","Rural Development","Employment"],
    "History": ["Bricks Beads and Bones","Kings Farmers and Towns","Kinship Caste and Class","Thinkers and Beliefs","Travellers","Bhakti Sufi Traditions","Vijayanagara","Colonialism","Rebels and the Raj","Mahatma Gandhi","Framing the Constitution"],
    "Geography": ["Human Geography","Population","Human Development","Primary Activities","Secondary Activities","Transport","Communication","International Trade","Human Settlements"],
    "Political Science": ["End of Bipolarity","Centres of Power","South Asia","International Organisations","Security","Environment","Nation Building","One Party Dominance","Planned Development","External Relations","Regional Aspirations"],
    "Sociology": ["Indian Society","Demographic Structure","Social Institutions","Social Inequality","Cultural Diversity","Structural Change","Cultural Change","Democracy","Globalisation"],
    "Psychology": ["Psychological Attributes","Self and Personality","Life Challenges","Psychological Disorders","Therapeutic Approaches","Attitude","Social Influence"],
    "English Core": ["Reading Comprehension","Creative Writing","Flamingo Prose","Flamingo Poetry","Vistas"],
    "Physical Education": ["Planning in Sports","Sports Nutrition","Yoga","Sports for CWSN","Women in Sports","Test and Measurement","Physiology","Biomechanics","Sports Psychology","Sports Training"],
    "Entrepreneurship": ["Entrepreneurial Opportunity","Planning","Marketing","Growth Strategies","Business Arithmetic","Resource Mobilisation"],
    "Legal Studies": ["Judiciary","Alternative Dispute Resolution","Human Rights","Legal Profession","Legal Services","International Context"]
  },

  "Engineering": {
    "Python Programming": ["Python Fundamentals","Variables and Data Types","Operators","Conditional Statements","Loops","Strings","Lists","Tuples","Sets","Dictionaries","Functions","Recursion","Modules","File Handling","Exception Handling","OOP","Libraries"],
    "Java Programming": ["Java Fundamentals","Data Types","Control Flow","Arrays","Strings","Methods","Classes and Objects","Constructors","Inheritance","Polymorphism","Abstraction","Interfaces","Exception Handling","Collections","Generics","Multithreading","File I/O"],
    "C Programming": ["C Fundamentals","Data Types","Operators","Decision Making","Loops","Functions","Arrays","Strings","Pointers","Dynamic Memory","Structures","Unions","File Handling","Preprocessor","Recursion","Searching and Sorting"],
    "DSA in Java": ["Algorithm Analysis","Big O Notation","Arrays","Strings","Linked Lists","Stacks","Queues","Recursion","Trees","Binary Search Trees","Heaps","Hashing","Graphs","BFS","DFS","Sorting","Searching","Greedy Algorithms","Dynamic Programming"]
  }
};

const STORE = {
  level: "cf_level",
  progress: "cf_progress",
  tasks: "cf_tasks",
  notes: "cf_notes",
  mistakes: "cf_mistakes",
  completed: "cf_completed"
};

function $(id) {
  return document.getElementById(id);
}

function readStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    showToast("Browser storage is full.");
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    console.warn(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 4500);
}

const state = {
  level: CATALOG[localStorage.getItem(STORE.level)]
    ? localStorage.getItem(STORE.level)
    : "Engineering",

  progress: readStore(STORE.progress, {}),
  tasks: readStore(STORE.tasks, []),
  notes: readStore(STORE.notes, []),
  mistakes: readStore(STORE.mistakes, []),
  completed: readStore(STORE.completed, []),

  pptText: "",
  pptSlides: [],
  detectedTopics: [],
  quiz: null
};

function currentSubjects() {
  return Object.keys(CATALOG[state.level] || {});
}

function getTopics(subject) {
  return CATALOG[state.level]?.[subject] || [];
}

function subjectKey(subject) {
  return `${state.level}::${subject}`;
}

/* ================= NAVIGATION ================= */

function showPage(page) {
  document.querySelectorAll(".page").forEach(el => {
    el.classList.remove("active");
  });

  $(page)?.classList.add("active");

  document.querySelectorAll(".nav").forEach(el => {
    el.classList.toggle("active", el.dataset.page === page);
  });

  const names = {
    dashboard: "Dashboard",
    subjects: "My Subjects",
    ppt: "PPT Analyzer",
    practice: "Practice Lab",
    assignments: "Assignments",
    planner: "Study Planner",
    notes: "My Notes",
    analytics: "Performance"
  };

  if ($("pageHeading")) {
    $("pageHeading").textContent = names[page] || page;
  }

  if ($("breadcrumb")) {
    $("breadcrumb").textContent =
      `COGNITIVE FORGE / ${(names[page] || page).toUpperCase()}`;
  }

  $("sidebar")?.classList.remove("open");

  populateSubjectSelects();

  if (page === "dashboard") renderDashboard();
  if (page === "subjects") renderSubjects();
  if (page === "assignments") renderAssignments();
  if (page === "planner") renderTasks();
  if (page === "notes") renderNotes();
  if (page === "analytics") renderAnalytics();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function toggleSidebar() {
  $("sidebar")?.classList.toggle("open");
}

/* ================= EDUCATION LEVEL ================= */

function selectLevel(level, navigateToSubjects = true) {
  if (!CATALOG[level]) return;

  state.level = level;
  localStorage.setItem(STORE.level, level);

  if ($("profileLevel")) {
    $("profileLevel").textContent = level;
  }

  if ($("currentLevel")) {
    $("currentLevel").textContent = `${level} selected`;
  }

  if ($("subjectLevel")) {
    $("subjectLevel").value = level;
  }

  populateSubjectSelects();
  renderDashboard();
  renderSubjects();
  renderAssignments();

  if (navigateToSubjects) {
    showPage("subjects");
  }
}

/* ================= SUBJECTS ================= */

function populateSubjectSelects() {
  const subjects = currentSubjects();

  const ids = [
    "pptSubject",
    "practiceSubject",
    "assignmentSubject",
    "taskSubject",
    "noteSubject"
  ];

  ids.forEach(id => {
    const select = $(id);
    if (!select) return;

    const previous = select.value;

    select.innerHTML = subjects.map(subject => `
      <option value="${escapeHTML(subject)}">
        ${escapeHTML(subject)}
      </option>
    `).join("");

    if (subjects.includes(previous)) {
      select.value = previous;
    }
  });
}

function renderSubjects() {
  const target = $("allSubjects");
  if (!target) return;

  const search = ($("subjectSearch")?.value || "")
    .trim()
    .toLowerCase();

  const filtered = currentSubjects().filter(subject =>
    subject.toLowerCase().includes(search)
  );

  target.innerHTML = filtered.map(subject => {
    const topics = getTopics(subject);

    return `
      <article class="subject-card">
        <div class="subject-icon">
          ${escapeHTML(subject.slice(0, 2))}
        </div>

        <h3>${escapeHTML(subject)}</h3>

        <p>
          ${topics.length} topics available:
          ${escapeHTML(topics.slice(0, 4).join(", "))}
        </p>

        <div class="subject-meta">
          <span>${topics.length} topics</span>
          <span>15 assignments</span>
          <span>20 practice questions</span>
        </div>

        <button onclick="openSubject('${escapeHTML(subject)}')">
          Start learning →
        </button>
      </article>
    `;
  }).join("") || '<div class="empty">No subjects found.</div>';
}

function openSubject(subject) {
  showPage("practice");

  if ($("practiceSubject")) {
    $("practiceSubject").value = subject;
  }
}

function renderDashboard() {
  const subjects = currentSubjects();

  const attempted = Object.values(state.progress)
    .reduce((sum, p) => sum + Number(p.attempted || 0), 0);

  const correct = Object.values(state.progress)
    .reduce((sum, p) => sum + Number(p.correct || 0), 0);

  if ($("statSubjects")) {
    $("statSubjects").textContent = subjects.length;
  }

  if ($("statAttempted")) {
    $("statAttempted").textContent = attempted;
  }

  if ($("statCorrect")) {
    $("statCorrect").textContent = correct;
  }

  if ($("statPending")) {
    $("statPending").textContent =
      state.tasks.filter(t => !t.completed).length;
  }

  if ($("dashboardSubjects")) {
    $("dashboardSubjects").innerHTML =
      subjects.slice(0, 6).map(subject => `
        <article class="subject-card">
          <div class="subject-icon">
            ${escapeHTML(subject.slice(0, 2))}
          </div>

          <h3>${escapeHTML(subject)}</h3>

          <p>${getTopics(subject).length} syllabus topics available.</p>

          <div class="subject-meta">
            <span>15 assignments</span>
            <span>20 practice questions</span>
          </div>

          <button onclick="openSubject('${escapeHTML(subject)}')">
            Continue learning →
          </button>
        </article>
      `).join("");
  }
}

/* ================= PPT UPLOAD ================= */

let selectedPPT = null;

$("pptFile")?.addEventListener("change", event => {
  handlePPTFile(event.target.files?.[0]);
});

const dropzone = $("dropzone");

if (dropzone) {
  ["dragenter", "dragover"].forEach(type => {
    dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.style.borderColor = "#39e0a0";
    });
  });

  ["dragleave", "drop"].forEach(type => {
    dropzone.addEventListener(type, event => {
      event.preventDefault();
      dropzone.style.borderColor = "";
    });
  });

  dropzone.addEventListener("drop", event => {
    handlePPTFile(event.dataTransfer?.files?.[0]);
  });
}

function handlePPTFile(file) {
  if (!file) return;

  if (!/\.pptx$/i.test(file.name)) {
    showToast("Please select a PowerPoint .pptx file.");
    return;
  }

  if (file.size > 15 * 1024 * 1024) {
    showToast("Maximum PPT size is 15 MB.");
    return;
  }

  selectedPPT = file;

  $("fileInfo").textContent =
    `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;

  $("analyzeBtn").disabled = false;
}

async function extractPPTX(file) {
  if (!window.JSZip) {
    throw new Error("PPTX reader did not load. Refresh and try again.");
  }

  const zip = await JSZip.loadAsync(file);

  const names = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)/i)[1]);
      const nb = Number(b.match(/slide(\d+)/i)[1]);
      return na - nb;
    });

  const slides = [];

  for (const name of names) {
    const xml = await zip.files[name].async("text");

    const text = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)]
      .map(match => match[1]
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
      )
      .join(" ")
      .trim();

    if (text) {
      slides.push({
        number: Number(name.match(/slide(\d+)/i)[1]),
        text
      });
    }
  }

  return slides;
}

function detectTopics(text, subject) {
  const lower = text.toLowerCase();

  const matched = getTopics(subject).filter(topic =>
    lower.includes(topic.toLowerCase())
  );

  if (matched.length) return matched;

  const words = text.match(/\b[A-Za-z][A-Za-z0-9-]{4,}\b/g) || [];
  const frequency = {};

  words.forEach(word => {
    const clean = word.toLowerCase();

    if (![
      "which", "there", "their", "these", "about",
      "using", "where", "would", "should", "could", "from"
    ].includes(clean)) {
      frequency[clean] = (frequency[clean] || 0) + 1;
    }
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word[0].toUpperCase() + word.slice(1));
}

async function analyzePPT() {
  if (!selectedPPT) {
    showToast("Choose a .pptx file first.");
    return;
  }

  const button = $("analyzeBtn");

  button.disabled = true;
  button.textContent = "Reading presentation…";

  try {
    state.pptSlides = await extractPPTX(selectedPPT);

    state.pptText = state.pptSlides
      .map(slide => `Slide ${slide.number}: ${slide.text}`)
      .join("\n")
      .slice(0, 45000);

    if (state.pptText.length < 30) {
      throw new Error(
        "No readable text found in the PPT. Check that slides contain selectable text."
      );
    }

    const subject = $("pptSubject").value;

    state.detectedTopics = detectTopics(state.pptText, subject);

    if (!state.detectedTopics.length) {
      throw new Error("No topics could be detected in this presentation.");
    }

    $("topicCount").textContent =
      `${state.detectedTopics.length} topics`;

    $("slideInfo").textContent =
      `${state.pptSlides.length} slides processed · ${state.pptText.length} characters extracted`;

    $("topicList").innerHTML =
      state.detectedTopics.map(topic => `
        <label class="topic-chip">
          <input type="checkbox" value="${escapeHTML(topic)}" checked>
          ${escapeHTML(topic)}
        </label>
      `).join("");

    $("topicPanel").classList.remove("hidden");

    showToast("PPT text extracted successfully.");

  } catch (error) {
    showToast(error.message || "Could not analyze the PPT.");
  } finally {
    button.disabled = false;
    button.textContent = "Analyze presentation →";
  }
}

/* ================= AI QUESTION GENERATION ================= */

/*
  The backend should return:
  {
    "questions": [
      {
        "question": "Question text",
        "options": ["A", "B", "C", "D"],
        "answer": 0,
        "explanation": "Explanation"
      }
    ]
  }
*/

function normaliseQuestion(raw) {
  if (!raw || typeof raw !== "object") return null;

  const question = raw.question || raw.prompt || raw.text;

  let options = raw.options || raw.choices || raw.answers;

  if (options && !Array.isArray(options) && typeof options === "object") {
    options = Object.values(options);
  }

  if (typeof options === "string") {
    options = options
      .split(/\n|[A-D][).:-]\s*/)
      .map(item => item.trim())
      .filter(Boolean);
  }

  if (!question || !Array.isArray(options) || options.length < 2) {
    return null;
  }

  const rawAnswer =
    raw.answer ??
    raw.correctAnswer ??
    raw.correct_answer ??
    raw.correctOption ??
    raw.answerIndex;

  let answer = Number.isInteger(rawAnswer) ? rawAnswer : -1;

  if (answer < 0 && typeof rawAnswer === "string") {
    const value = rawAnswer.trim();

    if (/^[A-D]$/i.test(value)) {
      answer = value.toUpperCase().charCodeAt(0) - 65;
    } else {
      const exact = options.findIndex(option =>
        String(option).trim().toLowerCase() === value.toLowerCase()
      );

      if (exact >= 0) {
        answer = exact;
      } else if (/^\d+$/.test(value)) {
        answer = Number(value) - 1;
      }
    }
  }

  if (answer < 0 || answer >= options.length) {
    return null;
  }

  return {
    question: String(question),
    options: options.map(String),
    answer,
    explanation: String(
      raw.explanation ||
      raw.rationale ||
      raw.solution ||
      "Review the concept and try a similar question."
    ),
    type: String(raw.type || raw.questionType || "MCQ"),
    answered: false
  };
}

async function requestAI(payload) {
  let response;

  try {
    response = await fetch("/api/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

  } catch (error) {
    throw new Error(
      "Cannot reach the AI API. Run `npx vercel dev` and open http://localhost:3000. Do not use Live Server or file://."
    );
  }

  const responseText = await response.text();

  let data;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    throw new Error(
      `API returned non-JSON (HTTP ${response.status}). Check api/generate-questions.js.`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `AI endpoint failed with HTTP ${response.status}.`
    );
  }

  let list =
    data.questions ||
    data.data?.questions ||
    data.result?.questions;

  if (!Array.isArray(list) && Array.isArray(data)) {
    list = data;
  }

  if (!Array.isArray(list) && typeof data.output === "string") {
    try {
      list = JSON.parse(data.output).questions;
    } catch {}
  }

  if (!Array.isArray(list)) {
    throw new Error(
      "API response format is incorrect. Expected { questions: [...] }."
    );
  }

  const questions = list
    .map(normaliseQuestion)
    .filter(Boolean);

  if (!questions.length) {
    throw new Error(
      "API returned no valid questions. Check the answer and options format in api/generate-questions.js."
    );
  }

  return questions;
}

async function generatePPTQuestions() {
  const topics = [
    ...document.querySelectorAll("#topicList input:checked")
  ].map(input => input.value);

  if (!topics.length) {
    showToast("Select at least one topic.");
    return;
  }

  const button = $("topicPanel").querySelector("button");

  button.disabled = true;
  button.textContent = "Generating questions…";

  try {
    const questions = await requestAI({
      level: state.level,
      subject: $("pptSubject").value,
      topics,
      difficulty: $("pptDifficulty").value,
      count: Number($("pptCount").value),
      questionType: $("pptType").value,
      source: "Uploaded college PPT",
      slideText: state.pptText,
      extraInstructions: $("extraInstructions").value
    });

    renderQuiz(
      questions,
      "pptQuiz",
      $("pptSubject").value
    );

  } catch (error) {
    showToast(error.message);

  } finally {
    button.disabled = false;
    button.textContent = "Generate questions →";
  }
}

async function generatePractice() {
  const subject = $("practiceSubject").value;
  const button = document.querySelector("#practice .primary-btn");

  button.disabled = true;
  button.textContent = "Preparing questions…";

  try {
    const questions = await requestAI({
      level: state.level,
      subject,
      topics: getTopics(subject),
      difficulty: $("practiceDifficulty").value,
      count: Number($("practiceCount").value),
      questionType: $("practiceType").value,
      source: state.level === "Engineering"
        ? "Engineering syllabus"
        : "NCERT-aligned syllabus",
      slideText: "",
      extraInstructions:
        "Create original syllabus-aligned questions with accurate answers and concise explanations. Do not reproduce textbook wording. For MCQs, provide four options and answer as A, B, C or D."
    });

    renderQuiz(questions, "practiceQuiz", subject);

  } catch (error) {
    showToast(error.message);

  } finally {
    button.disabled = false;
    button.textContent = "Generate practice set →";
  }
}
/* ================= QUIZ ENGINE ================= */

function renderQuiz(questions, targetId, subject) {
  state.quiz = {
    questions,
    subject,
    targetId,
    index: 0,
    score: 0,
    wrong: []
  };

  renderQuestion();
}

function renderQuestion() {
  const quiz = state.quiz;
  if (!quiz) return;

  const q = quiz.questions[quiz.index];
  const target = $(quiz.targetId);

  if (!q) {
    finishQuiz();
    return;
  }

  target.innerHTML = `
    <div class="panel quiz-box">

      <div class="quiz-top">
        <span>${escapeHTML(quiz.subject)}</span>
        <span>Question ${quiz.index + 1} / ${quiz.questions.length}</span>
      </div>

      <div class="quiz-progress">
        <span style="width:${quiz.index / quiz.questions.length * 100}%"></span>
      </div>

      <span class="eyebrow">${escapeHTML(q.type)}</span>

      <h3 class="question">${escapeHTML(q.question)}</h3>

      <div class="options">
        ${q.options.map((option, index) => `
          <button class="option" onclick="selectAnswer(${index})">
            <b>${String.fromCharCode(65 + index)}.</b>
            ${escapeHTML(option)}
          </button>
        `).join("")}
      </div>

      <div id="answerExplanation"></div>

      <div class="quiz-footer">
        <button class="primary-btn" id="nextQuestion"
          disabled onclick="nextQuestion()">
          ${quiz.index === quiz.questions.length - 1
            ? "Finish quiz"
            : "Next question →"}
        </button>
      </div>

    </div>
  `;

  q.answered = false;
}

function selectAnswer(index) {
  const quiz = state.quiz;
  if (!quiz) return;

  const q = quiz.questions[quiz.index];

  if (q.answered) return;

  q.answered = true;

  const correct = q.answer === index;

  if (correct) {
    quiz.score++;
  } else {
    quiz.wrong.push({
      question: q.question,
      selected: q.options[index],
      correct: q.options[q.answer],
      explanation: q.explanation,
      subject: quiz.subject
    });
  }

  document.querySelectorAll(
    `#${quiz.targetId} .option`
  ).forEach((button, i) => {
    button.disabled = true;

    if (i === q.answer) {
      button.classList.add("correct");
    }

    if (i === index && !correct) {
      button.classList.add("wrong");
    }
  });

  $("answerExplanation").innerHTML = `
    <div class="explanation">
      <b>${correct
        ? "Correct answer!"
        : "Not quite. Review this concept."}</b>

      <p>${escapeHTML(q.explanation)}</p>
    </div>
  `;

  $("nextQuestion").disabled = false;
}

function nextQuestion() {
  if (!state.quiz) return;

  state.quiz.index++;
  renderQuestion();
}

function finishQuiz() {
  const quiz = state.quiz;

  const percentage = Math.round(
    quiz.score / quiz.questions.length * 100
  );

  const key = subjectKey(quiz.subject);

  const old = state.progress[key] || {
    attempted: 0,
    correct: 0
  };

  state.progress[key] = {
    attempted: old.attempted + quiz.questions.length,
    correct: old.correct + quiz.score
  };

  state.mistakes = [
    ...state.mistakes,
    ...quiz.wrong
  ].slice(-100);

  saveStore(STORE.progress, state.progress);
  saveStore(STORE.mistakes, state.mistakes);

  $(quiz.targetId).innerHTML = `
    <div class="panel quiz-box">
      <span class="eyebrow">SESSION COMPLETED</span>

      <h3>${escapeHTML(quiz.subject)}</h3>

      <div class="score">${percentage}%</div>

      <p class="muted">
        ${quiz.score} correct out of
        ${quiz.questions.length} questions.
      </p>

      <button class="primary-btn"
        onclick="showPage('analytics')">
        View performance →
      </button>
    </div>
  `;

  state.quiz = null;

  renderDashboard();
}

/* ================= ASSIGNMENTS ================= */

function assignmentQuestions(subject) {
  const topics = getTopics(subject);

  const prompts = [
    "Explain the fundamental concepts of",
    "Write a detailed note on",
    "Give two real-world applications of",
    "Prepare five revision questions about",
    "Explain the working process of",
    "Compare and contrast",
    "Solve a representative problem based on",
    "Identify common mistakes related to",
    "Create a diagram or flowchart explaining",
    "Prepare a short case study on",
    "Explain the importance of",
    "Describe the key characteristics of",
    "Give a worked example of",
    "Discuss the applications of",
    "Create a revision mind map for"
  ];

  return prompts.map((prompt, index) =>
    `${prompt} ${topics[index % topics.length]}.`
  );
}

function renderAssignments() {
  const subject = $("assignmentSubject")?.value;
  const target = $("assignmentList");

  if (!subject || !target) return;

  target.innerHTML = assignmentQuestions(subject)
    .map((question, index) => {
      const id = `${state.level}-${subject}-${index}`;
      const completed = state.completed.includes(id);

      return `
        <div class="assignment-row ${completed ? "done" : ""}">
          <span>${index + 1}.</span>

          <p>${escapeHTML(question)}</p>

          <input
            type="checkbox"
            ${completed ? "checked" : ""}
            onchange="toggleAssignment('${escapeHTML(id)}',this.checked)"
          >
        </div>
      `;
    }).join("");
}

function toggleAssignment(id, checked) {
  if (checked) {
    state.completed = [
      ...new Set([...state.completed, id])
    ];
  } else {
    state.completed = state.completed.filter(
      item => item !== id
    );
  }

  saveStore(STORE.completed, state.completed);

  renderAssignments();
  renderDashboard();
  renderAnalytics();
}

/* ================= STUDY PLANNER ================= */

$("taskForm")?.addEventListener("submit", event => {
  event.preventDefault();

  state.tasks.push({
    id: Date.now(),
    title: $("taskTitle").value.trim(),
    subject: $("taskSubject").value,
    date: $("taskDate").value,
    completed: false
  });

  saveStore(STORE.tasks, state.tasks);

  event.target.reset();

  if ($("taskDate")) {
    $("taskDate").value =
      new Date().toISOString().slice(0, 10);
  }

  renderTasks();
  renderDashboard();

  showToast("Study task added.");
});

function renderTasks() {
  const target = $("taskList");

  if (!target) return;

  if (!state.tasks.length) {
    target.innerHTML =
      '<div class="empty">No tasks added yet.</div>';
    return;
  }

  target.innerHTML = state.tasks.map(task => `
    <div class="task-row">

      <input
        type="checkbox"
        ${task.completed ? "checked" : ""}
        onchange="toggleTask(${Number(task.id)},this.checked)"
      >

      <div>
        <b>${escapeHTML(task.title)}</b>
        <small>
          ${escapeHTML(task.subject)} ·
          ${escapeHTML(task.date)}
        </small>
      </div>

      <button class="delete-btn"
        onclick="deleteTask(${Number(task.id)})">
        ×
      </button>

    </div>
  `).join("");
}

function toggleTask(id, checked) {
  state.tasks = state.tasks.map(task =>
    task.id === id
      ? { ...task, completed: checked }
      : task
  );

  saveStore(STORE.tasks, state.tasks);

  renderTasks();
  renderDashboard();
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(
    task => task.id !== id
  );

  saveStore(STORE.tasks, state.tasks);

  renderTasks();
  renderDashboard();
}

/* ================= NOTES ================= */

$("noteForm")?.addEventListener("submit", event => {
  event.preventDefault();

  state.notes.unshift({
    id: Date.now(),
    title: $("noteTitle").value.trim(),
    subject: $("noteSubject").value,
    text: $("noteText").value.trim()
  });

  saveStore(STORE.notes, state.notes);

  event.target.reset();

  renderNotes();

  showToast("Note saved.");
});

function renderNotes() {
  const target = $("notesList");

  if (!target) return;

  target.innerHTML = state.notes.map(note => `
    <article class="note-card">

      <h3>${escapeHTML(note.title)}</h3>

      <small>${escapeHTML(note.subject)}</small>

      <p>${escapeHTML(note.text).replace(/\n/g, "<br>")}</p>

      <button class="link-btn"
        onclick="deleteNote(${Number(note.id)})">
        Delete note
      </button>

    </article>
  `).join("") || '<div class="empty">No saved notes yet.</div>';
}

function deleteNote(id) {
  state.notes = state.notes.filter(
    note => note.id !== id
  );

  saveStore(STORE.notes, state.notes);

  renderNotes();
}

/* ================= PERFORMANCE ANALYTICS ================= */

function renderAnalytics() {
  const records = Object.values(state.progress);

  const attempted = records.reduce(
    (sum, p) => sum + Number(p.attempted || 0),
    0
  );

  const correct = records.reduce(
    (sum, p) => sum + Number(p.correct || 0),
    0
  );

  const accuracy = attempted
    ? Math.round(correct / attempted * 100)
    : 0;

  if ($("aAttempted")) {
    $("aAttempted").textContent = attempted;
  }

  if ($("aCorrect")) {
    $("aCorrect").textContent = correct;
  }

  if ($("aAccuracy")) {
    $("aAccuracy").textContent = `${accuracy}%`;
  }

  if ($("aAssignments")) {
    $("aAssignments").textContent = state.completed.length;
  }

  if ($("performance")) {
    $("performance").innerHTML =
      currentSubjects().map(subject => {
        const record =
          state.progress[subjectKey(subject)] ||
          { attempted: 0, correct: 0 };

        const percentage = record.attempted
          ? Math.round(
              record.correct / record.attempted * 100
            )
          : 0;

        return `
          <div class="performance-row">

            <span>${escapeHTML(subject)}</span>

            <div class="bar">
              <span style="width:${percentage}%"></span>
            </div>

            <b>${percentage}%</b>

          </div>
        `;
      }).join("");
  }

  const mistakes = state.mistakes.filter(mistake =>
    currentSubjects().includes(mistake.subject)
  );

  if ($("mistakes")) {
    $("mistakes").innerHTML =
      mistakes.slice().reverse().slice(0, 20)
        .map(mistake => `
          <div class="mistake-row">
            <div>
              <b>${escapeHTML(mistake.question)}</b>

              <p class="muted">
                Your answer: ${escapeHTML(mistake.selected)}
              </p>

              <p class="muted">
                Correct answer: ${escapeHTML(mistake.correct)}
              </p>

              <p class="muted">
                ${escapeHTML(mistake.explanation)}
              </p>
            </div>
          </div>
        `).join("") ||
        '<div class="empty">No mistakes recorded yet.</div>';
  }
}

/* ================= INITIALISE WEBSITE ================= */

function initCognitiveForge() {
  if ($("subjectLevel")) {
    $("subjectLevel").value = state.level;
  }

  if ($("taskDate")) {
    $("taskDate").value =
      new Date().toISOString().slice(0, 10);
  }

  if ($("profileLevel")) {
    $("profileLevel").textContent = state.level;
  }

  if ($("currentLevel")) {
    $("currentLevel").textContent =
      `${state.level} selected`;
  }

  populateSubjectSelects();

  renderDashboard();
  renderSubjects();
  renderAssignments();
  renderTasks();
  renderNotes();
  renderAnalytics();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initCognitiveForge
  );
} else {
  initCognitiveForge();
}