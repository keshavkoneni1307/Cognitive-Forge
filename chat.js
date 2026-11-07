(() => {
  "use strict";

  // Avoid creating the chatbot twice.
  if (document.getElementById("forge-chat-launcher")) return;

  const API_URL = "/api/chat";

  let history = [];
  let isLoading = false;

  const styles = `
    #forge-chat-launcher {
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 99998;
      width: 62px;
      height: 62px;
      border: 0;
      border-radius: 50%;
      background: linear-gradient(135deg,#5578ff,#35cfa3);
      color: white;
      font-size: 27px;
      cursor: pointer;
      box-shadow: 0 8px 28px #0005;
    }

    #forge-chat-window {
      position: fixed;
      right: 24px;
      bottom: 100px;
      z-index: 99999;
      width: 390px;
      max-width: calc(100vw - 28px);
      height: min(620px, calc(100vh - 125px));
      background: #141c35;
      color: #eef2ff;
      border: 1px solid #34405f;
      border-radius: 22px;
      display: none;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 18px 60px #0008;
      font-family: Arial, sans-serif;
    }

    #forge-chat-window.forge-open {
      display: flex;
    }

    .forge-header {
      padding: 17px;
      background: #1c2745;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #34405f;
    }

    .forge-avatar {
      width: 48px;
      height: 48px;
      border-radius: 15px;
      display: grid;
      place-items: center;
      background: #30446c;
      font-size: 25px;
    }

    .forge-heading {
      flex: 1;
    }

    .forge-heading strong {
      display: block;
      font-size: 19px;
    }

    .forge-heading small {
      color: #68dcae;
      display: block;
      margin-top: 5px;
    }

    .forge-header button {
      border: 0;
      background: transparent;
      color: white;
      font-size: 25px;
      cursor: pointer;
      padding: 5px;
    }

    #forge-chat-messages {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 17px;
      display: flex;
      flex-direction: column;
      gap: 13px;
      scroll-behavior: smooth;
    }

    .forge-message {
      max-width: 88%;
      padding: 13px 15px;
      border-radius: 15px;
      line-height: 1.55;
      font-size: 15px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .forge-bot {
      align-self: flex-start;
      background: #25314f;
      border-bottom-left-radius: 5px;
    }

    .forge-user {
      align-self: flex-end;
      background: #5574ed;
      color: white;
      border-bottom-right-radius: 5px;
    }

    .forge-error {
      background: #512e3b;
      color: #ffe1e7;
    }

    .forge-suggestions {
      padding: 8px 15px;
      display: flex;
      gap: 8px;
      overflow-x: auto;
    }

    .forge-suggestions button {
      white-space: nowrap;
      border: 1px solid #3b4969;
      border-radius: 30px;
      background: #202c49;
      color: #dce5ff;
      padding: 10px 13px;
      cursor: pointer;
    }

    .forge-input-area {
      padding: 13px;
      border-top: 1px solid #34405f;
      display: flex;
      gap: 9px;
      background: #18223e;
    }

    #forge-chat-input {
      flex: 1;
      min-width: 0;
      resize: none;
      height: 48px;
      max-height: 110px;
      border-radius: 16px;
      border: 1px solid #3b4969;
      background: #111a30;
      color: white;
      padding: 13px;
      outline: none;
      font-size: 15px;
      font-family: inherit;
    }

    #forge-chat-send {
      width: 52px;
      height: 48px;
      border: 0;
      border-radius: 15px;
      background: #5b78f5;
      color: white;
      font-size: 23px;
      cursor: pointer;
    }

    #forge-chat-send:disabled {
      opacity: .5;
      cursor: not-allowed;
    }

    .forge-disclaimer {
      padding: 0 15px 12px;
      color: #92a1c2;
      font-size: 12px;
      background: #18223e;
      line-height: 1.5;
    }

    @media(max-width: 500px) {
      #forge-chat-launcher {
        right: 16px;
        bottom: 16px;
      }

      #forge-chat-window {
        right: 8px;
        bottom: 88px;
        width: calc(100vw - 16px);
        height: min(680px, calc(100vh - 105px));
      }
    }
  `;

  const style = document.createElement("style");
  style.textContent = styles;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "forge-chat-launcher";
  launcher.type = "button";
  launcher.textContent = "✦";
  launcher.setAttribute("aria-label", "Open Forge AI Tutor");

  const windowBox = document.createElement("section");
  windowBox.id = "forge-chat-window";
  windowBox.setAttribute("aria-label", "Forge AI Tutor chat");

  windowBox.innerHTML = `
    <div class="forge-header">
      <div class="forge-avatar">✦</div>
      <div class="forge-heading">
        <strong>Forge AI Tutor</strong>
        <small>● Your learning assistant</small>
      </div>
      <button type="button" id="forge-chat-reset" title="New chat">↻</button>
      <button type="button" id="forge-chat-close" title="Close">×</button>
    </div>

    <div id="forge-chat-messages" aria-live="polite"></div>

    <div class="forge-suggestions">
      <button type="button" data-prompt="Explain this concept simply.">Explain simply</button>
      <button type="button" data-prompt="Give me a simple real-life example.">Give an example</button>
      <button type="button" data-prompt="Ask me one practice question on this topic.">Practice question</button>
    </div>

    <form class="forge-input-area" id="forge-chat-form">
      <textarea
        id="forge-chat-input"
        placeholder="Ask in English, Hindi, Hinglish, Telugu..."
        aria-label="Ask your doubt"
        maxlength="5000"
        required
      ></textarea>
      <button id="forge-chat-send" type="submit" aria-label="Send">➤</button>
    </form>

    <div class="forge-disclaimer">
      Forge AI can make mistakes. Verify important answers with your study material.
    </div>
  `;

  document.body.appendChild(launcher);
  document.body.appendChild(windowBox);

  const messagesBox = windowBox.querySelector("#forge-chat-messages");
  const input = windowBox.querySelector("#forge-chat-input");
  const sendButton = windowBox.querySelector("#forge-chat-send");
  const form = windowBox.querySelector("#forge-chat-form");

  function addMessage(text, type = "bot") {
    const message = document.createElement("div");
    message.className = `forge-message forge-${type}`;
    message.textContent = text;

    messagesBox.appendChild(message);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    return message;
  }

  function showWelcome() {
    addMessage(
      "Namaste! 👋 I'm Forge AI Tutor.\n\nAsk your doubts in English, Hindi, Hinglish, Telugu, Tenglish, Tamil or another Indian language. I'll explain step by step!",
      "bot"
    );
  }

  function openChat() {
    windowBox.classList.add("forge-open");
    launcher.style.display = "none";
    input.focus();
  }

  function closeChat() {
    windowBox.classList.remove("forge-open");
    launcher.style.display = "block";
  }

  launcher.addEventListener("click", openChat);

  windowBox.querySelector("#forge-chat-close")
    .addEventListener("click", closeChat);

  windowBox.querySelector("#forge-chat-reset")
    .addEventListener("click", () => {
      history = [];
      messagesBox.innerHTML = "";
      showWelcome();
    });

  async function sendMessage(text) {
    text = String(text || "").trim();

    if (!text || isLoading) return;

    isLoading = true;
    sendButton.disabled = true;

    addMessage(text, "user");

    const loadingMessage = addMessage("Forge AI is thinking...", "bot");

    const previousHistory = history.slice(-10);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          history: previousHistory,
          level: localStorage.getItem("forgeLevel") || "Student",
          subject: localStorage.getItem("forgeSubject") || "General"
        })
      });

      const rawText = await response.text();

      let data;

      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(
          response.status === 404
            ? "Chat API not found. Please check that api/chat.js is deployed."
            : `Server returned an invalid response (HTTP ${response.status}).`
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || `Request failed (HTTP ${response.status}).`
        );
      }

      if (!data.reply || typeof data.reply !== "string") {
        throw new Error("The AI returned an empty answer. Please try again.");
      }

      loadingMessage.remove();

      addMessage(data.reply, "bot");

      history.push(
        { role: "user", text },
        { role: "assistant", text: data.reply }
      );

      history = history.slice(-10);

    } catch (error) {
      loadingMessage.remove();

      addMessage(
        error.message || "Unable to connect. Please try again.",
        "error"
      );

      console.error("Forge AI Tutor:", error);

    } finally {
      isLoading = false;
      sendButton.disabled = false;
      input.focus();
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    const text = input.value.trim();

    if (!text) return;

    input.value = "";
    sendMessage(text);
  });

  input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  windowBox.querySelectorAll("[data-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.prompt);
    });
  });

  showWelcome();

})();
