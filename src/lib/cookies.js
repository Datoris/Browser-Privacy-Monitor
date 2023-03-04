import sortBy from "lodash.sortby";

async function getCookiesSubprocedure(urls, domain) {
  const result = await Promise.all(urls.map(url =>
    new Promise(resolve => chrome.cookies.getAll({ url, domain }, resolve))
  ));
  return sortBy([...new Map([].concat(...result).map(c => [JSON.stringify(c), c])).values()], "domain");
}

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
    const cookies = await getCookiesSubprocedure(uniqueUrls);
    const firstPartyCookies = await getCookiesSubprocedure(uniqueUrls, domain);
    chrome.action.setBadgeText({ text: `${cookies.length}` });
    return cookies.map(cookie => Object.assign(cookie, {
      domainType: !firstPartyCookies.map(({ domain }) => domain).includes(cookie.domain) ? "Third-party" : "First-party"
    }));
  } else {
    chrome.action.setBadgeText({ text: "" });
    return [];
  }
}

export {
  getCookies,
}