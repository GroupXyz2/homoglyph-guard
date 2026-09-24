// confusables.js
// A (non-exhaustive) map of characters from other scripts that are visually
// near-identical to a Latin letter or digit, commonly abused in "homograph"
// phishing attacks (e.g. Cyrillic а U+0430 instead of Latin a U+0061).
// Maps: confusable character -> { latin: lookalike Latin char, script: name }

const CONFUSABLES = {
  // Cyrillic lowercase
  'а': { latin: 'a', script: 'Cyrillic' },
  'в': { latin: 'B', script: 'Cyrillic' },
  'е': { latin: 'e', script: 'Cyrillic' },
  'к': { latin: 'k', script: 'Cyrillic' },
  'м': { latin: 'M', script: 'Cyrillic' },
  'н': { latin: 'H', script: 'Cyrillic' },
  'о': { latin: 'o', script: 'Cyrillic' },
  'р': { latin: 'p', script: 'Cyrillic' },
  'с': { latin: 'c', script: 'Cyrillic' },
  'т': { latin: 'T', script: 'Cyrillic' },
  'у': { latin: 'y', script: 'Cyrillic' },
  'х': { latin: 'x', script: 'Cyrillic' },
  'і': { latin: 'i', script: 'Cyrillic' },
  'ј': { latin: 'j', script: 'Cyrillic' },
  'ѕ': { latin: 's', script: 'Cyrillic' },
  'ԁ': { latin: 'd', script: 'Cyrillic' },
  'ԛ': { latin: 'q', script: 'Cyrillic' },
  'ѡ': { latin: 'w', script: 'Cyrillic' },
  'ѵ': { latin: 'v', script: 'Cyrillic' },
  ' і': { latin: 'i', script: 'Cyrillic' },
  // Cyrillic uppercase
  'А': { latin: 'A', script: 'Cyrillic' },
  'В': { latin: 'B', script: 'Cyrillic' },
  'Е': { latin: 'E', script: 'Cyrillic' },
  'К': { latin: 'K', script: 'Cyrillic' },
  'М': { latin: 'M', script: 'Cyrillic' },
  'Н': { latin: 'H', script: 'Cyrillic' },
  'О': { latin: 'O', script: 'Cyrillic' },
  'Р': { latin: 'P', script: 'Cyrillic' },
  'С': { latin: 'C', script: 'Cyrillic' },
  'Т': { latin: 'T', script: 'Cyrillic' },
  'У': { latin: 'Y', script: 'Cyrillic' },
  'Х': { latin: 'X', script: 'Cyrillic' },
  'Ѕ': { latin: 'S', script: 'Cyrillic' },
  'І': { latin: 'I', script: 'Cyrillic' },
  'Ј': { latin: 'J', script: 'Cyrillic' },
  'Ԁ': { latin: 'D', script: 'Cyrillic' },
  'Ԛ': { latin: 'Q', script: 'Cyrillic' },
  'Ѡ': { latin: 'W', script: 'Cyrillic' },

  // Greek lowercase
  'α': { latin: 'a', script: 'Greek' },
  'β': { latin: 'B', script: 'Greek' },
  'ε': { latin: 'e', script: 'Greek' },
  'ι': { latin: 'i', script: 'Greek' },
  'κ': { latin: 'k', script: 'Greek' },
  'ν': { latin: 'v', script: 'Greek' },
  'ο': { latin: 'o', script: 'Greek' },
  'ρ': { latin: 'p', script: 'Greek' },
  'τ': { latin: 't', script: 'Greek' },
  'υ': { latin: 'u', script: 'Greek' },
  'χ': { latin: 'x', script: 'Greek' },
  'ω': { latin: 'w', script: 'Greek' },
  // Greek uppercase
  'Α': { latin: 'A', script: 'Greek' },
  'Β': { latin: 'B', script: 'Greek' },
  'Ε': { latin: 'E', script: 'Greek' },
  'Ζ': { latin: 'Z', script: 'Greek' },
  'Η': { latin: 'H', script: 'Greek' },
  'Ι': { latin: 'I', script: 'Greek' },
  'Κ': { latin: 'K', script: 'Greek' },
  'Μ': { latin: 'M', script: 'Greek' },
  'Ν': { latin: 'N', script: 'Greek' },
  'Ο': { latin: 'O', script: 'Greek' },
  'Ρ': { latin: 'P', script: 'Greek' },
  'Τ': { latin: 'T', script: 'Greek' },
  'Υ': { latin: 'Y', script: 'Greek' },
  'Χ': { latin: 'X', script: 'Greek' },

  // A few Armenian / other lookalikes seen in real attacks
  'օ': { latin: 'o', script: 'Armenian' },
  'ց': { latin: 'g', script: 'Armenian' },

  // Digit lookalikes sometimes used too
  '𝟎': { latin: '0', script: 'Mathematical' },
  '𝟏': { latin: '1', script: 'Mathematical' },
};

// Unicode ranges used to classify a codepoint's script for mixed-script detection.
const SCRIPT_RANGES = [
  { name: 'Cyrillic', ranges: [[0x0400, 0x04FF], [0x0500, 0x052F], [0x2DE0, 0x2DFF], [0xA640, 0xA69F]] },
  { name: 'Greek', ranges: [[0x0370, 0x03FF], [0x1F00, 0x1FFF]] },
  { name: 'Armenian', ranges: [[0x0530, 0x058F]] },
];

function hgDetectScript(cp) {
  for (const s of SCRIPT_RANGES) {
    for (const [a, b] of s.ranges) {
      if (cp >= a && cp <= b) return s.name;
    }
  }
  if ((cp >= 0x0041 && cp <= 0x005A) || (cp >= 0x0061 && cp <= 0x007A) || (cp >= 0x00C0 && cp <= 0x024F)) {
    return 'Latin';
  }
  if (cp >= 0x0030 && cp <= 0x0039) return 'Digit';
  return null;
}
