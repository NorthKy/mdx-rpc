
(function () {
  let lastReportedUrl = null;
  let reportTimer = null;

  function extractInfo(url) {
    const chapterMatch = url.match(/mangadex\.org\/chapter\/([a-f0-9-]{36})/);
    if (chapterMatch) {
      return { type: "chapter", chapterId: chapterMatch[1] };
    }
    const titleMatch = url.match(/mangadex\.org\/title\/([a-f0-9-]{36})/);
    if (titleMatch) {
      return { type: "title", mangaId: titleMatch[1] };
    }
    return { type: "other" };
  }

  function reportPage() {
    const url = window.location.href;
    if (url === lastReportedUrl) return;
    lastReportedUrl = url;

    const info = extractInfo(url);

    try {
      chrome.runtime.sendMessage({ action: "PAGE_CHANGED", url, info }, () => {
        if (chrome.runtime.lastError) {

        }
      });
    } catch (e) {

    }
  }


  reportPage();


  const observer = new MutationObserver(() => {
    clearTimeout(reportTimer);
    reportTimer = setTimeout(reportPage, 800);
  });

  observer.observe(document.body, { childList: true, subtree: true });


  window.addEventListener("popstate", () => setTimeout(reportPage, 400));
  const origPush = history.pushState;
  history.pushState = function (...args) {
    origPush.apply(this, args);
    setTimeout(reportPage, 400);
  };
})();
