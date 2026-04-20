
const LOCAL_SERVER = "http://localhost:43215";
const MDEX_API = "https://api.mangadex.org";

let currentState = null;
let startTimestamp = null;

function resolveTitle(titleObj, altTitlesArr) {
  const t = titleObj ?? {};
  const altTitles = altTitlesArr ?? [];

  const firstAltEn = altTitles.find((a) => a.en != null)?.en ?? null;

  const altMap = {};
  for (const alt of altTitles) {
    for (const [lang, val] of Object.entries(alt)) {
      if (lang !== "en" && !altMap[lang]) altMap[lang] = val;
    }
  }

  return (
    t.en ||
    firstAltEn ||
    t["ja-ro"] || altMap["ja-ro"] ||
    t["ko-ro"] || altMap["ko-ro"] ||
    t["zh-ro"] || altMap["zh-ro"] ||
    t.ja || altMap.ja ||
    t.ko || altMap.ko ||
    t.zh || altMap.zh ||
    Object.values(t)[0] ||
    "Unknown Manga"
  );
}

async function fetchChapterInfo(chapterId) {
  const res = await fetch(
    `${MDEX_API}/chapter/${chapterId}?includes[]=manga&includes[]=scanlation_group`
  );
  const json = await res.json();
  if (json.result !== "ok") throw new Error("Chapter not found");

  const ch = json.data;
  const attrs = ch.attributes;

  const mangaRel = ch.relationships.find((r) => r.type === "manga");
  const mangaId = mangaRel?.id ?? null;
  const mangaAttrs = mangaRel?.attributes ?? {};

  const title = resolveTitle(mangaAttrs.title, mangaAttrs.altTitles);
  const chapterNum = attrs.chapter ? `Chapter ${attrs.chapter}` : "Oneshot";
  const chapterTitle = attrs.title || null;

  return { mangaId, title, chapterNum, chapterTitle };
}

async function fetchMangaCover(mangaId) {
  try {
    const res = await fetch(
      `${MDEX_API}/cover?manga[]=${mangaId}&limit=1&order[volume]=desc`
    );
    const json = await res.json();
    if (json.result !== "ok" || json.data.length === 0) return null;

    const cover = json.data[0];
    const filename = cover.attributes.fileName;
    return `https://uploads.mangadex.org/covers/${mangaId}/${filename}.256.jpg`;
  } catch {
    return null;
  }
}

async function fetchMangaInfo(mangaId) {
  const res = await fetch(
    `${MDEX_API}/manga/${mangaId}?includes[]=cover_art`
  );
  const json = await res.json();
  if (json.result !== "ok") throw new Error("Manga not found");

  const attrs = json.data.attributes;
  const title = resolveTitle(attrs.title, attrs.altTitles);

  const coverRel = json.data.relationships.find((r) => r.type === "cover_art");
  let coverUrl = null;
  if (coverRel?.attributes?.fileName) {
    coverUrl = `https://uploads.mangadex.org/covers/${mangaId}/${coverRel.attributes.fileName}.256.jpg`;
  }

  return { mangaId, title, coverUrl, chapterNum: null, chapterTitle: null };
}

async function sendToDesktopApp(payload) {
  try {
    await fetch(`${LOCAL_SERVER}/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("[MangaDex Presence] Desktop app not reachable:", e.message);
  }
}

async function clearDesktopApp() {
  try {
    await fetch(`${LOCAL_SERVER}/clear`, { method: "POST" });
  } catch {}
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action !== "PAGE_CHANGED") return;

  const { info } = msg;

  if (info.type === "chapter") {
    handleChapterPage(info.chapterId);
  } else if (info.type === "title") {
    handleTitlePage(info.mangaId);
  } else {
    currentState = null;
    startTimestamp = null;
    clearDesktopApp();
  }
});

async function handleChapterPage(chapterId) {
  if (currentState?.chapterId !== chapterId) {
    startTimestamp = Date.now();
  }

  try {
    const { mangaId, title, chapterNum, chapterTitle } =
      await fetchChapterInfo(chapterId);

    let coverUrl = null;
    if (mangaId) coverUrl = await fetchMangaCover(mangaId);

    currentState = { chapterId, mangaId, title, chapterNum };

    const payload = {
      type: "reading",
      title,
      chapterNum,
      chapterTitle,
      coverUrl,
      mangaId,
      startTimestamp,
    };

    await sendToDesktopApp(payload);
    chrome.storage.local.set({ lastPresence: payload, connected: true });
  } catch (e) {
    console.error("[MangaDex Presence] Error fetching chapter:", e);
  }
}

async function handleTitlePage(mangaId) {
  if (currentState?.mangaId !== mangaId || currentState?.type !== "browsing") {
    startTimestamp = Date.now();
  }

  try {
    const { title, coverUrl } = await fetchMangaInfo(mangaId);
    currentState = { type: "browsing", mangaId };

    const payload = {
      type: "browsing",
      title,
      coverUrl,
      mangaId,
      startTimestamp,
    };

    await sendToDesktopApp(payload);
    chrome.storage.local.set({ lastPresence: payload, connected: true });
  } catch (e) {
    console.error("[MangaDex Presence] Error fetching manga:", e);
  }
}
