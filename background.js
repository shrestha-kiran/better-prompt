// Configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-3-sonnet";

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "enhance-prompt",
    title: "Create Better Prompt with AI",
    contexts: ["selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "enhance-prompt" && info.selectionText) {
    handlePromptEnhancement(info.selectionText, tab.id);
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "enhance-query") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    try {
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: getSelectedText,
      });

      if (injectionResults[0]?.result) {
        handlePromptEnhancement(injectionResults[0].result, tab.id);
      }
    } catch (error) {
      console.error("Error getting selection:", error);
      showNotification("Error", "Failed to get selected text");
    }
  }
});

// Function to get selected text from content script
function getSelectedText() {
  return window.getSelection().toString().trim();
}

// Main enhancement handler
async function handlePromptEnhancement(text, tabId) {
  if (!text) {
    showNotification("Error", "No text selected");
    return;
  }

  try {
    // Show working notification
    showNotification("Working", "Enhancing your prompt...");

    // Get API key from storage
    const { apiKey } = await chrome.storage.local.get(["apiKey"]);
    if (!apiKey) {
      showNotification("Error", "OpenRouter API key not set");
      chrome.runtime.openOptionsPage();
      return;
    }

    // Generate enhanced prompt using OpenRouter API
    const enhancedPrompt = await generateEnhancedPrompt(text, apiKey);

    // Copy to clipboard by injecting content script
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: copyToClipboard,
      args: [enhancedPrompt],
    });

    showNotification("Success", "Enhanced prompt copied to clipboard!");
  } catch (error) {
    console.error("Prompt enhancement failed:", error);
    showNotification("Error", "Failed to enhance prompt");
  }
}

// Function to copy text to clipboard (will be injected into page)
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      console.log("Copied to clipboard:", text);
    })
    .catch((err) => {
      console.error("Failed to copy:", err);
    });
}

// Generate enhanced prompt using OpenRouter API
async function generateEnhancedPrompt(query, apiKey) {
  const prompt = `You are a prompt enhancement expert. Improve this LLM query:
  
Original Query: """${query}"""

Return an enhanced version that:
1. Is clear and specific
2. Provides necessary context
3. Specifies desired output format
4. Includes examples if helpful
5. Guides the AI toward better responses

Enhanced Query:`;

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://yourdomain.com",
      "X-Title": "LLM Query Enhancer",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You help users create better LLM prompts.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || query;
}

// Helper function to show notifications
function showNotification(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon-48.png",
    title: title,
    message: message,
  });
}
