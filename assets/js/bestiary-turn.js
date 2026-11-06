/*
  Turns the pages when the reader presses one of the header's buttons, and remembers the choice:
  - the moon or the sun turns between day and night; until the reader chooses, the pages follow the system's scheme;
  - the tree, the cloud or the house moves the leaf between the forest floor, the sky and the desk at home, in that order; until the reader chooses, it lies on the desk.
  The new state billows out from the button like a puff of smoke, unless the reader asks for reduced motion; the billow waits until the new place's drawings have loaded and the new pages' first frame is drawn, so however long either takes, none of the billow is skipped.
  Each choice is restored by a script in the head before the first paint.
*/
(() => {
  const root = document.documentElement;
  const systemNight = matchMedia("(prefers-color-scheme: dark)");

  const turners = [
    {
      button: document.querySelector(".bestiary-scheme"),
      key: "theme",
      stored: "bestiary-scheme",
      order: ["light", "dark"],
      current: () => root.dataset.theme || (systemNight.matches ? "dark" : "light"),
      label: { light: "Turn to night pages", dark: "Turn to day pages" },
    },
    {
      button: document.querySelector(".bestiary-place"),
      key: "place",
      stored: "bestiary-place",
      order: ["forest", "sky", "home"],
      current: () => root.dataset.place || "home",
      label: {
        forest: "The leaf lies on the forest floor; move it under the sky",
        sky: "The leaf lies under the sky; take it home to the desk",
        home: "The leaf lies on the desk; take it out to the forest",
      },
    },
  ].filter((t) => t.button);

  const label = (t) => t.button.setAttribute("aria-label", t.label[t.current()]);

  const turn = (t) => {
    const next = t.order[(t.order.indexOf(t.current()) + 1) % t.order.length];
    root.dataset[t.key] = next;
    try {
      localStorage.setItem(t.stored, next);
    } catch {}
    label(t);
  };

  const drawn = () =>
    Promise.all(
      [...getComputedStyle(document.body).backgroundImage.matchAll(/url\("([^"]+)"\)/g)].map(([, url]) => {
        const picture = new Image();
        picture.src = url;
        return picture.decode().catch(() => {});
      }),
    );

  const billow = (button) => {
    const box = button.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const size = (reach * 2) / 0.55;
    const timing = { duration: 950, easing: "cubic-bezier(.25,.6,.3,1)", fill: "both" };
    const puffs = [
      root.animate(
        {
          maskSize: ["1px 1px", `${size}px ${size}px`],
          maskPosition: [`${x}px ${y}px`, `${x - size / 2}px ${y - size / 2}px`],
          filter: ["blur(10px)", "blur(0px)"],
          opacity: [0.5, 1],
        },
        { ...timing, pseudoElement: "::view-transition-new(root)" },
      ),
      root.animate({ filter: ["blur(0px)", "blur(4px)"] }, { ...timing, pseudoElement: "::view-transition-old(root)" }),
    ];
    puffs.forEach((a) => a.pause());
    drawn().then(() => requestAnimationFrame(() => requestAnimationFrame(() => puffs.forEach((a) => a.play()))));
  };

  for (const t of turners) {
    t.button.addEventListener("click", () => {
      if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        turn(t);
        return;
      }
      document.startViewTransition(() => turn(t)).ready.then(() => billow(t.button));
    });
    label(t);
    t.button.hidden = false;
  }
  systemNight.addEventListener("change", () => turners.forEach(label));
})();
