// Applies the saved or system theme before first paint (also on /login, which has no theme toggle).
// Kept as a same-origin file because the production CSP blocks inline scripts.
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
