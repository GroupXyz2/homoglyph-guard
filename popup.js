document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggle');
  const charCountEl = document.getElementById('charCount');
  const linkCountEl = document.getElementById('linkCount');

  chrome.storage.sync.get({ hgEnabled: true }, (data) => {
    toggle.checked = data.hgEnabled !== false;
  });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;
    chrome.runtime.sendMessage({ type: 'HG_GET_STATE', tabId: tab.id }, (state) => {
      if (!state) return;
      charCountEl.textContent = state.charCount || 0;
      linkCountEl.textContent = state.linkCount || 0;
    });
  });

  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ hgEnabled: enabled });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) return;
      chrome.tabs.sendMessage(tab.id, { type: 'HG_SET_ENABLED', enabled }).catch(() => {});
    });
  });
});
