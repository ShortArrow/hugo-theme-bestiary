/*
  Turns the pages between day and night when the reader presses the moon or the sun, and remembers the choice.
  The new scheme billows out from the button like a puff of smoke, unless the reader asks for reduced motion.
  Until the reader chooses, the pages follow the system's scheme; the choice is restored by a script in the head before the first paint.
*/
(() => {
  const button = document.querySelector(".bestiary-scheme");
  if (!button) return;
  const root = document.documentElement;
  const systemNight = matchMedia("(prefers-color-scheme: dark)");
  const night = () => (root.dataset.theme ? root.dataset.theme === "dark" : systemNight.matches);
  const label = () => button.setAttribute("aria-label", night() ? "Turn to day pages" : "Turn to night pages");

  const turn = () => {
    const next = night() ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("bestiary-scheme", next);
    } catch {}
    label();
  };

  const billow = () => {
    const box = button.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const reach = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const size = (reach * 2) / 0.55;
    const timing = { duration: 950, easing: "cubic-bezier(.25,.6,.3,1)", fill: "both" };
    root.animate(
      {
        maskSize: ["0px 0px", `${size}px ${size}px`],
        maskPosition: [`${x}px ${y}px`, `${x - size / 2}px ${y - size / 2}px`],
        filter: ["blur(10px)", "blur(0px)"],
        opacity: [0.5, 1],
      },
      { ...timing, pseudoElement: "::view-transition-new(root)" },
    );
    root.animate({ filter: ["blur(0px)", "blur(4px)"] }, { ...timing, pseudoElement: "::view-transition-old(root)" });
  };

  button.addEventListener("click", () => {
    if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      turn();
      return;
    }
    document.startViewTransition(turn).ready.then(billow);
  });
  systemNight.addEventListener("change", label);
  label();
  button.hidden = false;
})();
