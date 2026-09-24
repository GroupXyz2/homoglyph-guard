// background.js
const tabState = new Map(); // tabId -> {charCount, linkCount, url}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'HG_UPDATE' && sender.tab) {
    const tabId = sender.tab.id;
    tabState.set(tabId, {
      charCount: msg.charCount || 0,
      linkCount: msg.linkCount || 0,
      url: msg.url || '',
    });
    const total = (msg.charCount || 0) + (msg.linkCount || 0);
    chrome.action.setBadgeText({ tabId, text: total > 0 ? String(Math.min(total, 99)) : '' });
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#c81414' });
  }

  if (msg.type === 'HG_GET_STATE') {
    const tabId = msg.tabId;
    const state = tabState.get(tabId) || { charCount: 0, linkCount: 0, url: '' };
    sendResponse(state);
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => tabState.delete(tabId));
