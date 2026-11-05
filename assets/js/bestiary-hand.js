/*
  Sets every letter on the leaf as if hand-set in metal type and printed on a hand press, then kept for years:
  - each letter is turned and shifted a little, as a sort sits slightly askew in the forme;
  - a few sorts stand a hair low and print faint and broken on one side, and a few stand high and print heavy;
  - the ink and the pressure fall off across the page in one direction, as when a roller runs dry or the platen is not quite level;
  - here and there the paper resisted the ink, and the letters over such a patch print short;
  - inside a tide mark, where the leaf was wet and dried, the letters are faded and slightly blurred.
  Titles, section headings and seals already print through the worn-ink filter, so only their tilt is set here.
  Every amount comes from the page's path and the letter's place, so a page prints the same on every visit.
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

  const page = Array.from(location.pathname).reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
  const noise = (n) => {
    let t = ((n ^ page) * 0x9e3779b1) >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296 - 0.5;
  };
  const smooth = (x, y, scale, salt) => {
    const gx = Math.floor(x / scale), gy = Math.floor(y / scale);
    const fx = x / scale - gx, fy = y / scale - gy;
    const at = (i, j) => noise(salt + (gx + i) * 7919 + (gy + j) * 104729);
    const ease = (t) => t * t * (3 - 2 * t);
    const top = at(0, 0) + (at(1, 0) - at(0, 0)) * ease(fx);
    const bottom = at(0, 1) + (at(1, 1) - at(0, 1)) * ease(fx);
    return top + (bottom - top) * ease(fy);
  };

  let count = 0;
  const glyphs = [];
  const glyph = (letter) => {
    const n = count++ * 8;
    const span = document.createElement("span");
    span.className = "bestiary-glyph";
    span.style.transform =
      `translate(${(noise(n) * 0.03).toFixed(3)}em, ${(noise(n + 1) * 0.08).toFixed(3)}em) rotate(${(noise(n + 2) * 4).toFixed(2)}deg)`;
    span.textContent = letter;
    glyphs.push([span, n]);
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

  const sheet = leaf.getBoundingClientRect();
  const fall = (noise(-1) + 0.5) * 2 * Math.PI;
  const fallBy = 0.12 + (noise(-2) + 0.5) * 0.16;
  const tides = Array.from(leaf.querySelectorAll(".bestiary-stain-tide"), (tide) => tide.getBoundingClientRect());

  const wornAlready = "h1, header, .bestiary-index-section, .bestiary-choice";
  for (const [span, n] of glyphs) {
    if (span.closest(wornAlready)) continue;
    const box = span.getBoundingClientRect();
    const x = box.left + box.width / 2 - sheet.left;
    const y = box.top + box.height / 2 - sheet.top;
    let ink = 1;

    const across = ((x / sheet.width - 0.5) * Math.cos(fall) + (y / sheet.height - 0.5) * Math.sin(fall)) + 0.5;
    ink -= fallBy * Math.min(1, Math.max(0, across));
    ink += smooth(x, y, 220, 11) * 0.12;

    const sort = noise(n + 3);
    if (sort > 0.46) {
      ink *= 0.74;
      span.classList.add("bestiary-glyph-low");
      span.style.setProperty("--bestiary-low-angle", `${Math.round((noise(n + 4) + 0.5) * 360)}deg`);
    } else if (sort < -0.465) {
      span.classList.add("bestiary-glyph-high");
    } else {
      ink += noise(n + 5) * 0.08;
    }

    if (smooth(x, y, 90, 23) > 0.34) {
      ink *= 0.8;
      span.classList.add("bestiary-glyph-low");
      span.style.setProperty("--bestiary-low-angle", `${Math.round((noise(n + 6) + 0.5) * 360)}deg`);
    }

    for (const tide of tides) {
      const dx = (box.left + box.width / 2 - (tide.left + tide.width / 2)) / (tide.width / 2);
      const dy = (box.top + box.height / 2 - (tide.top + tide.height / 2)) / (tide.height / 2);
      if (dx * dx + dy * dy < 0.8) {
        ink *= 0.7;
        span.classList.add("bestiary-glyph-wet");
      }
    }

    span.style.opacity = Math.min(1, Math.max(0.35, ink)).toFixed(2);
  }
})();
