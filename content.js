// Function to replace selected text and copy to clipboard
function replaceAndCopyText(newText) {
  try {
    // Replace selection
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(newText));
    }

    // Copy to clipboard
    navigator.clipboard.writeText(newText).catch((err) => {
      console.error("Copy failed:", err);
    });
  } catch (error) {
    console.error("Text replacement failed:", error);
  }
}

// Handle messages from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "enhanceSelection") {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      chrome.runtime.sendMessage(
        {
          action: "processSelection",
          text: selection,
        },
        (response) => {
          if (response?.enhancedText) {
            replaceAndCopyText(response.enhancedText);
          }
        }
      );
    }
  }
  return true;
});
