const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');
const label = toggle.querySelector('.theme-label');

root.dataset.theme = 'light';

toggle.addEventListener('click', () => {
  const dark = root.dataset.theme !== 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  toggle.setAttribute('aria-pressed', String(dark));
  toggle.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  label.textContent = dark ? 'Light mode' : 'Dark mode';
});
