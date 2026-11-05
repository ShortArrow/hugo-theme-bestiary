/*
  Sets every letter on the leaf as if hand-set in metal type and printed on a hand press, then kept for years:
  - each letter is turned and shifted a little, as a sort sits slightly askew in the forme;
  - a few sorts stand a hair low and print faint and broken on one side, and a few stand high and print heavy;
  - the ink and the pressure fall off across the page in one direction, as when a roller runs dry or the platen is not quite level;
  - here and there the paper resisted the ink, and the letters over such a patch print short;
  - the grain of the paper breaks every letter a little, through a soft mask laid continuously across the leaf;
  - inside a tide mark, where the leaf was wet and dried, the letters are faded and slightly blurred.
  Titles, section headings and seals already print through the worn-ink filter, so only their tilt is set here.
  However faint a letter prints, its average ink, counted with the share of it the masks leave where it stands, keeps a contrast of at least 4.5:1
  against the paper (WCAG 2 AA for body text), worked out from the page's own colours and again when the scheme turns.
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
  const inked = [];
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

    span.classList.add("bestiary-glyph-speckled");
    span.style.setProperty("--bestiary-speckle-x", `${-(box.left - sheet.left).toFixed(1)}px`);
    span.style.setProperty("--bestiary-speckle-y", `${-(box.top - sheet.top).toFixed(1)}px`);
    inked.push([span, ink]);
  }

  const rgb = (value) => {
    const hex = value.trim().match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (hex) return hex.slice(1).map((h) => parseInt(h, 16));
    return value.match(/[\d.]+/g).slice(0, 3).map(Number);
  };
  const luminance = (c) => {
    const [r, g, b] = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const AA = 4.52;
  const LOW = 0.7;
  let speckleAt = () => 0.6;

  const legible = () => {
    const paper = rgb(getComputedStyle(document.documentElement).getPropertyValue("--paper"));
    const least = new Map();
    const leastFor = (color) => {
      if (!least.has(color)) {
        const text = rgb(color);
        const mixed = (a) => text.map((t, i) => a * t + (1 - a) * paper[i]);
        let lo = 0, hi = 1;
        if (contrast(mixed(1), paper) < AA) lo = 1;
        else for (let i = 0; i < 20; i++) {
          const mid = (lo + hi) / 2;
          if (contrast(mixed(mid), paper) >= AA) hi = mid; else lo = mid;
        }
        least.set(color, Math.max(lo, hi));
      }
      return least.get(color);
    };
    for (const [span, ink] of inked) {
      const need = leastFor(getComputedStyle(span).color);
      span.classList.add("bestiary-glyph-speckled");
      let cover = speckleAt(span);
      if (span.classList.contains("bestiary-glyph-low")) {
        if (need / (cover * LOW) <= 1) cover *= LOW;
        else span.classList.remove("bestiary-glyph-low");
      }
      if (need / cover > 1) {
        span.classList.remove("bestiary-glyph-speckled");
        cover = span.classList.contains("bestiary-glyph-low") ? LOW : 1;
      }
      span.style.opacity = String(Math.min(1, Math.ceil(Math.max(ink, need / cover) * 1000) / 1000));
    }
  };

  const loadSpeckle = () => {
    const url = getComputedStyle(document.documentElement).getPropertyValue("--bestiary-speckle").match(/url\(["']?(.*?)["']?\)$/);
    if (!url) return;
    const img = new Image();
    img.src = url[1];
    img.decode().then(() => {
      const w = img.naturalWidth, h = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const g = canvas.getContext("2d");
      g.drawImage(img, 0, 0);
      const alpha = g.getImageData(0, 0, w, h).data;
      const sum = new Float64Array((w + 1) * (h + 1));
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        sum[(y + 1) * (w + 1) + x + 1] = alpha[(y * w + x) * 4 + 3] / 255
          + sum[y * (w + 1) + x + 1] + sum[(y + 1) * (w + 1) + x] - sum[y * (w + 1) + x];
      }
      const at = (x, y) => {
        const fx = Math.floor(x / w), fy = Math.floor(y / h);
        const px = x - fx * w, py = y - fy * h;
        return fx * fy * sum[h * (w + 1) + w] + fx * sum[py * (w + 1) + w] + fy * sum[h * (w + 1) + px] + sum[py * (w + 1) + px];
      };
      speckleAt = (span) => {
        const origin = leaf.getBoundingClientRect();
        const box = span.getBoundingClientRect();
        const x0 = Math.max(0, Math.floor(box.left - origin.left)), y0 = Math.max(0, Math.floor(box.top - origin.top));
        const x1 = Math.max(x0 + 1, Math.ceil(box.right - origin.left)), y1 = Math.max(y0 + 1, Math.ceil(box.bottom - origin.top));
        return Math.max(0.05, (at(x1, y1) - at(x0, y1) - at(x1, y0) + at(x0, y0)) / ((x1 - x0) * (y1 - y0)));
      };
      legible();
    });
  };

  legible();
  loadSpeckle();
  new MutationObserver(legible).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", legible);
})();
