# Homoglyph Guard

A browser extension that highlights lookalike Unicode characters (e.g. Cyrillic
`а` U+0430 vs Latin `a` U+0061) in page text, and flags links whose domain
mixes scripts or uses punycode — the classic "homograph attack" used in
phishing scams.

## What it does

- Scans visible page text. If a word mixes ordinary Latin letters with a
  lookalike character from another script (Cyrillic, Greek, Armenian, etc.),
  it highlights just that character with a red underline/background.
  Hovering shows the real script, character, and Unicode code point.
- Scans every link on the page. If a link's hostname mixes scripts, or uses
  punycode (`xn--...`, how browsers encode non-ASCII domains), it outlines
  the link and adds a ⚠ marker with details on hover.
- Shows a badge count of flagged items in the toolbar icon, and a summary in
  the popup. You can turn it off from the popup at any time.
- Re-scans automatically as pages update (e.g. infinite-scroll feeds, SPAs).

## Install (Chrome / Edge / Brave — "unpacked" / developer mode)

1. Unzip this folder somewhere permanent (don't delete it after installing —
   the browser loads the extension directly from these files).
2. Go to `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped `homoglyph-guard` folder.
5. Pin the extension from the puzzle-piece menu if you want quick access to
   the popup.

## Install (Firefox — temporary, for testing)

1. Unzip this folder.
2. Go to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...** and select the `manifest.json` file
   inside the unzipped folder.
4. Note: Firefox removes temporary add-ons when you close the browser. For a
   permanent install you'd need to package and sign it via
   [addons.mozilla.org](https://addons.mozilla.org).

## Notes / limitations

- The confusable-character list in `confusables.js` covers the most common
  lookalikes (Cyrillic, Greek, a few Armenian) — it isn't exhaustive of every
  Unicode confusable in existence, but it covers the characters actually seen
  in real-world scam/phishing domains and text.
- Only *mixed-script* words are flagged in body text (e.g. a Cyrillic `а`
  inside an otherwise-Latin word). Pages that are legitimately written
  entirely in Russian, Greek, etc. won't be falsely flagged, since nothing is
  "mixed" there.
- This is a visual aid, not a guarantee — always independently verify a
  domain before entering passwords or payment details, e.g. by typing it
  manually or using a bookmark.
