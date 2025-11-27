// popup/popup.js

const statusEl = document.getElementById("status");
const outputEl = document.getElementById("output");
const extractBtn = document.getElementById("extractBtn");

function setStatus(msg) {
  statusEl.textContent = msg;
}

extractBtn.addEventListener("click", async () => {
  setStatus("Extracting...");

  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true
  });

  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        if (window.__SNU_TIMESYNC && typeof window.__SNU_TIMESYNC.extract === "function") {
          return window.__SNU_TIMESYNC.extract();
        }
        return { error: "Extractor not loaded." };
      }
    });

    const extracted = result[0].result;

    if (!extracted || extracted.error) {
      setStatus("No timetable found");
      outputEl.textContent = JSON.stringify(extracted, null, 2);
      return;
    }

    const parsed = Parser.parseRowArray(extracted.header, extracted.rows);

    outputEl.textContent = JSON.stringify(parsed, null, 2);
    setStatus(`Found ${parsed.length} entries`);

  } catch (err) {
    setStatus("Error: " + err.message);
  }
});
