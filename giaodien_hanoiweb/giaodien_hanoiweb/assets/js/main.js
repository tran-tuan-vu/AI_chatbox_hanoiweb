import {
  initHeaderHeight,
  initHeroSlider,
  initHeaderScroll,
  initMobileNav,
  initDropdowns,
  initFaqAccordion,
  initReveal,
  initCounters,
  initPartnerLogoTrim,
  initBlogPagination,
  initStandardsDiagram,
  initPolicyTabs,
  initSupportTabs,
  initFaqFilter,
  initJobsFilter,
  initArticleToc,
  initRelatedPagination,
  initServiceInteractions,
  initContactForms,
  initDomainSearchDemo,
  initPlaceholderLinks,
  initSeoProblemInteraction,
  initStaticPaginationFeedback,
} from './components.js';
import { loadComponent } from './utils.js';
import { initChatbotWidget } from './chatbot-widget.js';

async function init() {
  await Promise.all([
    loadComponent('#site-header', '/components/header.html'),
    loadComponent('#site-footer', '/components/footer.html'),
  ]);

  initHeaderHeight();
  initHeroSlider();
  initHeaderScroll();
  initMobileNav();
  initDropdowns();
  initFaqAccordion();
  initReveal();
  initCounters();
  initPartnerLogoTrim();
  initBlogPagination();
  initStandardsDiagram();
  initPolicyTabs();
  initSupportTabs();
  initFaqFilter();
  initJobsFilter();
  initArticleToc();
  initRelatedPagination();
  initServiceInteractions();
  initContactForms();
  initDomainSearchDemo();
  initPlaceholderLinks();
  initSeoProblemInteraction();
  initStaticPaginationFeedback();
  initChatbotWidget();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
