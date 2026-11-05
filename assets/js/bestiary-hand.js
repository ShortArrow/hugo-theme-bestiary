/*
  Sets every letter on the leaf slightly askew, as if set by hand: each one is turned and shifted by a small amount.
  The amounts come from the letter's position on the page, so a page looks the same on every visit.
  Latin words stay unbroken across lines; Han and kana may still break between any two letters.
*/
(() => {
  const leaf = document.querySelector(".bestiary-leaf");
  if (!leaf) return;

  const skipped = new Set(["SCRIPT", "STYLE", "PRE", "CODE", "SVG", "TEXTAREA"]);
  const breaksAnywhere = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
  const letters = typeof Intl.Segmenter === "function"
    ? (text) => Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment)
    : (text) => Array.from(text);

  const noise = (n) => {
    let t = (n * 0x9e3779b1) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };

  let count = 0;
  const glyph = (letter) => {
    const n = count++ * 3;
    const span = document.createElement("span");
    span.className = "bestiary-glyph";
    span.style.transform =
      `translate(${(noise(n) * 0.03).toFixed(3)}em, ${(noise(n + 1) * 0.08).toFixed(3)}em) rotate(${(noise(n + 2) * 4).toFixed(2)}deg)`;
    span.textContent = letter;
    return span;
  };

  const set = (text) => {
    const fragment = document.createDocumentFragment();
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        fragment.append(part);
        continue;
      }
      const word = document.createElement("span");
      if (!breaksAnywhere.test(part)) word.className = "bestiary-word";
      for (const letter of letters(part)) word.append(glyph(letter));
      fragment.append(word);
    }
    return fragment;
  };

  const walker = document.createTreeWalker(leaf, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      if (!node.data.trim()) return NodeFilter.FILTER_REJECT;
      for (let el = node.parentElement; el && el !== leaf; el = el.parentElement) {
        if (skipped.has(el.tagName.toUpperCase())) return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  for (const text of texts) text.replaceWith(set(text.data));
})();
