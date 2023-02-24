import sortBy from "lodash.sortby";

chrome.action.setBadgeBackgroundColor({ color: "#80cbc4" });

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
  try {
    const [currentTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    const domain = currentTab?.url && (await getDomain(new URL(currentTab.url).hostname, currentTab.id))[0].result;
    return [currentTab?.id, domain];
  } catch {
    return new Promise((resolve) => setTimeout(() => resolve(getCurrentTab())));
  }
}

async function getCookiesSubprocedure(urls, domain) {
  const result = await Promise.all(urls.map(url =>
    new Promise(resolve => chrome.cookies.getAll({ url, domain }, resolve))
  ));
  return sortBy([...new Map([].concat(...result).map(c => [JSON.stringify(c), c])).values()], "domain");
}

let cookies;

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
    cookies = await getCookiesSubprocedure(uniqueUrls);
    const firstPartyCookies = await getCookiesSubprocedure(uniqueUrls, domain);
    cookies = cookies.map(cookie => Object.assign(cookie, {
      "id": `${cookie.domain}_${cookie.name}`,
      "Domain type": !firstPartyCookies.map(({ domain }) => domain).includes(cookie.domain) ? "Third-party" : "First-party"
    }));
    chrome.action.setBadgeText({ text: `${cookies.length}` });
  } else {
    chrome.action.setBadgeText({ text: "" });
    cookies = [];
  }
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


chrome.runtime.onMessage.addListener(({ message, payload }) => {
  if (message === "popup init") {
    chrome.runtime.sendMessage({ message: "cookies", payload: cookies });
  }
});