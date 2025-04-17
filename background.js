// Configuration
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "anthropic/claude-3-sonnet";

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "enhance-prompt",
    title: "Create Better Prompt",
    contexts: ["selection"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "enhance-prompt" && info.selectionText) {
    try {
      // Set working icon
      await chrome.action.setIcon({ path: "icons/icon-working.png" });

      // Get API key
      const { apiKey } = await chrome.storage.local.get(["apiKey"]);
      if (!apiKey) {
        await chrome.action.setIcon({ path: "icons/icon-48.png" });
        chrome.runtime.openOptionsPage();
        return;
      }

      // Generate enhanced prompt
      const enhancedPrompt = await generateEnhancedPrompt(
        info.selectionText,
        apiKey
      );

      // Execute in content script
      // Function to replace selected text and copy to clipboard
      function replaceAndCopyText(enhancedPrompt) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(enhancedPrompt));

          // Copy to clipboard
          navigator.clipboard.writeText(enhancedPrompt).catch((err) => {
            console.error("Failed to copy text:", err);
          });
        }
      }
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: replaceAndCopyText,
        args: [enhancedPrompt],
      });

      // Restore icon
      await chrome.action.setIcon({ path: "icons/icon-48.png" });
    } catch (error) {
      console.error("Error:", error);
      await chrome.action.setIcon({ path: "icons/icon-error.png" });
      setTimeout(
        () => chrome.action.setIcon({ path: "icons/icon-48.png" }),
        2000
      );
    }
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "enhance-query") {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    chrome.tabs.sendMessage(tab.id, { action: "enhanceSelection" });
  }
});

// Generate enhanced prompt
async function generateEnhancedPrompt(query, apiKey) {
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
          content: `You are a prompt enhancement assistant. Transform the given input into a well-structured prompt with these sections:
          1. Introduction: Briefly explain the context
          2. Background: Provide relevant background information
          3. Requirements: Clearly state what is needed
          4. Expected Format: Specify how the response should be structured
          
          Return ONLY the enhanced prompt without any introductory phrases like "Here is the enhanced prompt:".
          The output should be ready to use as-is.`,
        },
        {
          role: "user",
          content: `Enhance this query: ${query}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  const data = await response.json(); // Add this line to define data
  const enhancedText = data.choices[0]?.message?.content.trim() || query;
  return enhancedText.replace(/^Here is (?:an? )?.*?:\s*/i, "");
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "processSelection") {
    generateEnhancedPrompt(request.text, request.apiKey)
      .then((enhancedText) => {
        sendResponse({
          action: "replaceSelection",
          enhancedText,
        });
      })
      .catch((error) => {
        console.error("Error enhancing prompt:", error);
        sendResponse({ error: "Failed to enhance prompt" });
      });
    return true; // Keep the message channel open for async response
  }
});
