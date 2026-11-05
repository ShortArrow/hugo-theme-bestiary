/*
  Turns the pages between day and night when the reader presses the moon or the sun, and remembers the choice.
  Until the reader chooses, the pages follow the system's scheme; the choice is restored by a script in the head before the first paint.
*/
(() => {
  const button = document.querySelector(".bestiary-scheme");
  if (!button) return;
  const root = document.documentElement;
  const systemNight = matchMedia("(prefers-color-scheme: dark)");
  const night = () => (root.dataset.theme ? root.dataset.theme === "dark" : systemNight.matches);
  const label = () => button.setAttribute("aria-label", night() ? "Turn to day pages" : "Turn to night pages");

  button.addEventListener("click", () => {
    const next = night() ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("bestiary-scheme", next);
    } catch {}
    label();
  });
  systemNight.addEventListener("change", label);
  label();
  button.hidden = false;
})();
