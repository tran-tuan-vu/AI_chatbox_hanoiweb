import { qs, qsa, throttle, onIntersect } from './utils.js';

/* -------------------------------- Hero slider ------------------------------ */
/* Toàn bộ khối hero__inner (tiêu đề + ảnh) là 1 slide, trượt phải sang trái, tự chạy, không nút bấm. */
export function initHeroSlider() {
  const root = qs('[data-slider]');
  if (!root) return;

  const track = qs('.hero-slider__track', root);
  const slides = qsa('.hero-slider__slide', root);
  if (!track || slides.length < 2) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  const interval = parseInt(root.dataset.sliderInterval || '3000', 10);
  let current = 0;

  function next() {
    current = (current + 1) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
  }

  setInterval(next, interval);
}

/* ------------------------------ Chiều cao header cố định ---------------------------- */
/* Header dùng position:fixed nên cần bù --header-height cho body (padding-top) và các
   mục tiêu cuộn (scroll-margin-top) để nội dung không bị header che mất. */
export function initHeaderHeight() {
  const header = qs('.header');
  if (!header) return;
  const headerBot = qs('.header-bot', header);

  let expandedHeight = header.offsetHeight;
  let collapsedHeight = headerBot ? headerBot.offsetHeight : expandedHeight;

  const apply = () => {
    const height = header.classList.contains('is-scrolled') ? collapsedHeight : expandedHeight;
    document.documentElement.style.setProperty('--header-height', `${height}px`);
  };

  const measure = () => {
    const wasScrolled = header.classList.contains('is-scrolled');
    header.classList.remove('is-scrolled');
    expandedHeight = header.offsetHeight;
    collapsedHeight = headerBot ? headerBot.offsetHeight : expandedHeight;
    if (wasScrolled) header.classList.add('is-scrolled');
    apply();
  };

  measure();
  window.addEventListener('resize', throttle(measure, 150));
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }

  new MutationObserver(apply).observe(header, { attributes: true, attributeFilter: ['class'] });
}

/* ------------------------------ Header scroll ---------------------------- */
export function initHeaderScroll() {
  const header = qs('.header');
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  onScroll();
  window.addEventListener('scroll', throttle(onScroll, 100), { passive: true });
}

/* ------------------------------- Mobile nav ------------------------------- */
export function initMobileNav() {
  const toggle = qs('.grid-toggle');
  const nav = qs('.main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  qsa('.main-nav__item a', nav).forEach((link) => {
    const parent = link.parentElement;
    // Link mở dropdown (item.has-dropdown) tự xử lý riêng trong initDropdowns —
    // không đóng cả menu mobile ngay khi mới bấm để mở submenu.
    const isDropdownTrigger = parent.classList.contains('has-dropdown') && parent.querySelector(':scope > a') === link;
    if (isDropdownTrigger) return;

    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* -------------------------- Nav dropdown chevrons -------------------------- */
/* Thiết bị có chuột thật (hover:hover) giữ nguyên hành vi hover như cũ.
   Thiết bị cảm ứng (tablet/mobile) không có hover đáng tin cậy, nên submenu
   chỉ điều khiển qua .is-open: chạm lần 1 vào mục cha để mở submenu (chặn
   điều hướng), chạm lại mới thực sự đi tới link. */
export function initDropdowns() {
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const items = qsa('.main-nav__item.has-dropdown');
  if (!items.length) return;

  const closeAll = (except) => {
    items.forEach((item) => {
      if (item !== except) item.classList.remove('is-open');
    });
  };

  items.forEach((item) => {
    const link = qs(':scope > a', item);
    const chevron = qs('.chevron', item);

    if (chevron) {
      chevron.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !item.classList.contains('is-open');
        closeAll(item);
        item.classList.toggle('is-open', willOpen);
      });
    }

    if (link && !canHover) {
      link.addEventListener('click', (event) => {
        if (item.classList.contains('is-open')) return;
        event.preventDefault();
        closeAll(item);
        item.classList.add('is-open');
      });
    }
  });

  if (!canHover) {
    document.addEventListener('click', (event) => {
      if (event.target.closest('.main-nav__item.has-dropdown')) return;
      closeAll(null);
    });
  }
}

/* --------------------------------- FAQ ------------------------------------ */
export function initFaqAccordion() {
  const items = qsa('details.faq-item');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const getGroup = (item) =>
    item.closest('.faq-list, .website-why__list, [class*="__faq"], .jobs-apply__faq') || item.parentElement;

  const finishOpen = (item, content) => {
    item.classList.remove('is-opening', 'is-closing');
    content.style.height = 'auto';
  };

  const finishClose = (item, content, summary) => {
    item.open = false;
    item.classList.remove('is-opening', 'is-closing');
    content.style.height = '';
    summary.setAttribute('aria-expanded', 'false');
  };

  const openItem = (item) => {
    const summary = qs('summary', item);
    const content = qs('.faq-item__content', item);
    if (!summary || !content || item.open) return;

    const group = getGroup(item);
    if (group) {
      qsa('details.faq-item', group).forEach((other) => {
        if (other !== item && other.open) closeItem(other);
      });
    }

    item.open = true;
    summary.setAttribute('aria-expanded', 'true');

    if (reduceMotion) {
      finishOpen(item, content);
      return;
    }

    item.classList.remove('is-closing');
    item.classList.add('is-opening');
    content.style.height = '0px';

    // Cho trình duyệt vẽ trạng thái đóng trước rồi mới chuyển sang chiều cao thật.
    requestAnimationFrame(() => {
      const space3 = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--space-3')
      ) || 12;
      const targetHeight = content.scrollHeight + space3;

      item.classList.remove('is-opening');
      content.style.height = `${targetHeight}px`;

      const onEnd = (event) => {
        if (event.propertyName !== 'height') return;
        content.removeEventListener('transitionend', onEnd);
        if (item.open && !item.classList.contains('is-closing')) {
          finishOpen(item, content);
        }
      };
      content.addEventListener('transitionend', onEnd);
    });
  };

  function closeItem(item) {
    const summary = qs('summary', item);
    const content = qs('.faq-item__content', item);
    if (!summary || !content || !item.open) return;

    if (reduceMotion) {
      finishClose(item, content, summary);
      return;
    }

    item.classList.remove('is-opening');
    content.style.height = `${content.scrollHeight}px`;

    // Ép reflow để trình duyệt ghi nhận chiều cao hiện tại trước khi thu gọn.
    content.getBoundingClientRect();

    item.classList.add('is-closing');
    content.style.height = '0px';
    summary.setAttribute('aria-expanded', 'false');

    const onEnd = (event) => {
      if (event.propertyName !== 'height') return;
      content.removeEventListener('transitionend', onEnd);
      finishClose(item, content, summary);
    };
    content.addEventListener('transitionend', onEnd);
  }

  items.forEach((item) => {
    const summary = qs('summary', item);
    const content = qs('.faq-item__content', item);
    if (!summary || !content) return;

    // Mặc định giữ FAQ thu gọn như thiết kế.
    item.open = false;
    summary.setAttribute('aria-expanded', 'false');
    content.style.height = '';

    // Chặn toggle mặc định của <details> để có thể animate cả lúc mở và đóng.
    summary.addEventListener('click', (event) => {
      event.preventDefault();

      if (item.classList.contains('is-opening') || item.classList.contains('is-closing')) return;

      if (item.open) closeItem(item);
      else openItem(item);
    });
  });
}

/* ------------------------------ Scroll reveal ------------------------------ */
export function initReveal() {
  const items = qsa('[data-reveal]');
  items.forEach((el) => {
    onIntersect(el, () => el.classList.add('is-visible'), { threshold: 0.12 });
  });
}

/* ------------------- Trim transparent padding on logos --------------------- */
/* Nguồn logo đối tác có độ đệm trong suốt khác nhau (có file gần như kín khung,
   có file chỉ chiếm 1 góc nhỏ) khiến height/width bằng nhau vẫn trông lệch cỡ.
   Cắt về đúng vùng có nội dung (theo alpha) để mọi logo cùng tỉ lệ hiển thị. */
export function initPartnerLogoTrim() {
  qsa('.partners__logo').forEach((img) => {
    const run = () => trimTransparentPadding(img);
    if (img.complete && img.naturalWidth) run();
    else img.addEventListener('load', run, { once: true });
  });
}

function trimTransparentPadding(img) {
  try {
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const source = document.createElement('canvas');
    source.width = w;
    source.height = h;
    const sourceCtx = source.getContext('2d');
    sourceCtx.drawImage(img, 0, 0);
    const { data } = sourceCtx.getImageData(0, 0, w, h);

    let minX = w, minY = h, maxX = 0, maxY = 0;
    const step = 2;
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX <= minX || maxY <= minY) return;

    const padX = Math.round((maxX - minX) * 0.04);
    const padY = Math.round((maxY - minY) * 0.04);
    const sx = Math.max(0, minX - padX);
    const sy = Math.max(0, minY - padY);
    const sw = Math.min(w, maxX + padX) - sx;
    const sh = Math.min(h, maxY + padY) - sy;
    if (sw === w && sh === h) return;

    const cropped = document.createElement('canvas');
    cropped.width = sw;
    cropped.height = sh;
    cropped.getContext('2d').drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    img.src = cropped.toDataURL('image/png');
  } catch (err) {
    /* canvas có thể bị "tainted" khi mở trực tiếp qua file:// — bỏ qua, giữ ảnh gốc */
  }
}

/* ------------------------------ Count-up stats ----------------------------- */
export function initCounters() {
  qsa('[data-counter]').forEach((el) => {
    const end = parseFloat(el.dataset.counterEnd || '0');
    const decimals = parseInt(el.dataset.counterDecimals || '0', 10);
    const prefix = el.dataset.counterPrefix || '';
    const suffix = el.dataset.counterSuffix || '';
    const thousands = el.dataset.counterThousands || '';
    const duration = 1400;

    const format = (value) => {
      let str = value.toFixed(decimals);
      if (thousands) {
        const [intPart, decPart] = str.split('.');
        str = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (decPart ? '.' + decPart : '');
      }
      return prefix + str + suffix;
    };

    onIntersect(
      el,
      () => {
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = format(end * eased);
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
  });
}

/* ---------------------------- Blog filter + phân trang ---------------------------- */
export function initBlogPagination() {
  const grid = qs('.blog-page__grid');
  if (!grid) return;
  const cards = qsa('.blog-card', grid);
  if (!cards.length) return;

  const tabs = qsa('.blog-filter__tab');
  const searchForm = qs('.blog-search__form');
  const searchInput = searchForm ? qs('input[type="search"]', searchForm) : null;
  const empty = qs('.blog-page__empty');
  const list = qs('.pagination__list');
  const prevBtn = qs('.pagination__arrow--prev');
  const nextBtn = qs('.pagination__arrow--next');
  const PAGE_SIZE = 6;

  let filter = 'all';
  let term = '';
  let page = 1;

  function matched() {
    return cards.filter((card) => {
      const matchesFilter = filter === 'all' || card.dataset.category === filter;
      const haystack = card.textContent.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      return matchesFilter && matchesSearch;
    });
  }

  function render() {
    const items = matched();
    const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;

    cards.forEach((card) => { card.style.display = 'none'; });
    const start = (page - 1) * PAGE_SIZE;
    items.slice(start, start + PAGE_SIZE).forEach((card) => { card.style.display = ''; });

    if (empty) empty.hidden = items.length > 0;

    if (list) {
      list.innerHTML = '';
      for (let i = 1; i <= totalPages; i += 1) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'pagination__item' + (i === page ? ' is-active' : '');
        a.textContent = String(i);
        a.addEventListener('click', (event) => {
          event.preventDefault();
          if (page === i) return;
          page = i;
          render();
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        li.appendChild(a);
        list.appendChild(li);
      }
    }

    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (page <= 1) return;
      page -= 1;
      render();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(matched().length / PAGE_SIZE));
      if (page >= totalPages) return;
      page += 1;
      render();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      filter = tab.dataset.filter;
      page = 1;
      render();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      term = searchInput.value.trim().toLowerCase();
      page = 1;
      render();
    });
  }
  if (searchForm) {
    searchForm.addEventListener('submit', (event) => {
      event.preventDefault();
      term = (searchInput?.value || '').trim().toLowerCase();
      page = 1;
      render();
    });
  }

  render();
}

/* --------------------- Sơ đồ tiêu chuẩn thiết kế (mũi tên nối) --------------------- */
const SVG_NS = 'http://www.w3.org/2000/svg';

export function initStandardsDiagram() {
  const diagram = qs('.standards-diagram');
  if (!diagram) return;
  const svg = qs('.standards-diagram__lines', diagram);
  const center = qs('.standards-diagram__center', diagram);
  const leftBoxes = qsa('.standards-diagram__col--left .standard-box', diagram);
  const rightBoxes = qsa('.standards-diagram__col--right .standard-box', diagram);
  if (!svg || !center || (!leftBoxes.length && !rightBoxes.length)) return;

  function draw() {
    const diagramRect = diagram.getBoundingClientRect();
    const centerRect = center.getBoundingClientRect();
    const centerX = centerRect.left + centerRect.width / 2 - diagramRect.left;

    svg.setAttribute('width', diagramRect.width);
    svg.setAttribute('height', diagramRect.height);
    svg.innerHTML = '';

    const defs = document.createElementNS(SVG_NS, 'defs');
    defs.innerHTML = `
      <marker id="standardsArrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="userSpaceOnUse">
        <path class="arrow-marker" d="M0,0 L8,4 L0,8 Z"></path>
      </marker>
    `;
    svg.appendChild(defs);

    const rows = [
      ...leftBoxes.map((el) => ({ el, side: 'left' })),
      ...rightBoxes.map((el) => ({ el, side: 'right' })),
    ];
    let minY = Infinity;
    let maxY = -Infinity;

    rows.forEach(({ el, side }) => {
      const rect = el.getBoundingClientRect();
      const y = rect.top + rect.height / 2 - diagramRect.top;
      const edgeX = side === 'left' ? rect.right - diagramRect.left : rect.left - diagramRect.left;
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      const branch = document.createElementNS(SVG_NS, 'path');
      branch.setAttribute('d', `M ${centerX} ${y} H ${edgeX}`);
      branch.setAttribute('marker-end', 'url(#standardsArrow)');
      svg.appendChild(branch);
    });

    if (Number.isFinite(minY) && Number.isFinite(maxY)) {
      const trunk = document.createElementNS(SVG_NS, 'path');
      trunk.setAttribute('d', `M ${centerX} ${minY} V ${maxY}`);
      svg.insertBefore(trunk, svg.firstChild.nextSibling);
    }
  }

  draw();
  window.addEventListener('resize', () => requestAnimationFrame(draw));
  window.addEventListener('load', () => requestAnimationFrame(draw));
}

/* --------------------- Chọn vấn đề cần hỗ trợ (tab đơn giản) --------------------- */
export function initSupportTabs() {
  const tabs = qsa('.support-tab');
  const panels = qsa('.support-panel');
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const target = tab.dataset.target;
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.panel !== target;
      });
    });
  });
}

/* --------------------- Lọc danh sách vị trí tuyển dụng --------------------- */
export function initJobsFilter() {
  const grid = qs('.jobs-grid');
  if (!grid) return;
  const cards = qsa('.job-card', grid).filter((card) => !card.dataset.openApplication);
  const groupSelect = qs('[data-filter="group"] select');
  const locationSelect = qs('[data-filter="location"] select');
  const formatSelect = qs('[data-filter="format"] select');
  const empty = qs('#jobs-empty');
  if (!groupSelect || !locationSelect || !formatSelect || !cards.length) return;

  function render() {
    const group = groupSelect.value;
    const location = locationSelect.value;
    const format = formatSelect.value;
    let visibleCount = 0;
    cards.forEach((card) => {
      const matches =
        (group === 'all' || card.dataset.group === group) &&
        (location === 'all' || card.dataset.location === location) &&
        (format === 'all' || card.dataset.format === format);
      card.style.display = matches ? '' : 'none';
      if (matches) visibleCount += 1;
    });
    if (empty) empty.hidden = visibleCount > 0;
  }

  [groupSelect, locationSelect, formatSelect].forEach((select) => select.addEventListener('change', render));
}

/* --------------------- Lọc + tìm kiếm câu hỏi thường gặp --------------------- */
export function initFaqFilter() {
  const list = qs('#faq-list');
  const tabs = qsa('.faq-filter__tab');
  const searchInput = qs('#faq-search-input');
  const searchForm = qs('#faq-search-form');
  const empty = qs('#faq-empty');
  if (!list || !tabs.length) return;

  const items = qsa('.faq-item', list);
  let filter = 'all';

  function render() {
    const term = (searchInput?.value || '').trim().toLowerCase();
    let visibleCount = 0;
    items.forEach((item) => {
      const matchesCategory = filter === 'all' || item.dataset.category === filter;
      const question = item.querySelector('summary')?.textContent.toLowerCase() || '';
      const matchesSearch = !term || question.includes(term);
      const visible = matchesCategory && matchesSearch;
      item.style.display = visible ? '' : 'none';
      if (visible) visibleCount += 1;
    });
    if (empty) empty.hidden = visibleCount > 0;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      filter = tab.dataset.filter;
      render();
    });
  });

  if (searchInput) searchInput.addEventListener('input', render);
  if (searchForm) searchForm.addEventListener('submit', (event) => { event.preventDefault(); render(); });
}

/* --------------------- Phân trang "Nội dung liên quan" --------------------- */
export function initRelatedPagination() {
  const grid = qs('.post-related__grid');
  if (!grid) return;
  const cards = qsa('.blog-card', grid);
  if (!cards.length) return;

  const section = grid.closest('.post-related');
  const pagination = section ? qs('.pagination', section) : null;
  const list = pagination ? qs('.pagination__list', pagination) : null;
  const prevBtn = pagination ? qs('.pagination__arrow--prev', pagination) : null;
  const nextBtn = pagination ? qs('.pagination__arrow--next', pagination) : null;
  const PAGE_SIZE = 4;
  let page = 1;

  function render() {
    const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * PAGE_SIZE;
    cards.forEach((card, i) => {
      card.style.display = i >= start && i < start + PAGE_SIZE ? '' : 'none';
    });

    if (list) {
      list.innerHTML = '';
      for (let i = 1; i <= totalPages; i += 1) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'pagination__item' + (i === page ? ' is-active' : '');
        a.textContent = String(i);
        a.addEventListener('click', (event) => {
          event.preventDefault();
          if (page === i) return;
          page = i;
          render();
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        li.appendChild(a);
        list.appendChild(li);
      }
    }
    if (prevBtn) prevBtn.disabled = page <= 1;
    if (nextBtn) nextBtn.disabled = page >= totalPages;
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (page <= 1) return;
      page -= 1;
      render();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
      if (page >= totalPages) return;
      page += 1;
      render();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  render();
}

/* --------------------- Scrollspy dùng chung (mục lục bài viết / tab chính sách) --------------------- */
function initScrollspy(linkSelector) {
  const links = qsa(linkSelector);
  if (!links.length) return;

  const sections = links
    .map((link) => qs(link.getAttribute('href')))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((link) => link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`));
  };
  setActive(sections[0]?.id);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
  );
  sections.forEach((section) => observer.observe(section));
}

/* --------------------- Mục lục (scrollspy) trang bài viết --------------------- */
export function initArticleToc() {
  initScrollspy('.post-toc__list a');
}

/* --------------------- Tab mục lục (scrollspy) trang chính sách --------------------- */
export function initPolicyTabs() {
  initScrollspy('.policy-tabs__item');
}

/* --------------------- Tương tác các trang dịch vụ --------------------- */
function activateByIndex(items, index) {
  items.forEach((item, i) => {
    const active = i === index;
    item.classList.toggle('is-active', active);
    if (item.matches('button,[role="tab"]')) item.setAttribute('aria-selected', String(active));
  });
}

function setIconList(list, values) {
  const rows = qsa('li', list);
  rows.forEach((row, i) => {
    if (!values[i]) return;
    const icon = row.querySelector('i');
    row.textContent = '';
    if (icon) {
      row.appendChild(icon);
      row.appendChild(document.createTextNode(' '));
    }
    row.appendChild(document.createTextNode(values[i]));
  });
}

function setPlainList(list, values) {
  const rows = qsa('li', list);
  rows.forEach((row, i) => {
    if (values[i] !== undefined) row.textContent = values[i];
  });
}

function bindButtons(buttons, onChange) {
  if (!buttons.length) return;
  buttons.forEach((button, index) => {
    button.setAttribute('aria-selected', String(button.classList.contains('is-active')));
    button.addEventListener('click', () => {
      activateByIndex(buttons, index);
      onChange(index);
    });
    button.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault();
      const delta = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1;
      const next = (index + delta + buttons.length) % buttons.length;
      buttons[next].focus();
      buttons[next].click();
    });
  });
}

function bindClickableRows(rows, onChange) {
  rows.forEach((row, index) => {
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.setAttribute('aria-pressed', String(row.classList.contains('is-active') || row.classList.contains('seo-problem__item--active')));
    const run = () => {
      rows.forEach((item, i) => {
        const active = i === index;
        item.classList.toggle('is-active', active);
        item.classList.toggle('seo-problem__item--active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      onChange(index);
    };
    row.addEventListener('click', run);
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        run();
      }
    });
  });
}

const SERVICE_DATA = {
  'facebook-ads-page': {
    problem: [
      ['Số lượng hội thoại cao nhưng nhiều người chỉ hỏi giá hoặc không đúng nhu cầu.', 'Kiểm tra thông điệp, câu hỏi mở đầu và quy trình phản hồi.', ['HanoiWeb kiểm tra chất lượng hội thoại', 'Ưu tiên thông điệp và câu hỏi sàng lọc', 'Đầu ra: kịch bản hội thoại rõ nhu cầu']],
      ['Chi phí tăng có thể đến từ tệp bão hòa, cạnh tranh hoặc creative giảm hiệu quả.', 'Đối chiếu CPM, CTR, tần suất và hiệu quả theo từng nhóm quảng cáo.', ['HanoiWeb kiểm tra biến động chỉ số', 'Ưu tiên nhóm còn dư địa mở rộng', 'Đầu ra: danh sách điều chỉnh ngân sách']],
      ['Creative mỏi khiến quảng cáo nhanh mất khả năng thu hút.', 'Kiểm tra tần suất, mẫu thắng và lịch sản xuất nội dung mới.', ['HanoiWeb kiểm tra creative theo giai đoạn', 'Ưu tiên góc nội dung có tín hiệu tốt', 'Đầu ra: kế hoạch test creative mới']]
    ],
    goals: [
      ['Mục tiêu / 01','Tạo hội thoại có ngữ cảnh, không chỉ kéo số lượng tin nhắn','Phù hợp với dịch vụ cần tư vấn nhanh. Nội dung phải giúp khách hàng hiểu đủ trước khi nhắn và tạo dữ liệu để đội sale phân loại.',['Creative nêu rõ vấn đề và giá trị nhận được','Câu hỏi mở đầu giúp sàng lọc nhu cầu','Theo dõi chi phí trên hội thoại đủ điều kiện']],
      ['Mục tiêu / 02','Thu lead đủ thông tin để đội sale có thể xử lý ngay','Phù hợp với sản phẩm cần thu thông tin trước khi tư vấn hoặc báo giá.',['Form ngắn nhưng đủ trường quan trọng','Nêu rõ lợi ích khi để lại thông tin','Đo tỷ lệ lead đủ điều kiện']],
      ['Mục tiêu / 03','Tối ưu quảng cáo theo doanh số thay vì chỉ theo lượt nhấp','Phù hợp với mô hình có website hoặc quy trình bán hàng đo được kết quả.',['Kết nối Pixel/CAPI theo khả năng','Tách nhóm sản phẩm và biên lợi nhuận','Theo dõi ROAS và giá trị đơn hàng']],
      ['Mục tiêu / 04','Mở rộng độ phủ đúng nhóm khách hàng mục tiêu','Phù hợp với thương hiệu cần tăng nhận biết trước khi chạy chuyển đổi.',['Xác định tệp và khu vực ưu tiên','Đồng bộ thông điệp nhận diện','Theo dõi reach, frequency và video view']]
    ],
    work: [
      ['Chiến lược & cấu trúc campaign','Phân tích sản phẩm, thị trường, khách hàng và mục tiêu trước khi phân bổ ngân sách.',['Brief mục tiêu và KPI','Bản đồ campaign','Kế hoạch ngân sách thử nghiệm'],'facebook-content.webp'],
      ['Nội dung & creative','Xây dựng góc truyền thông, định dạng và biến thể creative theo từng tệp khách hàng.',['Content angle theo hành trình','Checklist hình ảnh/video','Kế hoạch A/B creative'],'facebook-content.webp'],
      ['Thiết lập tài khoản','Rà quyền quản trị, tài sản, phương thức thanh toán và cấu trúc Business Manager.',['Checklist quyền truy cập','Cấu trúc tài sản quảng cáo','Quy ước đặt tên'],'facebook-hero.webp'],
      ['Meta Pixel & đo lường','Thiết lập các tín hiệu đo lường cần thiết để đọc đúng hiệu quả sau click.',['Rà Pixel và sự kiện','UTM theo campaign','Kiểm tra dữ liệu chuyển đổi'],'google-analytics.webp'],
      ['Theo dõi & tối ưu','Theo dõi chỉ số theo ngày và tối ưu theo tín hiệu đủ dữ liệu, tránh thay đổi cảm tính.',['Theo dõi CPM/CTR/CPA','Điều chỉnh ngân sách có kiểm soát','Ghi log thay đổi'],'google-analytics.webp'],
      ['Báo cáo & đề xuất','Tổng hợp kết quả theo mục tiêu kinh doanh và đề xuất vòng thử nghiệm tiếp theo.',['Báo cáo KPI','Phân tích nhóm thắng/thua','Đề xuất kế hoạch kỳ sau'],'google-team.webp']
    ]
  },
  'tiktok-ads-page': {
    problem: [
      ['Creative mỏi, tệp hạn chế hoặc chiến dịch chưa đủ biến thể.', 'Kiểm tra tần suất, mẫu thắng và lịch làm mới.', ['HanoiWeb kiểm tra creative và tệp', 'Ưu tiên mẫu có tín hiệu giữ chân', 'Đầu ra: lịch test video mới']],
      ['Người xem lướt qua quá nhanh vì hook chưa đủ rõ.', 'Kiểm tra 1-3 giây đầu, ngữ cảnh video và mức khớp với landing page.', ['HanoiWeb kiểm tra hook và retention', 'Ưu tiên thông điệp dễ hiểu ngay', 'Đầu ra: danh sách hook cần thử']],
      ['CPA tăng sau giai đoạn đầu có thể do creative, tệp hoặc tracking.', 'So sánh CPM, CTR, CVR và dữ liệu Pixel theo từng nhóm.', ['HanoiWeb kiểm tra dữ liệu theo giai đoạn', 'Ưu tiên nhóm có chất lượng chuyển đổi', 'Đầu ra: kế hoạch tối ưu CPA']]
    ],
    goals: [
      ['Mục tiêu / 01','Đưa người xem đến landing page với kỳ vọng được đặt đúng từ video','Phù hợp khi website có nội dung tốt và cần tăng lượt truy cập có chủ đích.',['Hook bám sát nội dung trang đích','Tốc độ tải và trải nghiệm mobile','Theo dõi hành vi sau click']],
      ['Mục tiêu / 02','Thu lead từ video ngắn bằng thông điệp dễ hiểu và form gọn','Phù hợp với dịch vụ cần tư vấn, đăng ký hoặc nhận báo giá.',['CTA xuất hiện đúng thời điểm','Form ít trường và rõ lợi ích','Đo lead đủ điều kiện']],
      ['Mục tiêu / 03','Tối ưu nội dung và quảng cáo theo hành vi mua hàng','Phù hợp khi sản phẩm đã có tín hiệu bán và cần mở rộng doanh số.',['Video bám pain point sản phẩm','Theo dõi Add to Cart/Purchase','Đánh giá CPA và ROAS']],
      ['Mục tiêu / 04','Tăng nhận diện bằng nội dung có khả năng giữ nhịp xem','Phù hợp với thương hiệu cần xây độ phủ và ghi nhớ.',['Tập trung 3 giây đầu','Nhận diện thương hiệu nhất quán','Theo dõi reach và completion rate']]
    ],
    work: [
      ['Setup tài khoản & nền tảng','Kiểm tra tài khoản quảng cáo, quyền truy cập, phương thức thanh toán và cấu trúc chiến dịch.',['Checklist tài khoản','Cấu trúc campaign','Quy ước đặt tên'],'tiktok-team.webp'],
      ['Nghiên cứu trend & insight','Phân tích nội dung đang được quan tâm và hành vi xem của nhóm khách hàng mục tiêu.',['Danh sách insight','Kho hook tham khảo','Định hướng format video'],'tiktok-team.webp'],
      ['Sản xuất video creative','Xây dựng kịch bản ngắn, bối cảnh và CTA phù hợp ngôn ngữ TikTok.',['Kịch bản video','Danh sách shot cần quay','Bộ creative để test'],'tiktok-hero.webp'],
      ['Thiết lập & A/B testing','Phân nhóm biến thể và test có kiểm soát để biết yếu tố nào tạo kết quả.',['Ma trận test','Ngân sách thử nghiệm','Tiêu chí giữ/tắt mẫu'],'tiktok-team.webp'],
      ['Pixel, form & đo lường','Rà Pixel, sự kiện, lead form và UTM để dữ liệu sau click có thể đối chiếu.',['Checklist tracking','Đối chiếu sự kiện','Báo cáo dữ liệu lỗi'],'google-analytics.webp'],
      ['Tối ưu & báo cáo KPI','Theo dõi dữ liệu, tối ưu theo vòng và báo cáo theo KPI đã thống nhất.',['Báo cáo tuần','Danh sách tối ưu','Kế hoạch creative tiếp theo'],'google-analytics.webp']
    ]
  },
  'zalo-ads-page': {
    problem: [
      ['Nội dung và điểm đến chưa giải thích đủ lợi ích hoặc CTA không rõ.', 'Kiểm tra creative, trang đích và lời mời hành động.', ['HanoiWeb kiểm tra luồng sau click', 'Ưu tiên nội dung giải thích lợi ích', 'Đầu ra: CTA và điểm đến rõ ràng']],
      ['OA có người quan tâm nhưng nội dung rời rạc làm giảm tương tác.', 'Kiểm tra hồ sơ OA, lịch nội dung và các điểm chạm sau quảng cáo.', ['HanoiWeb kiểm tra nội dung OA', 'Ưu tiên lịch chăm sóc đều', 'Đầu ra: kế hoạch nội dung OA']],
      ['Quảng cáo chậm duyệt hoặc bị từ chối cần rà lại nội dung và chính sách.', 'Kiểm tra creative, landing page, ngành hàng và thông tin tài khoản.', ['HanoiWeb kiểm tra nguyên nhân từ chối', 'Ưu tiên sửa thành phần vi phạm', 'Đầu ra: checklist gửi duyệt lại']]
    ],
    goals: [
      ['Mục tiêu / 01','Xây tệp người quan tâm để duy trì nội dung và chăm sóc','Phù hợp với thương hiệu cần điểm chạm dài hạn trên Zalo.',['Trang OA đầy đủ thông tin','Lịch nội dung sau quảng cáo','CTA dẫn về hội thoại hoặc ưu đãi']],
      ['Mục tiêu / 02','Tạo hội thoại với khách hàng trong đúng khu vực và nhu cầu','Phù hợp với dịch vụ địa phương cần tư vấn nhanh.',['Thông điệp rõ khu vực phục vụ','Mẫu tin nhắn mở đầu','Theo dõi chi phí hội thoại']],
      ['Mục tiêu / 03','Đưa khách về Website hoặc Shop với điểm đến phù hợp','Phù hợp khi cần giới thiệu sản phẩm, bảng giá hoặc danh mục chi tiết.',['Đồng bộ creative với landing page','CTA rõ hành động','Đo lượt truy cập sau click']],
      ['Mục tiêu / 04','Thu Lead Form với dữ liệu đủ cho đội bán hàng','Phù hợp với dịch vụ cần thông tin liên hệ trước khi tư vấn.',['Form ngắn và rõ mục đích','Trường dữ liệu phục vụ phân loại','Quy trình phản hồi sau lead']]
    ],
    work: [
      ['Setup OA & tài khoản quảng cáo','Kiểm tra OA, tài khoản Ads, phương thức thanh toán và quyền quản trị.',['Checklist tài khoản','Cấu trúc tài sản','Lịch triển khai'],'zalo-business.webp'],
      ['Content marketing','Lập kế hoạch nội dung OA và thông điệp quảng cáo theo hành trình khách hàng.',['Lịch nội dung','Nhóm chủ đề','CTA theo mục tiêu'],'zalo-local.webp'],
      ['Thiết kế ảnh & creative','Chuẩn hóa kích thước, thông điệp và biến thể creative phù hợp từng vị trí quảng cáo.',['Bộ key visual','Biến thể creative','Checklist duyệt nội dung'],'zalo-business.webp'],
      ['Quản lý chiến dịch','Theo dõi ngân sách, nhóm quảng cáo và lịch chạy để giữ hiệu suất ổn định.',['Theo dõi ngân sách','Log tối ưu','Kiểm tra phân phối'],'google-analytics.webp'],
      ['Chatbot & remarketing','Thiết kế luồng chăm sóc lại với nhóm đã tương tác khi hạ tầng cho phép.',['Phân nhóm tệp','Kịch bản chăm sóc','Điểm kích hoạt remarketing'],'zalo-local.webp'],
      ['Báo cáo & tối ưu','Tổng hợp dữ liệu theo mục tiêu và đề xuất thay đổi cho chu kỳ tiếp theo.',['Báo cáo tuần','KPI theo kênh','Đề xuất tối ưu'],'google-analytics.webp']
    ]
  },
  'google-ads-page': {
    problem: [
      ['Chi phí tăng có thể đến từ cạnh tranh, điểm chất lượng hoặc cấu trúc chiến dịch.', 'Kiểm tra lịch sử thay đổi, từ khóa, bidding, thiết bị, vị trí và khung giờ.', ['HanoiWeb kiểm tra lịch sử và dữ liệu', 'Ưu tiên nhóm có tiềm năng chuyển đổi', 'Đầu ra: danh sách tối ưu theo mức độ']],
      ['Chi phí mỗi chuyển đổi tăng cần tách nguyên nhân từ traffic và trang đích.', 'So sánh CPC, tỷ lệ chuyển đổi, Search Terms và dữ liệu theo thiết bị.', ['HanoiWeb kiểm tra CPC và CVR', 'Ưu tiên từ khóa/nhóm quảng cáo hiệu quả', 'Đầu ra: kế hoạch giảm CPA']],
      ['Truy vấn không phù hợp làm ngân sách bị phân tán.', 'Rà Search Terms, match type, negative keyword và mức khớp với dịch vụ.', ['HanoiWeb kiểm tra truy vấn thực tế', 'Ưu tiên bổ sung negative keyword', 'Đầu ra: bộ truy vấn cần giữ và loại']]
    ],
    system: [
      ['Setup','Cấu trúc tài khoản dễ quản lý và dễ tối ưu','Phân chia campaign theo mục tiêu, dịch vụ, khu vực và mức độ ưu tiên. Quyền sở hữu tài khoản được bàn giao đầy đủ.',['Campaign và ad group theo nhu cầu thực','Thiết lập ngân sách và bidding ban đầu','Remarketing cơ bản khi đủ điều kiện']],
      ['Search','Từ khóa và truy vấn được quản lý theo ý định tìm kiếm','Tách nhóm từ khóa theo nhu cầu và kiểm tra Search Terms để hạn chế ngân sách rơi vào truy vấn kém liên quan.',['Nhóm từ khóa theo intent','Negative keyword định kỳ','Đối chiếu truy vấn với landing page']],
      ['Creative','Quảng cáo và tài sản bám đúng lời hứa trên trang đích','Thông điệp, sitelink, callout và asset được tổ chức để người tìm kiếm hiểu nhanh giá trị.',['RSA theo nhóm dịch vụ','Asset phù hợp mục tiêu','Theo dõi chất lượng quảng cáo']],
      ['Landing page','Landing page phải tiếp nối đúng kỳ vọng từ quảng cáo','Kiểm tra nội dung, tốc độ, form và CTA để giảm thất thoát sau click.',['Thông điệp khớp keyword','Tối ưu CTA và form','Theo dõi conversion theo trang']]
    ],
    work: [
      ['Chốt mục tiêu và điều kiện thành công',['Thực hiện:|Ngành, sản phẩm, khu vực và ngân sách','Phụ trách:|Account + Ads Specialist','Đầu ra:|Brief chiến dịch đã xác nhận'],'google-team.webp'],
      ['Audit tài khoản & website',['Thực hiện:|Rà cấu trúc cũ, Search Terms, tracking và landing page','Phụ trách:|Ads Specialist + Technical','Đầu ra:|Danh sách vấn đề và mức ưu tiên'],'google-analytics.webp'],
      ['Xây cấu trúc chiến dịch',['Thực hiện:|Nhóm campaign, ad group, keyword và ngân sách','Phụ trách:|Google Ads Specialist','Đầu ra:|Bản đồ cấu trúc tài khoản'],'google-team.webp'],
      ['Cài tracking',['Thực hiện:|GA4, conversion, UTM và kiểm tra sự kiện','Phụ trách:|Tracking Specialist','Đầu ra:|Checklist đo lường đã kiểm tra'],'google-analytics.webp'],
      ['Vận hành & thử nghiệm',['Thực hiện:|Theo dõi truy vấn, bidding, asset và landing page','Phụ trách:|Account + Ads Specialist','Đầu ra:|Log tối ưu và kết quả test'],'google-analytics.webp'],
      ['Báo cáo & mở rộng',['Thực hiện:|Đối chiếu KPI, chi phí và dữ liệu chuyển đổi','Phụ trách:|Account Lead','Đầu ra:|Báo cáo và kế hoạch mở rộng'],'google-team.webp']
    ],
    pricing: [
      ['Gói Setup','1.500.000đ','Khởi tạo và bàn giao tài khoản.',['05 loại chiến dịch tùy chọn','01 chiến dịch remarketing','Conversion cơ bản','Hướng dẫn vận hành'],1],
      ['Gói Care','Theo ngân sách','Theo dõi và tối ưu định kỳ cho tài khoản đang vận hành.',['Theo dõi Search Terms','Tối ưu bidding và ngân sách','Kiểm tra conversion','Báo cáo định kỳ'],2],
      ['Gói Special','Liên hệ','Vận hành nâng cao theo KPI và phạm vi riêng.',['Cấu trúc full funnel','Tracking nâng cao','Tối ưu hàng ngày theo KPI','Báo cáo chi tiết'],3]
    ]
  },
  'webcare-page': {
    problem: [
      ['Lỗi nhỏ kéo dài có thể làm mất khách hàng và ảnh hưởng quảng cáo.', 'Kiểm tra tốc độ, giao diện mobile, form, link, plugin và nhật ký lỗi.', ['HanoiWeb kiểm tra kỹ thuật', 'Ưu tiên lỗi ảnh hưởng người dùng', 'Đầu ra: backlog xử lý']],
      ['Nội dung cũ làm website thiếu đồng bộ và giảm độ tin cậy.', 'Rà thông tin dịch vụ, hình ảnh, CTA, bài viết và dữ liệu liên hệ.', ['HanoiWeb kiểm tra nội dung lỗi thời', 'Ưu tiên trang có traffic/khách hàng', 'Đầu ra: lịch cập nhật nội dung']],
      ['Traffic tự nhiên thấp cần kiểm tra cả kỹ thuật và nội dung.', 'Rà index, Onpage, internal link và các trang đang có tiềm năng tìm kiếm.', ['HanoiWeb kiểm tra SEO nền tảng', 'Ưu tiên trang có cơ hội tăng trưởng', 'Đầu ra: danh sách tối ưu SEO']]
    ],
    system: [
      ['Technical care','Giữ website hoạt động ổn định trên các thiết bị chính','Rà soát lỗi giao diện, plugin, mã nguồn, form, đường dẫn và các điểm gãy cản trở trải nghiệm.',['Kiểm tra định kỳ và xử lý lỗi','Tối ưu tốc độ theo phạm vi','Kiểm tra sau mỗi lần cập nhật']],
      ['Backup & bảo mật','Duy trì bản sao và giảm rủi ro khi website có sự cố','Kiểm tra lịch backup, quyền truy cập, plugin và các điểm cần theo dõi bảo mật.',['Backup theo phạm vi gói','Kiểm tra quyền quản trị','Theo dõi lỗi bất thường']],
      ['Content care','Giữ nội dung và hình ảnh đồng bộ với hoạt động doanh nghiệp','Cập nhật sản phẩm, dịch vụ, banner, thông tin liên hệ và bài viết theo kế hoạch.',['Lịch cập nhật nội dung','Tối ưu hình ảnh trước khi đăng','Kiểm tra liên kết sau cập nhật']],
      ['SEO & hiệu suất','Theo dõi các tín hiệu SEO và hiệu suất quan trọng','Rà index, Onpage, tốc độ và dữ liệu truy cập để ưu tiên thay đổi có tác động.',['Theo dõi trang quan trọng','Kiểm tra lỗi SEO cơ bản','Báo cáo và đề xuất cải thiện']]
    ],
    work: [
      ['Kiểm tra & lập backlog','Rà lỗi, dữ liệu, nội dung cần cập nhật và công việc tồn.','care-review.webp'],
      ['Xử lý kỹ thuật ưu tiên','Khắc phục lỗi ảnh hưởng trải nghiệm, form, tốc độ và tính ổn định.','care-developer.webp'],
      ['Cập nhật nội dung & SEO','Cập nhật nội dung theo kế hoạch, kiểm tra Onpage và liên kết sau chỉnh sửa.','google-team.webp'],
      ['Báo cáo & kế hoạch tháng mới','Tổng hợp công việc đã xử lý, chỉ số cần theo dõi và backlog cho chu kỳ tiếp theo.','care-review.webp']
    ]
  },
  'hosting-page': {
    work: [
      ['Xác định đầy đủ trước khi chuyển',['Kiểm kê:|Tên miền, DNS, hosting, email, SSL','Quyền truy cập:|Registrar, control panel và mã nguồn','Đầu ra:|Danh sách tài sản số'],'domain-search.webp'],
      ['Tạo bản backup an toàn trước thay đổi',['Thực hiện:|Sao lưu mã nguồn, database và cấu hình liên quan','Kiểm tra:|Khả năng tải và đọc bản backup','Đầu ra:|Bản sao dữ liệu trước chuyển'],'hosting-racks.webp'],
      ['Chuẩn bị DNS và kế hoạch chuyển đổi',['Thực hiện:|Ghi nhận bản ghi DNS hiện tại và TTL','Kiểm tra:|Website, email và dịch vụ xác thực','Đầu ra:|Kế hoạch đổi DNS có thời gian'],'hosting-engineer.webp'],
      ['Chuyển dữ liệu có kiểm soát',['Thực hiện:|Mã nguồn, database, SSL và cấu hình hosting','Kiểm tra:|Log lỗi và quyền file','Đầu ra:|Website chạy trên hạ tầng mới'],'hosting-racks.webp'],
      ['Kiểm tra Website và Email',['Thực hiện:|Form, link, SSL, email và tác vụ quan trọng','Kiểm tra:|Desktop/mobile và dữ liệu gửi nhận','Đầu ra:|Checklist nghiệm thu'],'hosting-engineer.webp'],
      ['Bàn giao và theo dõi sau chuyển',['Thực hiện:|Bàn giao quyền quản trị và tài liệu','Theo dõi:|DNS, uptime và lỗi phát sinh','Đầu ra:|Thông tin vận hành rõ ràng'],'hosting-racks.webp']
    ],
    pricing: [
      ['Hosting Tiết kiệm','62.500đ','/tháng',['SSD 3GB','CPU 1 Core · RAM 1GB','Băng thông không giới hạn','ZeroSSL · Backup hàng ngày','CloudLinux & LiteSpeed'],1],
      ['Hosting Cơ bản','80.000đ','/tháng',['SSD 5GB','CPU 2 Core · RAM 2GB','Băng thông không giới hạn','ZeroSSL · Backup hàng ngày','CloudLinux & LiteSpeed'],2],
      ['Hosting Nâng cao','145.000đ','/tháng',['SSD 20GB','CPU 4 Core · RAM 4GB','Băng thông không giới hạn','Backup hàng ngày','CloudLinux & LiteSpeed'],3],
      ['Hosting Cao cấp','320.000đ','/tháng',['SSD 20GB*','CPU 4 Core* · RAM 4GB*','Tài nguyên theo phạm vi','Backup hàng ngày','CloudLinux & LiteSpeed'],4],
      ['Hosting Tùy chỉnh','Liên hệ','',['Tài nguyên theo nhu cầu website','Cấu hình theo lưu lượng thực tế','Phương án backup riêng','Tư vấn chuyển dữ liệu','Theo dõi sau bàn giao'],0]
    ]
  },
  'writing-seo-page': {
    problem: [
      ['Người đọc đến trang nhưng không biết bước tiếp theo.','Nội dung có thể trả lời đúng câu hỏi nhưng thiếu bằng chứng, CTA hoặc đường dẫn đến dịch vụ liên quan.',['Kiểm tra ý định của truy vấn đang tạo traffic.','Bổ sung case study, bằng chứng và CTA theo ngữ cảnh.','Tạo internal link đến trang dịch vụ cần chuyển đổi.']],
      ['Từ khóa không lên có thể do nội dung chưa đủ sâu hoặc trang chưa đúng intent.','Đối chiếu SERP, cấu trúc bài, độ phủ chủ đề và liên kết nội bộ.',['Kiểm tra intent và đối thủ đang xếp hạng.','Bổ sung phần nội dung còn thiếu.','Tối ưu internal link và Onpage.']],
      ['Nội dung trùng lặp làm các trang cạnh tranh lẫn nhau.','Rà chủ đề, URL, heading và mức độ giống nhau giữa các bài.',['Nhóm các bài cùng intent.','Hợp nhất hoặc phân vai rõ từng URL.','Cập nhật internal link sau xử lý.']],
      ['Bài viết sai intent khó tạo thứ hạng và chuyển đổi ổn định.','Kiểm tra người dùng đang muốn tìm hiểu, so sánh, mua hay liên hệ.',['Phân loại lại Search Intent.','Điều chỉnh outline và CTA.','Đo lại traffic và chuyển đổi sau cập nhật.']]
    ],
    control: [
      ['Nghiên cứu chủ đề và nhu cầu tìm kiếm','Phân tích thị trường, truy vấn liên quan, đối thủ và hành trình ra quyết định trước khi đặt bút viết.','Bộ từ khóa + Search Intent','SEO Strategist','seo-process-offpage.png'],
      ['Xây outline theo intent và hành trình đọc','Sắp xếp heading, câu hỏi và bằng chứng theo thứ tự giúp người đọc hiểu và ra quyết định.','Outline + Content Brief','SEO Strategist','seo-process-content.png'],
      ['Viết bài theo brief và giọng thương hiệu','Triển khai nội dung rõ ràng, có ví dụ và CTA phù hợp với ngữ cảnh tìm kiếm.','Bản nháp nội dung','Content Writer','seo-process-keyword.png'],
      ['Biên tập và fact-check','Kiểm tra logic, dữ kiện, giọng văn, trùng lặp và khả năng đọc trước khi xuất bản.','Bản biên tập hoàn chỉnh','Editor','seo-process-audit.png'],
      ['Tối ưu Onpage trước khi đăng','Rà title, meta, heading, internal link, ảnh và schema theo phạm vi.','Bản Onpage hoàn chỉnh','SEO Specialist','seo-process-onpage.png'],
      ['Đo lường và cập nhật theo dữ liệu','Theo dõi index, từ khóa, traffic và chuyển đổi để xác định nội dung cần cập nhật.','Báo cáo + danh sách cập nhật','SEO Strategist','seo-process-offpage.png']
    ],
    workflow: [
      ['Audit nội dung hiện có','Kiểm tra bài cũ, chủ đề bị trùng, khoảng trống nội dung và trang đang có khả năng tạo chuyển đổi.','1-2 ngày','Bản đồ nội dung hiện trạng'],
      ['Nghiên cứu từ khóa & đối thủ','Phân nhóm truy vấn theo intent và xác định các chủ đề cần ưu tiên theo mục tiêu kinh doanh.','1-2 ngày','Bộ từ khóa và Search Intent'],
      ['Lên cấu trúc bài','Xây outline, heading, điểm bằng chứng và CTA trước khi triển khai bản nháp.','0,5-1 ngày','Outline đã duyệt'],
      ['Viết nháp','Triển khai nội dung theo brief, ưu tiên rõ nghĩa, hữu ích và đúng giọng thương hiệu.','1-2 ngày','Bản nháp hoàn chỉnh'],
      ['Biên tập & Onpage','Fact-check, chỉnh giọng văn, tối ưu heading, liên kết, ảnh và metadata.','0,5-1 ngày','Bản sẵn sàng đăng'],
      ['Đăng & đo','Xuất bản, kiểm tra hiển thị, index và theo dõi tín hiệu để lên kế hoạch cập nhật.','Theo chu kỳ','Báo cáo hiệu suất nội dung']
    ]
  }
};

export function initServiceInteractions() {
  const pageClass = Array.from(document.body.classList).find((name) => SERVICE_DATA[name]);
  if (!pageClass) return;
  const data = SERVICE_DATA[pageClass];

  const prefixMap = {
    'facebook-ads-page': 'facebook-ads',
    'tiktok-ads-page': 'tiktok-ads',
    'zalo-ads-page': 'zalo-ads',
    'google-ads-page': 'google-ads',
    'webcare-page': 'webcare',
    'hosting-page': 'hosting',
    'writing-seo-page': 'writing-seo'
  };
  const prefix = prefixMap[pageClass];

  if (data.problem) {
    const rows = qsa(`.${prefix}-problem__item`);
    const detail = qs(`.${prefix}-problem__detail`);
    if (rows.length && detail) {
      bindClickableRows(rows, (index) => {
        const item = data.problem[index];
        if (!item) return;
        const title = qs('h3', detail);
        const desc = qs('p', detail);
        const list = qs('ul', detail);
        if (title) title.textContent = item[0];
        if (desc) desc.textContent = item[1];
        if (list) setIconList(list, item[2]);
      });
    }
  }

  if (data.goals) {
    const buttons = qsa(`.${prefix}-goals__tabs button`);
    const panel = qs(`.${prefix}-goals__panel`);
    if (buttons.length && panel) {
      bindButtons(buttons, (index) => {
        const item = data.goals[index];
        if (!item) return;
        const eyebrow = qs(`.${prefix}-goals__eyebrow`, panel);
        const title = qs('h3', panel);
        const lead = qs(`.${prefix}-goals__lead`, panel);
        const list = qs('ul', panel);
        if (eyebrow) eyebrow.textContent = item[0];
        if (title) title.textContent = item[1];
        if (lead) lead.textContent = item[2];
        if (list) setPlainList(list, item[3]);
      });
    }
  }

  if (data.system) {
    const buttons = qsa(`.${prefix}-system__tabs button`);
    const panel = qs(`.${prefix}-system__panel`);
    if (buttons.length && panel) {
      bindButtons(buttons, (index) => {
        const item = data.system[index];
        if (!item) return;
        const eyebrow = qs(`.${prefix}-system__eyebrow`, panel);
        const title = qs('h3', panel);
        const lead = qs(`.${prefix}-system__lead`, panel);
        const list = qs('ul', panel);
        if (eyebrow) eyebrow.textContent = item[0];
        if (title) title.textContent = item[1];
        if (lead) lead.textContent = item[2];
        if (list) setPlainList(list, item[3]);
      });
    }
  }

  if (data.work) {
    const buttons = qsa(`.${prefix}-work__tabs button`);
    const panel = qs(`.${prefix}-work__panel`);
    if (buttons.length && panel) {
      bindButtons(buttons, (index) => {
        const item = data.work[index];
        if (!item) return;

        if (pageClass === 'webcare-page') {
          const title = qs('h3', panel);
          const desc = qs('p', panel);
          const img = qs('img', panel);
          if (title) title.textContent = item[0];
          if (desc) desc.textContent = item[1];
          if (img) {
            img.src = `/assets/images/banner/${item[2]}`;
            img.alt = item[0];
          }
          return;
        }

        const title = qs('h3', panel);
        if (title) title.textContent = item[0];

        if (['google-ads-page', 'hosting-page'].includes(pageClass)) {
          const list = qs('ul', panel);
          if (list) {
            const rows = qsa('li', list);
            rows.forEach((row, i) => {
              if (!item[1][i]) return;
              const [label, value] = item[1][i].split('|');
              row.innerHTML = `<strong>${label}</strong><br />${value}`;
            });
          }
          const img = qs('img', panel);
          if (img) {
            img.src = `/assets/images/banner/${item[2]}`;
            img.alt = item[0];
          }
        } else {
          const lead = qs(`.${prefix}-work__lead`, panel);
          const list = qs('ul', panel);
          if (lead) lead.textContent = item[1];
          if (list) setPlainList(list, item[2]);
          const img = qs('img', panel);
          if (img) {
            img.src = `/assets/images/banner/${item[3]}`;
            img.alt = item[0];
          }
        }
      });
    }
  }

  if (pageClass === 'writing-seo-page' && data.control) {
    const buttons = qsa('.writing-seo-control__tabs button');
    const panel = qs('.writing-seo-control__body');
    bindButtons(buttons, (index) => {
      const item = data.control[index];
      if (!item || !panel) return;
      const title = qs('.writing-seo-control__content h3', panel);
      const desc = qs('.writing-seo-control__content > p', panel);
      const meta = qsa('.writing-seo-control__meta strong', panel);
      const img = qs('.writing-seo-control__icon img', panel);
      if (title) title.textContent = item[0];
      if (desc) desc.textContent = item[1];
      if (meta[0]) meta[0].textContent = item[2];
      if (meta[1]) meta[1].textContent = item[3];
      if (img) {
        img.src = `/assets/images/icon/${item[4]}`;
        img.alt = item[0];
      }
    });
  }

  if (pageClass === 'writing-seo-page' && data.workflow) {
    const buttons = qsa('.writing-seo-workflow__tabs button');
    const panel = qs('.writing-seo-workflow__panel');
    bindButtons(buttons, (index) => {
      const item = data.workflow[index];
      if (!item || !panel) return;
      const title = qs('.writing-seo-workflow__copy h3', panel);
      const desc = qs('.writing-seo-workflow__copy p', panel);
      const stats = qsa('.writing-seo-workflow__stats strong', panel);
      if (title) title.textContent = item[0];
      if (desc) desc.textContent = item[1];
      if (stats[0]) stats[0].textContent = item[2];
      if (stats[1]) stats[1].textContent = item[3];
    });
  }

  if (pageClass === 'google-ads-page' && data.pricing) {
    const buttons = qsa('.google-ads-pricing__switch button');
    const card = qs('.google-ads-pricing__featured');
    const table = qs('.google-ads-pricing__table');
    bindButtons(buttons, (index) => {
      const item = data.pricing[index];
      if (!item || !card) return;
      const title = qs('h3', card);
      const price = qs('.google-ads-pricing__price', card);
      const desc = qs('.google-ads-pricing__desc', card);
      const list = qs('ul', card);
      if (title) title.textContent = item[0];
      if (price) price.textContent = item[1];
      if (desc) desc.textContent = item[2];
      if (list) setPlainList(list, item[3]);
      if (table) {
        qsa('.is-featured', table).forEach((el) => el.classList.remove('is-featured'));
        qsa('tr', table).forEach((row) => {
          const cells = Array.from(row.children);
          if (cells[item[4]]) cells[item[4]].classList.add('is-featured');
        });
      }
    });
  }

  if (pageClass === 'hosting-page' && data.pricing) {
    const buttons = qsa('.hosting-pricing__tabs button');
    const card = qs('.hosting-plan-card');
    const table = qs('.hosting-pricing__table');
    bindButtons(buttons, (index) => {
      const item = data.pricing[index];
      if (!item || !card) return;
      const title = qs('h3', card);
      const price = qs('.hosting-plan-card__price', card);
      const list = qs('ul', card);
      if (title) title.textContent = item[0];
      if (price) price.innerHTML = `${item[1]}${item[2] ? `<span>${item[2]}</span>` : ''}`;
      if (list) setPlainList(list, item[3]);
      if (table) {
        qsa('.is-featured', table).forEach((el) => el.classList.remove('is-featured'));
        if (item[4] > 0) {
          qsa('tr', table).forEach((row) => {
            const cells = Array.from(row.children);
            if (cells[item[4]]) cells[item[4]].classList.add('is-featured');
          });
        }
      }
    });
  }
}

/* --------------------- Form liên hệ dạng front-end --------------------- */
function showSiteToast(message) {
  let toast = qs('.site-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'site-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(showSiteToast.timer);
  showSiteToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 3600);
}

/* Số điện thoại VN: bỏ hết ký tự không phải số rồi kiểm tra bắt đầu bằng 0,
   theo sau 9-10 chữ số (tổng 10-11 số) — vẫn cho phép người dùng gõ có
   khoảng trắng/dấu gạch theo placeholder gợi ý (*09xx xxx xxx*). */
function validatePhoneField(field) {
  const digits = field.value.replace(/\D/g, '');
  const isEmpty = !field.value.trim();
  const isValid = /^0\d{9,10}$/.test(digits);
  field.setCustomValidity(!isEmpty && !isValid ? 'Vui lòng nhập số điện thoại hợp lệ, ví dụ: 0912345678.' : '');
}

export function initContactForms() {
  const ignored = '.faq-search__bar, .blog-search__form, .hosting-domain__search, [role="search"]';
  qsa('form').filter((form) => !form.matches(ignored)).forEach((form) => {
    const submit = qs('[type="submit"]', form);
    if (!submit) return;

    const text = qsa('input, textarea, select', form);
    text.forEach((field, index) => {
      if (!field.name) field.name = `${form.className.split(' ')[0] || 'form'}-${index + 1}`;
      if (field.tagName === 'INPUT' && field.type === 'tel') {
        if (!field.getAttribute('autocomplete')) field.setAttribute('autocomplete', 'tel');
        field.required = true;
        field.addEventListener('input', () => validatePhoneField(field));
        field.addEventListener('blur', () => validatePhoneField(field));
      }
      if (field.tagName === 'INPUT' && field.type === 'email') {
        field.required = true;
        if (!field.getAttribute('autocomplete')) field.setAttribute('autocomplete', 'email');
      }
      if (field.tagName === 'INPUT' && field.type === 'text' && /nguyễn văn a|họ (và )?tên|full ?name/i.test(field.placeholder || '')) {
        field.required = true;
        if (!field.getAttribute('autocomplete')) field.setAttribute('autocomplete', 'name');
      }
      if (field.tagName === 'SELECT') {
        const firstOption = field.options[0];
        // Option đầu dạng "Chọn ..." là placeholder chưa phải lựa chọn thật —
        // bỏ trống value để required có thể chặn khi người dùng chưa đổi lựa chọn.
        if (firstOption && /^chọn\b/i.test(firstOption.textContent.trim())) {
          firstOption.value = '';
          field.required = true;
        }
      }
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      qsa('input[type="tel"]', form).forEach(validatePhoneField);
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      showSiteToast('Cảm ơn bạn! HanoiWeb đã ghi nhận thông tin và sẽ liên hệ tư vấn sớm.');
      form.reset();
    });
  });
}

/* --------------------- Tra cứu tên miền demo --------------------- */
export function initDomainSearchDemo() {
  const form = qs('.hosting-domain__search');
  if (!form) return;
  const input = qs('input', form);
  if (!input) return;
  form.removeAttribute('onsubmit');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const domain = input.value
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .replace(/\s+/g, '');
    if (!domain || !domain.includes('.')) {
      showSiteToast('Vui lòng nhập tên miền đầy đủ, ví dụ: tencongty.vn');
      input.focus();
      return;
    }
    input.value = domain;
    showSiteToast(`Đã ghi nhận tên miền ${domain}. Công cụ hiện là bản demo; HanoiWeb sẽ xác nhận trạng thái đăng ký khi tư vấn.`);
  });
}

/* --------------------- Liên kết chưa có trang chi tiết --------------------- */
export function initPlaceholderLinks() {
  qsa('a[href="#"]').forEach((link) => {
    if (link.matches('.pagination__item, .nav-link, .mobile-nav-link')) return;
    if (link.closest('.footer__social')) return;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showSiteToast('Nội dung chi tiết đang được cập nhật. Bạn có thể liên hệ HanoiWeb để được tư vấn ngay.');
    });
  });
}

/* --------------------- Chọn vấn đề ở trang SEO Hà Nội --------------------- */
export function initSeoProblemInteraction() {
  const rows = qsa('.seo-problem__item');
  const detail = qs('.seo-problem__detail');
  if (!rows.length || !detail) return;

  const data = [
    ['Traffic không đúng ý định sẽ không tạo ra doanh thu.',
      'Chúng tôi tách truy vấn tìm hiểu khỏi truy vấn mua hàng, sau đó ưu tiên trang dịch vụ và nội dung có khả năng dẫn khách tới hành động.',
      ['Phân loại truy vấn theo hành trình', 'Đối chiếu landing page với nhu cầu', 'Đo chuyển đổi theo từng nhóm từ khóa']],
    ['Từ khóa chưa tăng thường cần nhìn lại intent, cấu trúc trang và độ phủ chủ đề.',
      'HanoiWeb đối chiếu kết quả tìm kiếm, nội dung hiện có, internal link và các trang đang cạnh tranh lẫn nhau.',
      ['Kiểm tra Search Intent và đối thủ', 'Rà Onpage và cụm nội dung', 'Ưu tiên URL có khả năng tăng hạng']],
    ['SEO Local cần tín hiệu địa phương nhất quán thay vì chỉ thêm từ khóa Hà Nội.',
      'Chúng tôi rà hồ sơ doanh nghiệp, nội dung theo khu vực, thông tin liên hệ và điểm chạm giúp khách hàng địa phương chuyển đổi.',
      ['Kiểm tra tín hiệu địa phương', 'Đồng bộ thông tin doanh nghiệp', 'Theo dõi chuyển đổi từ khu vực Hà Nội']]
  ];

  bindClickableRows(rows, (index) => {
    const item = data[index];
    if (!item) return;
    const title = qs('h3', detail);
    const desc = qs('p', detail);
    const list = qs('ul', detail);
    if (title) title.textContent = item[0];
    if (desc) desc.textContent = item[1];
    if (list) setIconList(list, item[2]);
  });
}

/* --------------------- Phân trang tĩnh: phản hồi rõ ràng khi chưa có dữ liệu trang sau --------------------- */
export function initStaticPaginationFeedback() {
  qsa('nav.pagination').forEach((nav) => {
    if (nav.closest('.blog-layout') || nav.closest('.post-related')) return;

    const items = qsa('.pagination__item', nav);
    const arrows = qsa('.pagination__arrow', nav);
    if (!items.length) return;

    const setPage = (index) => {
      const safeIndex = Math.max(0, Math.min(index, items.length - 1));
      items.forEach((item, i) => item.classList.toggle('is-active', i === safeIndex));
      if (arrows[0]) arrows[0].disabled = safeIndex === 0;
      if (arrows[1]) arrows[1].disabled = safeIndex === items.length - 1;
      showSiteToast(`Trang ${safeIndex + 1}: nội dung chi tiết đang được cập nhật, giao diện hiện giữ nguyên dữ liệu mẫu.`);
    };

    items.forEach((item, index) => {
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.addEventListener('click', (event) => {
        event.preventDefault();
        setPage(index);
      });
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setPage(index);
        }
      });
    });

    if (arrows[0]) {
      arrows[0].addEventListener('click', () => {
        const current = items.findIndex((item) => item.classList.contains('is-active'));
        if (current > 0) setPage(current - 1);
      });
    }
    if (arrows[1]) {
      arrows[1].addEventListener('click', () => {
        const current = items.findIndex((item) => item.classList.contains('is-active'));
        if (current < items.length - 1) setPage(current + 1);
      });
    }
  });
}
