// chrome.action.onClicked.addListener(async () => {
//   const [indexTab] = await chrome.tabs.query({ url: `chrome-extension://${chrome.runtime.id}/index.html` });
//   if (indexTab) {
//     chrome.windows.update(indexTab.windowId, { focused: true });
//     chrome.tabs.update(indexTab.id, { active: true });
//   } else {
//     chrome.tabs.create({ url: "index.html" });
//   }
// });

async function getDomain(hostname, tabId) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: (hostname) => {
      let domain = hostname;
      const p = hostname.split(".");
      const s = "_gd" + (new Date()).getTime();
      let i = 0;
      while (i < (p.length - 1) && document.cookie.indexOf(`${s}=${s}`) === -1) {
        domain = p.slice(-1 - ++i).join(".");
        document.cookie = `${s}=${s};domain=${domain};`;
      }
      document.cookie = `${s}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain=${domain};`;
      return domain;
    },
    args: [hostname]
  });
}

async function getCurrentTab() {
  const [currentTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const domain = currentTab?.url && (await getDomain(new URL(currentTab.url).hostname, currentTab.id))[0].result;
  return [currentTab?.id, domain];
}

async function getCookiesSubprocedure(urls, domain) {
  const result = await Promise.all(urls.map(url =>
    new Promise(resolve => chrome.cookies.getAll({ url, domain }, resolve))
  ));
  return [...new Map([].concat(...result).map(c => [JSON.stringify(c), c])).values()];
}

let allCookies, firstPartyCookies, thirdPartyCookies;
async function getCookies(tabId, domain) {
  if (domain) {
    const { result } = (await chrome.scripting.executeScript({
      target: { tabId },
      func: () => [
        ...performance.getEntriesByType("resource").map(e => e.name),
        ...performance.getEntriesByType("navigation").map(e => e.name)
      ]
    }))[0];
    const urls = result.map(url => url.split(/[#?]/)[0]);
    const uniqueUrls = [...new Set(urls).values()].filter(Boolean);
    allCookies = await getCookiesSubprocedure(uniqueUrls);
    firstPartyCookies = await getCookiesSubprocedure(uniqueUrls, domain);
    thirdPartyCookies = allCookies.filter(({ domain }) => !firstPartyCookies.map(({ domain }) => domain).includes(domain));
    chrome.action.setBadgeText({ text: `${allCookies.length}` });
  } else chrome.action.setBadgeText({ text: "" });
}

chrome.windows.onFocusChanged.addListener(async () => {
  const [id, domain] = await getCurrentTab();
  getCookies(id, domain);
});
chrome.tabs.onActivated.addListener(async () => {
  const [id, domain] = await getCurrentTab();
  getCookies(id, domain);
});
chrome.tabs.onUpdated.addListener(async (tabId) => {
  const [id, domain] = await getCurrentTab();
  if (id === tabId) getCookies(id, domain);
});


chrome.runtime.onMessage.addListener(({ message, payload }, sender, sendResponse) => {
  if (message === "popup init") {
    sendResponse(thirdPartyCookies);
  }
});