(() => {
  "use strict";

  const CHAT_API = "/api/chat";
  const STORAGE_KEY = "cognitiveForgeChatHistory";

  let history = [];
  let isSending = false;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) history = saved.slice(-20);
  } catch {
    history = [];
  }

  const styles = `
    #forge-chat-launcher {
      position: fixed; right: 24px; bottom: 24px; z-index: 9998;
      width: 62px; height: 62px; border: 0; border-radius: 50%;
      background: linear-gradient(135deg,#527df5,#39c99a);
      color: white; font-size: 27px; cursor: pointer;
      box-shadow: 0 8px 28px #0006;
    }
    #forge-chat-panel {
      position: fixed; right: 24px; bottom: 98px; z-index: 9999;
      width: min(390px, calc(100vw - 28px)); height: min(590px, 75vh);
      min-height: 400px; display: none; flex-direction: column;
      background: #111a30; color: #f4f6ff;
      border: 1px solid #2b3959; border-radius: 18px;
      box-shadow: 0 18px 55px #0009; overflow: hidden;
      font-family: inherit;
    }
    #forge-chat-panel.forge-open { display: flex; }
    .forge-chat-header {
      padding: 16px; display: flex; align-items: center;
      justify-content: space-between; background: #192541;
      border-bottom: 1px solid #2b3959;
    }
    .forge-chat-brand { display:flex; gap:10px; align-items:center; }
    .forge-chat-avatar {
      width: 38px; height: 38px; display:grid; place-items:center;
      border-radius: 12px; background:#29436a; font-size:20px;
    }
    .forge-chat-title { font-weight:700; font-size:15px; }
    .forge-chat-status { color:#63dca8; font-size:11px; margin-top:3px; }
    .forge-chat-header button {
      border:0; background:transparent; color:#fff;
      font-size:23px; cursor:pointer;
    }
    #forge-chat-messages {
      flex:1; overflow-y:auto; padding:14px;
      display:flex; flex-direction:column; gap:12px;
    }
    .forge-message {
      max-width:88%; padding:11px 13px; border-radius:13px;
      font-size:13px; line-height:1.55; overflow-wrap:anywhere;
      white-space:pre-wrap;
    }
    .forge-message.bot {
      align-self:flex-start; background:#202e4b; color:#f1f4ff;
      border-bottom-left-radius:4px;
    }
    .forge-message.user {
      align-self:flex-end; background:#426fe1; color:white;
      border-bottom-right-radius:4px;
    }
    .forge-message.error { background:#512d3a; color:#ffdce3; }
    .forge-chat-quick {
      display:flex; gap:7px; overflow-x:auto; padding:0 12px 10px;
    }
    .forge-chat-quick button {
      white-space:nowrap; border:1px solid #344362; color:#dce5ff;
      background:#192541; border-radius:20px; padding:7px 10px;
      font-size:11px; cursor:pointer;
    }
    .forge-chat-compose {
      display:flex; gap:8px; padding:12px;
      border-top:1px solid #2b3959; background:#151f36;
    }
    #forge-chat-input {
      flex:1; min-width:0; resize:none; max-height:90px;
      border:1px solid #354566; outline:none; border-radius:12px;
      padding:11px; background:#0e172b; color:white;
      font:inherit; font-size:13px;
    }
    #forge-chat-send {
      width:44px; border:0; border-radius:12px;
      background:#527df5; color:white; font-size:19px; cursor:pointer;
    }
    #forge-chat-send:disabled { opacity:.5; cursor:not-allowed; }
    .forge-chat-hint {
      padding:0 12px 9px; background:#151f36;
      color:#8190ad; font-size:10px;
    }
    @media(max-width:520px) {
      #forge-chat-launcher { right:16px; bottom:16px; }
      #forge-chat-panel {
        right:10px; bottom:88px; width:calc(100vw - 20px);
        height:min(72vh,590px);
      }
    }
  `;

  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);

  const launcher = document.createElement("button");
  launcher.id = "forge-chat-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Open Forge AI Tutor");
  launcher.title = "Ask Forge AI";
  launcher.textContent = "✦";

  const panel = document.createElement("section");
  panel.id = "forge-chat-panel";
  panel.setAttribute("aria-label", "Forge AI Tutor chat");

  panel.innerHTML = `
    <div class="forge-chat-header">
      <div class="forge-chat-brand">
        <div class="forge-chat-avatar">✦</div>
        <div>
          <div class="forge-chat-title">Forge AI Tutor</div>
          <div class="forge-chat-status">● Your learning assistant</div>
        </div>
      </div>
      <button type="button" id="forge-chat-clear" title="Clear chat"
        aria-label="Clear chat">↻</button>
      <button type="button" id="forge-chat-close" title="Close chat"
        aria-label="Close chat">×</button>
    </div>
    <div id="forge-chat-messages" aria-live="polite"></div>
    <div class="forge-chat-quick">
      <button type="button" data-prompt="Explain this concept simply.">
        Explain simply
      </button>
      <button type="button" data-prompt="Give me an example.">
        Give an example
      </button>
      <button type="button" data-prompt="Ask me a practice question on this topic.">
        Practice question
      </button>
    </div>
    <form class="forge-chat-compose" id="forge-chat-form">
      <textarea id="forge-chat-input" rows="1"
        placeholder="Ask in English, Hindi, Hinglish, Telugu..."
        aria-label="Type your doubt"></textarea>
      <button id="forge-chat-send" type="submit" aria-label="Send message">
        ➤
      </button>
    </form>
    <div class="forge-chat-hint">
      Forge AI can make mistakes. Verify important answers with your study material.
    </div>
  `;

  document.body.append(launcher, panel);

  const messagesBox = panel.querySelector("#forge-chat-messages");
  const input = panel.querySelector("#forge-chat-input");
  const sendButton = panel.querySelector("#forge-chat-send");

  function getLearningContext() {
    const findValue = selectors => {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.value) return element.value;
      }
      return "";
    };

    const level =
      findValue([
        "#levelSelect", "#studentLevel", "#subjectLevel",
        '[name="level"]'
      ]) ||
      document.querySelector(".workspace-card")?.innerText ||
      "Not specified";

    const subject =
      findValue([
        "#subjectSelect", "#subject", "#practiceSubject",
        '[name="subject"]'
      ]) || "General";

    return {
      level: String(level).trim().slice(0, 100),
      subject: String(subject).trim().slice(0, 100)
    };
  }

  function saveHistory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-20)));
    } catch (error) {
      console.warn("Could not save chat history:", error);
    }
  }

  function addMessage(text, role, extraClass = "") {
    const bubble = document.createElement("div");
    bubble.className = `forge-message ${role} ${extraClass}`.trim();
    bubble.textContent = text;
    messagesBox.appendChild(bubble);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    return bubble;
  }

  function renderWelcome() {
    messagesBox.innerHTML = "";
    addMessage(
      "Namaste! 👋 I'm Forge AI Tutor.\n\nAsk your doubts in English, Hindi, Hinglish, Telugu, Tenglish, Tamil or another Indian language. I'll explain step by step!",
      "bot"
    );
  }

  function renderSavedHistory() {
    messagesBox.innerHTML = "";
    if (!history.length) {
      renderWelcome();
      return;
    }

    history.forEach(item => {
      addMessage(item.text, item.role === "user" ? "user" : "bot");
    });
  }

  async function sendMessage(text) {
    const message = String(text || "").trim();
    if (!message || isSending) return;

    isSending = true;
    input.value = "";
    sendButton.disabled = true;

    addMessage(message, "user");
    const pending = addMessage("Thinking... ✨", "bot");

    try {
      const context = getLearningContext();

      const response = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: history.slice(-10),
          level: context.level,
          subject: context.subject
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      if (!data.answer || typeof data.answer !== "string") {
        throw new Error("The AI returned an invalid response.");
      }

      pending.remove();
      addMessage(data.answer, "bot");

      history.push(
        { role: "user", text: message },
        { role: "model", text: data.answer }
      );

      history = history.slice(-20);
      saveHistory();

    } catch (error) {
      pending.remove();
      addMessage(
        error.message || "Something went wrong. Please try again.",
        "bot",
        "error"
      );
      console.error("Forge AI:", error);
    } finally {
      isSending = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  launcher.addEventListener("click", () => {
    panel.classList.toggle("forge-open");
    if (panel.classList.contains("forge-open")) {
      renderSavedHistory();
      input.focus();
    }
  });

  panel.querySelector("#forge-chat-close").addEventListener("click", () => {
    panel.classList.remove("forge-open");
  });

  panel.querySelector("#forge-chat-clear").addEventListener("click", () => {
    history = [];
    saveHistory();
    renderWelcome();
  });

  panel.querySelector("#forge-chat-form").addEventListener("submit", event => {
    event.preventDefault();
    sendMessage(input.value);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input.value);
    }
  });

  panel.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.prompt);
    });
  });

  renderWelcome();
})();
