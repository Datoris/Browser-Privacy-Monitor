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

export {
  getCurrentTab,
}