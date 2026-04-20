// popup.js

const dot = document.getElementById("dot");
const statusText = document.getElementById("status-text");
const content = document.getElementById("content");

function formatElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m reading`;
  if (m > 0) return `${m}m ${s % 60}s reading`;
  return `${s}s reading`;
}

async function checkDesktopApp() {
  try {
    const res = await fetch("http://localhost:43215/status", { signal: AbortSignal.timeout(1500) });
    const data = await res.json();
    dot.className = "dot connected";
    statusText.textContent = "Connected to desktop app";
    return true;
  } catch {
    dot.className = "dot disconnected";
    statusText.textContent = "Desktop app not running";
    return false;
  }
}

async function render() {
  const connected = await checkDesktopApp();

  chrome.storage.local.get(["lastPresence"], ({ lastPresence }) => {
    if (!lastPresence) {
      content.innerHTML = `
        <div class="empty">
          <div class="icon">📖</div>
          <div>Open a manga or chapter<br>on MangaDex to begin</div>
        </div>`;
      return;
    }

    const p = lastPresence;
    const elapsed = p.startTimestamp ? Date.now() - p.startTimestamp : 0;
    const coverHtml = p.coverUrl
      ? `<img class="cover" src="${p.coverUrl}" alt="cover">`
      : `<div class="cover-placeholder">📚</div>`;

    const actionLabel = p.type === "reading" ? "📖 Reading" : "🔍 Browsing";
    const chapterHtml = p.chapterNum
      ? `<div class="chapter">${p.chapterNum}${p.chapterTitle ? ` — ${p.chapterTitle}` : ""}</div>`
      : "";

    content.innerHTML = `
      <div class="card">
        <div class="card-inner">
          ${coverHtml}
          <div class="info">
            <div class="manga-title" title="${p.title}">${p.title}</div>
            ${chapterHtml}
            <div class="action">${actionLabel}</div>
            <div class="elapsed">${formatElapsed(elapsed)}</div>
          </div>
        </div>
      </div>`;
  });
}

render();
