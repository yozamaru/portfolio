/**
 * サイト全体の動き。見た目の演出だけで、無くても内容はすべて読める。
 * - [data-reveal]：画面に入ったら .is-in を付けて、ふわっと表示する（遅延は style の --d）
 * - [data-spotlight]：カーソルの位置を --mx / --my に入れる（カードの光）
 * - [data-tilt]：カーソルに合わせて少し傾ける
 * - スクロールしたら <html data-scrolled> を付ける（ヘッダーの見た目）、読んだ割合を --progress に入れる
 * 端末で「視差効果を減らす」が有効なときは、動きを付けずにすぐ表示する。
 */
const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// 表示の演出
const targets = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
if (reduce || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('is-in'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  targets.forEach((el) => observer.observe(el));
}

// カーソルの光と傾き（マウスなど細かく指せる端末だけ）
if (finePointer && !reduce) {
  for (const el of document.querySelectorAll<HTMLElement>('[data-spotlight]')) {
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      el.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  }
  for (const el of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    const max = Number(el.dataset.tilt || 8);
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty('--ry', `${(x * max).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${(-y * max).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.removeProperty('--ry');
      el.style.removeProperty('--rx');
    });
  }
}

// スクロールの状態
let ticking = false;
const onScroll = () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    root.toggleAttribute('data-scrolled', scrollY > 8);
    root.style.setProperty('--progress', max > 0 ? String(Math.min(1, scrollY / max)) : '0');
    ticking = false;
  });
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
