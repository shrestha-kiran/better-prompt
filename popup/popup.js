document.getElementById("open-settings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// Add shortcut display based on platform
document.addEventListener("DOMContentLoaded", () => {
  const shortcutEl = document.querySelector("kbd");
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  shortcutEl.textContent = isMac ? "Cmd+Shift+E" : "Ctrl+Shift+E";
});
