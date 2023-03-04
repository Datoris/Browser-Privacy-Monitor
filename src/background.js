import { getCurrentTab } from "./lib/browser";
import { getCookies } from "./lib/cookies";

chrome.action.setBadgeBackgroundColor({ color: "#80cbc4" });

let cookies;

chrome.windows.onFocusChanged.addListener(async () => {
  const [id, domain] = await getCurrentTab();
  cookies = await getCookies(id, domain);
});
chrome.tabs.onActivated.addListener(async () => {
  const [id, domain] = await getCurrentTab();
  cookies = await getCookies(id, domain);
});
chrome.tabs.onUpdated.addListener(async (tabId) => {
  const [id, domain] = await getCurrentTab();
  if (id === tabId) cookies = await getCookies(id, domain);
});

chrome.runtime.onMessage.addListener(({ message, payload }) => {
  if (message === "popup init") {
    chrome.runtime.sendMessage({ message: "cookies", payload: cookies });
  }
});