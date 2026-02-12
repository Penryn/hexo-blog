const cards = document.querySelectorAll('.index-card');

if (cards.length) {
  const row = document.querySelector('.row');
  if (row) {
    row.style.overflow = 'hidden';
  }

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getOrigin = () => {
    const coefficient = document.documentElement.clientWidth > 768 ? 0.5 : 0.3;
    return document.documentElement.clientHeight - cards[0].getBoundingClientRect().height * coefficient;
  };

  const updateCards = () => {
    const origin = getOrigin();
    cards.forEach((card) => {
      const visible = (card.getBoundingClientRect().top - origin) < 0;
      card.style.setProperty('--state', visible ? '1' : '0');
    });
  };

  if (prefersReducedMotion) {
    cards.forEach((card) => card.style.setProperty('--state', '1'));
  } else {
    let rafId = null;

    const scheduleUpdate = () => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        updateCards();
        rafId = null;
      });
    };

    document.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();
  }
}
