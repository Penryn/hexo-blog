(() => {
  'use strict';

  const article = document.querySelector('.post-content');
  if (!article) {
    return;
  }

  const bar = document.createElement('div');
  bar.id = 'reading-progress';
  document.body.appendChild(bar);

  let ticking = false;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const getProgress = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) {
      return 1;
    }
    return clamp(window.scrollY / scrollable, 0, 1);
  };

  const render = () => {
    bar.style.transform = `scaleX(${getProgress().toFixed(4)})`;
    ticking = false;
  };

  const onChange = () => {
    if (!ticking) {
      window.requestAnimationFrame(render);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);
  render();
})();
