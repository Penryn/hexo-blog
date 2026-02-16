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
    // 基于文章内容计算进度
    const articleTop = article.offsetTop;
    const articleHeight = article.offsetHeight;
    const windowHeight = window.innerHeight;
    const scrollTop = window.scrollY;

    // 当文章顶部到达视口顶部时，进度为 0%
    // 当文章底部到达视口底部时，进度为 100%
    // 进度 = (卷去的高度 - 文章起始位置) / (文章总高度 - 视口高度)
    
    // 如果文章高度小于视口高度，直接返回 1
    if (articleHeight <= windowHeight) return 1;

    const progress = (scrollTop - articleTop) / (articleHeight - windowHeight);
    
    // 某些情况下为了更好的体验，可以稍微调整起始点
    // 但标准逻辑如上
    return clamp(progress, 0, 1);
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
