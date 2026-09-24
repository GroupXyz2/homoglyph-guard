// content.js
(function () {
  'use strict';

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'IFRAME', 'CODE', 'PRE',
  ]);

  const TOKEN_RE = /[\p{L}\p{N}]+/gu;

  let enabled = true;
  let charFlagCount = 0;
  let linkFlagCount = 0;
  let scanScheduled = false;

  function reportState() {
    try {
      chrome.runtime.sendMessage({
        type: 'HG_UPDATE',
        charCount: charFlagCount,
        linkCount: linkFlagCount,
        url: location.href,
      });
    } catch (e) {
      // background may not be ready; ignore
    }
  }

  function buildTitle(ch, info) {
    const cp = ch.codePointAt(0);
    const hex = 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
    return `\u26A0 ${info.script} character "${ch}" (${hex}) looks like Latin "${info.latin}"`;
  }

  // Walk a token's characters; return true if the token mixes Latin letters
  // with at least one confusable non-Latin lookalike (the classic spoof pattern).
  function tokenIsMixedSuspicious(token) {
    let hasLatin = false;
    let hasConfusable = false;
    for (const ch of token) {
      const cp = ch.codePointAt(0);
      const script = hgDetectScript(cp);
      if (script === 'Latin') hasLatin = true;
      if (CONFUSABLES[ch]) hasConfusable = true;
    }
    return hasLatin && hasConfusable;
  }

  function processTextNode(textNode) {
    const text = textNode.nodeValue;
    if (!text || text.length < 2) return;

    // Fast path: skip nodes with no confusable characters at all.
    let anyConfusable = false;
    for (const ch of text) {
      if (CONFUSABLES[ch]) { anyConfusable = true; break; }
    }
    if (!anyConfusable) return;

    const matches = [...text.matchAll(TOKEN_RE)];
    if (matches.length === 0) return;

    // Determine which character indices need flagging.
    const flagRanges = []; // {start, end, chars: Map<index,info>}
    for (const m of matches) {
      const token = m[0];
      if (!tokenIsMixedSuspicious(token)) continue;
      const start = m.index;
      for (let i = 0; i < token.length; i++) {
        const ch = token[i];
        if (CONFUSABLES[ch]) {
          flagRanges.push({ index: start + i, ch, info: CONFUSABLES[ch] });
        }
      }
    }

    if (flagRanges.length === 0) return;

    // Build a replacement fragment, wrapping only the flagged characters.
    const frag = document.createDocumentFragment();
    let cursor = 0;
    for (const f of flagRanges) {
      if (f.index > cursor) {
        frag.appendChild(document.createTextNode(text.slice(cursor, f.index)));
      }
      const span = document.createElement('span');
      span.className = 'hg-char';
      span.textContent = f.ch;
      span.title = buildTitle(f.ch, f.info);
      frag.appendChild(span);
      cursor = f.index + f.ch.length;
      charFlagCount++;
    }
    if (cursor < text.length) {
      frag.appendChild(document.createTextNode(text.slice(cursor)));
    }

    textNode.parentNode.replaceChild(frag, textNode);
  }

  function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.hg-char')) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  function hostnameScriptIssue(hostname) {
    // Flag hostnames that mix Latin ASCII letters with confusable lookalikes
    // from another script (raw, non-punycode homograph domains).
    let hasAsciiLatin = false;
    let hasConfusable = false;
    for (const ch of hostname) {
      const cp = ch.codePointAt(0);
      if (cp < 128 && ((cp >= 65 && cp <= 90) || (cp >= 97 && cp <= 122))) hasAsciiLatin = true;
      if (CONFUSABLES[ch]) hasConfusable = true;
    }
    return hasAsciiLatin && hasConfusable;
  }

  function processLinks(root) {
    const anchors = root.querySelectorAll ? root.querySelectorAll('a[href]') : [];
    anchors.forEach((a) => {
      if (a.dataset.hgChecked) return;
      a.dataset.hgChecked = '1';
      let url;
      try {
        url = new URL(a.href, location.href);
      } catch (e) {
        return;
      }
      const host = url.hostname;
      if (!host) return;

      const suspicious = hostnameScriptIssue(host) || host.includes('xn--');
      if (suspicious) {
        a.classList.add('hg-suspicious-link');
        const reason = host.includes('xn--')
          ? `\u26A0 This link's domain uses internationalized (punycode) characters: ${host}. Verify it's the site you expect.`
          : `\u26A0 This link's domain mixes scripts (e.g. Latin + Cyrillic/Greek lookalikes): ${host}`;
        a.title = a.title ? `${a.title}\n${reason}` : reason;
        linkFlagCount++;
      }
    });
  }

  function scan(root) {
    if (!enabled) return;
    const nodes = collectTextNodes(root);
    nodes.forEach(processTextNode);
    processLinks(root);
    reportState();
  }

  function fullScan() {
    charFlagCount = 0;
    linkFlagCount = 0;
    // Reset link-checked markers so a full rescan re-evaluates everything.
    document.querySelectorAll('a[data-hg-checked]').forEach((a) => delete a.dataset.hgChecked);
    document.querySelectorAll('.hg-suspicious-link').forEach((a) => a.classList.remove('hg-suspicious-link'));
    scan(document.body);
  }

  function scheduleScan(root) {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(() => {
      scanScheduled = false;
      scan(root || document.body);
    }, 250);
  }

  function clearHighlights() {
    document.querySelectorAll('.hg-char').forEach((span) => {
      const text = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(text, span);
    });
    document.querySelectorAll('.hg-suspicious-link').forEach((a) => {
      a.classList.remove('hg-suspicious-link');
      delete a.dataset.hgChecked;
    });
    charFlagCount = 0;
    linkFlagCount = 0;
    reportState();
  }

  const observer = new MutationObserver((mutations) => {
    if (!enabled) return;
    for (const m of mutations) {
      if (m.addedNodes && m.addedNodes.length) {
        m.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
            scheduleScan(node.parentNode || document.body);
          }
        });
      }
    }
  });

  function start() {
    observer.observe(document.documentElement, { childList: true, subtree: true });
    if (document.body) fullScan();
    else document.addEventListener('DOMContentLoaded', fullScan);
  }

  // React to popup toggling the extension on/off for this tab's session.
  try {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'HG_SET_ENABLED') {
        enabled = !!msg.enabled;
        if (enabled) {
          fullScan();
        } else {
          clearHighlights();
        }
      } else if (msg.type === 'HG_GET_STATE_FROM_PAGE') {
        sendResponse({ charCount: charFlagCount, linkCount: linkFlagCount, enabled });
      }
    });
  } catch (e) {
    // extension context may be invalidated on page unload; ignore
  }

  try {
    chrome.storage.sync.get({ hgEnabled: true }, (data) => {
      enabled = data.hgEnabled !== false;
      start();
    });
  } catch (e) {
    start();
  }
})();
