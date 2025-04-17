// // Listen for messages from background script (kept for potential future use)
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === "enhanceQuery") {
//     const selectedText = window.getSelection().toString().trim();
//     if (selectedText) {
//       sendResponse({ enhancedQuery: selectedText });
//     }
//   }
//   return true;
// });
