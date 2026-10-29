/* ==========================================================================
   HanoiWeb — utils.js
   Các hàm tiện ích dùng chung, không phụ thuộc framework.
   ========================================================================== */

/** Query shorthand */
export const qs = (sel, ctx = document) => ctx.querySelector(sel);
export const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/** Debounce — trì hoãn thực thi cho tới khi ngừng gọi trong `wait`ms */
export function debounce(fn, wait = 150) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** Throttle — giới hạn tần suất thực thi tối đa 1 lần / `wait`ms */
export function throttle(fn, wait = 150) {
  let last = 0;
  let timer = null;
  return (...args) => {
    const now = Date.now();
    const remaining = wait - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      last = now;
      fn(...args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => {
        last = Date.now();
        fn(...args);
      }, remaining);
    }
  };
}

/** Tải một component HTML (header/navbar/footer/sidebar) và chèn vào selector.
 *  Yêu cầu trang được phục vụ qua http(s) (server), không hoạt động khi mở
 *  trực tiếp bằng file:// do trình duyệt chặn fetch() với local file.
 */
export async function loadComponent(targetSelector, url) {
  const target = qs(targetSelector);
  if (!target) return null;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    target.innerHTML = html;
    return target;
  } catch (err) {
    console.warn(`[HanoiWeb] Không tải được component "${url}". Hãy chạy qua local server (vd: npx serve, Live Server). `, err);
    return null;
  }
}

/** Chạy callback khi phần tử xuất hiện trong viewport (dùng cho reveal / counter) */
export function onIntersect(el, callback, options = { threshold: 0.2 }) {
  if (!('IntersectionObserver' in window)) {
    callback();
    return null;
  }
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, options);
  observer.observe(el);
  return observer;
}

/** Kẹp giá trị trong khoảng [min, max] */
export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

/** Kiểm tra email cơ bản */
export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
