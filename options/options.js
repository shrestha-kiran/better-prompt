document.addEventListener("DOMContentLoaded", () => {
  // Load saved settings
  chrome.storage.local.get(["apiKey", "defaultModel"], (data) => {
    document.getElementById("api-key").value = data.apiKey || "";
    document.getElementById("default-model").value =
      data.defaultModel || "anthropic/claude-3-sonnet";
  });

  // Save settings
  document.getElementById("save-settings").addEventListener("click", () => {
    const apiKey = document.getElementById("api-key").value.trim();
    const defaultModel = document.getElementById("default-model").value.trim();

    chrome.storage.local.set({ apiKey, defaultModel }, () => {
      document.getElementById("status").textContent = "Settings saved!";
      setTimeout(() => {
        document.getElementById("status").textContent = "";
      }, 2000);
    });
  });
});
