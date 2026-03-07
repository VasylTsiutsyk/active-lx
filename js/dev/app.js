import { B as Bowser, C as Choices, L as Loader, S as Swiper, N as Navigation, P as Pagination, E as EffectCoverflow } from "./vendor.min.js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) return;
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) processPreload(link);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") continue;
      for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
    }
  }).observe(document, {
    childList: true,
    subtree: true
  });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep) return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const SELECTORS$1 = {
  ROOT: document.documentElement,
  BODY: document.body
};
const CLASSES$1 = {
  ACTIVE: "_active",
  HIDDEN: "_hidden",
  SCROLLED: "_scrolled",
  SHOW: "_show",
  LOADED: "_loaded",
  PC: "pc",
  TOUCH: "touch",
  DISABLE_SCROLL: "disable-scroll"
};
function isWebp() {
  function testWebP(callback) {
    const webP = new Image();
    webP.onload = webP.onerror = function() {
      callback(webP.height === 2);
    };
    webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
  }
  testWebP((support) => {
    if (support) {
      SELECTORS$1.BODY.classList.add("webp");
    } else {
      SELECTORS$1.BODY.classList.add("no-webp");
    }
  });
}
function isMobile() {
  const browser = Bowser.getParser(window.navigator.userAgent);
  const platform = browser.getPlatformType(true);
  const isTouchDevice = platform === "mobile" || platform === "tablet";
  const hasTouchSupport = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isTouch = isTouchDevice || hasTouchSupport;
  if (isTouch) {
    SELECTORS$1.BODY.classList.remove(CLASSES$1.PC);
    SELECTORS$1.BODY.classList.add(CLASSES$1.TOUCH);
  } else {
    SELECTORS$1.BODY.classList.remove(CLASSES$1.TOUCH);
    SELECTORS$1.BODY.classList.add(CLASSES$1.PC);
  }
  return isTouch;
}
function disableScroll() {
  const pagePosition = window.scrollY;
  SELECTORS$1.BODY.classList.add(CLASSES$1.DISABLE_SCROLL);
  SELECTORS$1.BODY.dataset.position = pagePosition;
  SELECTORS$1.BODY.style.top = `${-pagePosition}px`;
}
function enableScroll() {
  const pagePosition = parseInt(SELECTORS$1.BODY.dataset.position, 10);
  SELECTORS$1.BODY.style.top = "auto";
  SELECTORS$1.BODY.classList.remove(CLASSES$1.DISABLE_SCROLL);
  window.scroll({ top: pagePosition, left: 0 });
  SELECTORS$1.BODY.removeAttribute("data-position");
}
const BREAKPOINT_QUERY = "(max-width: 61.99rem)";
const DATA_STATE = "data-state";
const UI_EVENTS = { SCROLL_LOCK: "ui:scroll-lock" };
const ROOT = SELECTORS$1?.ROOT || document.documentElement;
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");
function getFocusable(container) {
  return container ? Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)) : [];
}
function trapFocus(container, e) {
  const nodes = getFocusable(container);
  if (!nodes.length || e.key !== "Tab") return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  if (!nodes.includes(document.activeElement)) {
    e.preventDefault();
    first.focus();
    return;
  }
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
function setAriaExpanded(btn, expanded, labels = {
  open: "Open Menu",
  close: "Close Menu"
}) {
  if (!btn) return;
  btn.setAttribute("aria-expanded", String(expanded));
  btn.setAttribute("aria-label", expanded ? labels.close : labels.open);
}
function ensureRoleDialog(el, labelledById = null, describedById = null) {
  if (!el) return;
  if (!el.hasAttribute("role")) el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  if (labelledById) el.setAttribute("aria-labelledby", labelledById);
  if (describedById) el.setAttribute("aria-describedby", describedById);
}
function initMenu() {
  const menu = document.querySelector("[data-menu]");
  if (!menu) return;
  const menuBtn = menu.querySelector("[data-menu-burger]");
  const menuBody = menu.querySelector("[data-menu-body]");
  const menuOverlay = menu.querySelector("[data-menu-overlay]");
  const main = document.querySelector("main");
  if (!menuBtn || !menuBody) return;
  if (!menuBody.id) menuBody.id = "site-menu";
  menuBtn.setAttribute("aria-controls", menuBody.id);
  ensureRoleDialog(menuBody);
  setAriaExpanded(menuBtn, false);
  const isOpen2 = () => menuBody.getAttribute(DATA_STATE) === "open";
  function onKeydown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      setMenuOpen(false);
      return;
    }
    if (isOpen2()) trapFocus(menuBody, e);
  }
  function setMenuOpen(open) {
    if (open) {
      ROOT.setAttribute("data-scroll-locked", "true");
      ROOT.dispatchEvent(
        new CustomEvent(UI_EVENTS.SCROLL_LOCK, { detail: { locked: true } })
      );
      menuBody.removeAttribute("inert");
      main?.setAttribute("inert", "");
      disableScroll();
    } else {
      menuBody.setAttribute("inert", "");
      main?.removeAttribute("inert");
      enableScroll();
      setTimeout(() => {
        ROOT.removeAttribute("data-scroll-locked");
        ROOT.dispatchEvent(
          new CustomEvent(UI_EVENTS.SCROLL_LOCK, { detail: { locked: false } })
        );
      }, 0);
    }
    menuBody.setAttribute(DATA_STATE, open ? "open" : "closed");
    menuBtn.classList.toggle(CLASSES$1.ACTIVE, open);
    menuBody.classList.toggle(CLASSES$1.ACTIVE, open);
    setAriaExpanded(menuBtn, open);
    if (open) {
      const focusables = getFocusable(menuBody);
      (focusables[0] || menuBody).focus();
      document.addEventListener("keydown", onKeydown, true);
    } else {
      document.removeEventListener("keydown", onKeydown, true);
    }
  }
  menuBody.addEventListener("click", (e) => {
    const arrow = e.target.closest("[data-menu-arrow]");
    if (arrow && menuBody.contains(arrow)) {
      e.preventDefault();
      e.stopPropagation();
      const parent = arrow.parentElement;
      parent?.classList.toggle(CLASSES$1.ACTIVE);
      const expanded = parent?.classList.contains(CLASSES$1.ACTIVE);
      arrow.setAttribute("aria-expanded", String(expanded));
      return;
    }
    const item = e.target.closest("[data-menu-item]");
    if (item && !item.closest("[data-menu-noclose]")) {
      setMenuOpen(false);
    }
  });
  menuBtn.addEventListener("click", (e) => {
    e.preventDefault();
    setMenuOpen(!isOpen2());
  });
  if (menuOverlay) {
    menuOverlay.addEventListener("pointerdown", () => setMenuOpen(false));
  } else {
    document.addEventListener("pointerdown", (e) => {
      if (!isOpen2()) return;
      if (!menuBody.contains(e.target) && e.target !== menuBtn) {
        setMenuOpen(false);
      }
    });
  }
  function setupMenu(isMobile2) {
    if (isMobile2) {
      menuBody.setAttribute("inert", "");
      setMenuOpen(false);
    } else {
      setMenuOpen(false);
      menuBody.removeAttribute("inert");
    }
  }
  const mql = window.matchMedia(BREAKPOINT_QUERY);
  const applyMql = () => setupMenu(mql.matches);
  applyMql();
  if (mql.addEventListener) mql.addEventListener("change", applyMql);
  else mql.addListener(applyMql);
}
function initHeader(options = {}) {
  const {
    selector = ".header",
    isScrolled = true,
    isHidden = true,
    hideThreshold = 12,
    revealTopOffset = 8,
    respectReducedMotion = true,
    throttleDelay = 50
  } = options;
  const header = document.querySelector(selector);
  if (!header) return;
  const setHeaderHeight = (h) => ROOT.style.setProperty("--header-height", `${h}px`);
  const ro = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const h = Math.round(entry.target.getBoundingClientRect().height);
      setHeaderHeight(h);
    }
  });
  ro.observe(header);
  let lastY = window.scrollY;
  let scrollLocked = ROOT.hasAttribute("data-scroll-locked");
  let forcedScrolled = false;
  ROOT.addEventListener(UI_EVENTS.SCROLL_LOCK, (e) => {
    scrollLocked = !!e.detail?.locked;
    if (scrollLocked) {
      forcedScrolled = (e.detail?.y ?? window.scrollY) > 0;
      header.classList.toggle(CLASSES$1.SCROLLED, forcedScrolled);
      header.classList.remove(CLASSES$1.HIDDEN);
    } else {
      forcedScrolled = false;
      requestAnimationFrame(onScroll);
    }
  });
  const prefersReduced = respectReducedMotion && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (isScrolled) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          header.classList.toggle(CLASSES$1.SCROLLED, !entry.isIntersecting);
        });
      },
      { rootMargin: `-${header.offsetHeight}px 0px 0px 0px`, threshold: 0 }
    );
    io.observe(header);
  }
  let timeoutId = null;
  function throttledScroll() {
    if (timeoutId) return;
    timeoutId = setTimeout(() => {
      onScroll();
      timeoutId = null;
    }, throttleDelay);
  }
  function onScroll() {
    if (scrollLocked) {
      if (isScrolled) header.classList.toggle(CLASSES$1.SCROLLED, forcedScrolled);
      return;
    }
    const y = window.scrollY;
    if (isHidden && !prefersReduced) {
      const delta = y - lastY;
      const pastTop = y > revealTopOffset;
      if (pastTop && Math.abs(delta) > hideThreshold) {
        if (delta > 0) header.classList.add(CLASSES$1.HIDDEN);
        else header.classList.remove(CLASSES$1.HIDDEN);
      }
      if (!pastTop) header.classList.remove(CLASSES$1.HIDDEN);
    }
    lastY = y;
  }
  window.addEventListener("scroll", throttledScroll, { passive: true });
  setHeaderHeight(header.offsetHeight);
}
const STATUSES = {
  IN_PROGRESS: "in progress",
  DONE: "done"
};
const PAGES = [
  {
    title: "Home",
    href: "/",
    status: STATUSES.IN_PROGRESS
  },
  {
    title: "Company",
    href: "/company.html",
    status: STATUSES.DONE
  },
  {
    title: "Store",
    href: "/store.html",
    status: STATUSES.DONE
  },
  {
    title: "Store Inner",
    href: "/store-inner.html",
    status: STATUSES.DONE
  },
  {
    title: "Blog",
    href: "/blog.html",
    status: STATUSES.DONE
  },
  {
    title: "Blog Inner",
    href: "/blog-inner.html",
    status: STATUSES.DONE
  },
  {
    title: "News",
    href: "/news.html",
    status: STATUSES.DONE
  },
  {
    title: "News Inner",
    href: "/news-inner.html",
    status: STATUSES.DONE
  },
  {
    title: "Events",
    href: "/events.html",
    status: STATUSES.DONE
  },
  {
    title: "Events Inner",
    href: "/events-inner.html",
    status: STATUSES.DONE
  },
  {
    title: "Contacts",
    href: "/contacts.html",
    status: STATUSES.DONE
  },
  {
    title: "Vacancies",
    href: "/vacancies.html",
    status: STATUSES.DONE
  },
  {
    title: "Error",
    href: "/error.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Products",
    href: "/admin-products.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Product Inner",
    href: "/admin-products-inner.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Subscriptions",
    href: "/admin-subscriptions.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Payments",
    href: "/admin-payments.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Settings",
    href: "/admin-settings.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Login",
    href: "/admin-login.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Register",
    href: "/admin-register.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Register Create",
    href: "/admin-register-create.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Register Confirm",
    href: "/admin-register-confirm.html",
    status: STATUSES.DONE
  },
  {
    title: "Admin Password New",
    href: "/admin-password-new.html",
    status: STATUSES.DONE
  }
];
const MODALS = [
  {
    title: "Custom Order",
    target: "modalCustomOrder"
  },
  {
    title: "Purchase Success",
    target: "modalPurchaseSuccess"
  },
  {
    title: "Demo Order",
    target: "modalDemoOrder"
  },
  {
    title: "Demo Success",
    target: "modalDemoSuccess"
  },
  {
    title: "Vacancy Details",
    target: "modalVacancyDetails"
  }
];
const ADMIN_MODALS = [
  {
    title: "Admin Demo Access",
    target: "modalDemoAccess"
  },
  {
    title: "Admin Change Password",
    target: "modalChangePassword"
  },
  {
    title: "Admin Logout Confirm",
    target: "modalLogoutConfirm"
  },
  {
    title: "Admin Package Emails",
    target: "modalPackageEmails"
  },
  {
    title: "Admin Product Info",
    target: "productInfo",
    triggerType: "popup"
  }
];
function createSitemapItem(page) {
  const { title, href, status } = page;
  const listItem = document.createElement("li");
  const link = document.createElement("a");
  link.href = href;
  link.textContent = `${title} - ${status}`;
  link.classList.add(
    status === STATUSES.DONE ? "text-success" : "text-warning"
  );
  listItem.append(link);
  return listItem;
}
function createModalItem(modal) {
  const { title, target, triggerType = "modal" } = modal;
  const listItem = document.createElement("li");
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = title;
  button.classList.add("btn");
  button.setAttribute("data-variant", "gray");
  if (triggerType === "popup") {
    button.setAttribute("data-popup-trigger", target);
  } else {
    button.setAttribute("data-modal-target", target);
  }
  listItem.append(button);
  return listItem;
}
function initSitemap(pages = PAGES, modals = MODALS, adminModals = ADMIN_MODALS) {
  const listElement = document.querySelector(".pages-list");
  if (!listElement) return;
  const fragment = document.createDocumentFragment();
  pages.forEach((page) => {
    fragment.append(createSitemapItem(page));
  });
  listElement.replaceChildren(fragment);
  const modalsListElement = document.querySelector(".modals-list");
  if (!modalsListElement) return;
  const modalsFragment = document.createDocumentFragment();
  modals.forEach((modal) => {
    modalsFragment.append(createModalItem(modal));
  });
  modalsListElement.replaceChildren(modalsFragment);
  const adminModalsListElement = document.querySelector(".admin-modals-list");
  if (!adminModalsListElement) return;
  const adminModalsFragment = document.createDocumentFragment();
  adminModals.forEach((modal) => {
    adminModalsFragment.append(createModalItem(modal));
  });
  adminModalsListElement.replaceChildren(adminModalsFragment);
}
function initSelects() {
  const selects = document.querySelectorAll("[data-select]");
  if (!selects.length) return;
  selects.forEach((select) => {
    const searchAttr = select.dataset.selectSearch;
    const placeholderAttr = select.dataset.selectPlaceholder;
    const removeBtnAttr = select.dataset.selectRemoveButton;
    const placeholder = placeholderAttr || "Select an option";
    const choices = new Choices(select, {
      searchEnabled: !!searchAttr,
      itemSelectText: "",
      placeholderValue: placeholder,
      shouldSort: false,
      allowHTML: false,
      removeItemButton: removeBtnAttr === "true",
      duplicateItemsAllowed: false,
      placeholder: true,
      searchPlaceholderValue: "Search…",
      renderSelectedChoices: "auto"
    });
    select._choicesInstance = choices;
  });
}
function initMaps() {
  const { maps } = window;
  if (!maps) return;
  [...maps].forEach((mapData) => {
    const mapEl = document.querySelector(mapData.mapEl);
    if (mapEl) {
      const API_KEY = mapData.apiKey;
      const options = {};
      const loader = new Loader(API_KEY, options);
      loader.load().then((google) => {
        const map = new google.maps.Map(mapEl, {
          center: mapData.center,
          ...mapData.options
        });
        mapData.markers.forEach((markerData) => {
          const marker = new google.maps.Marker({
            ...markerData
          });
          marker.setMap(map);
        });
      });
    }
  });
}
function initContentTabs(scope = document, { syncHash = true, singleOpen = true, initialId = null, onChange = null } = {}) {
  const roots = Array.from(
    scope instanceof Element || scope instanceof Document ? scope.querySelectorAll("[data-ct]") : document.querySelectorAll("[data-ct]")
  );
  const controllers = [];
  roots.forEach((root) => {
    const ctId = root.getAttribute("data-ct") || "";
    const qAll = (sel) => Array.from(root.querySelectorAll(sel));
    const tabs = qAll("[data-ct-tab]");
    const toggles = qAll("[data-ct-toggle]");
    const panels = qAll("[data-ct-panel]");
    if (!tabs.length && !toggles.length) return;
    const byId = (arr, id) => arr.find(
      (el) => (el.dataset.ctTab ?? el.dataset.ctToggle ?? el.dataset.ctPanel) === id
    );
    function hideAll() {
      panels.forEach((p) => {
        p.hidden = true;
      });
      tabs.forEach((t) => {
        t.setAttribute("aria-selected", "false");
        t.tabIndex = -1;
      });
      toggles.forEach((tg) => tg.setAttribute("aria-expanded", "false"));
    }
    function activate(id, { allowCollapse = false } = {}) {
      const panel = byId(panels, id);
      const tab = byId(tabs, id);
      const toggle = byId(toggles, id);
      const isOpen2 = panel && !panel.hidden;
      if (allowCollapse && toggle && isOpen2) {
        panel.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
        if (tab) {
          tab.setAttribute("aria-selected", "false");
          tab.tabIndex = -1;
        }
        return;
      }
      if (tabs.length || singleOpen) {
        hideAll();
      }
      if (panel) panel.hidden = false;
      if (tab) {
        tabs.forEach((t) => {
          t.setAttribute("aria-selected", "false");
          t.tabIndex = -1;
        });
        tab.setAttribute("aria-selected", "true");
        tab.tabIndex = 0;
      }
      if (toggle) {
        if (singleOpen)
          toggles.forEach((tg) => tg.setAttribute("aria-expanded", "false"));
        toggle.setAttribute("aria-expanded", "true");
      }
      const detail = { ctId, id, root };
      root.dispatchEvent(new CustomEvent("ct:change", { detail }));
      if (typeof onChange === "function") onChange(detail);
    }
    let initial = initialId || tabs.find((t) => t.getAttribute("aria-selected") === "true")?.dataset.ctTab || toggles.find((t) => t.getAttribute("aria-expanded") === "true")?.dataset.ctToggle || panels.find((p) => !p.hidden)?.dataset.ctPanel || panels[0]?.dataset.ctPanel;
    if (initial) activate(initial);
    root.addEventListener("click", (e) => {
      const tabBtn = e.target.closest("[data-ct-tab]");
      if (tabBtn && root.contains(tabBtn)) {
        e.preventDefault();
        const id = tabBtn.dataset.ctTab;
        activate(id);
        tabBtn.focus();
        return;
      }
      const toggleBtn = e.target.closest("[data-ct-toggle]");
      if (toggleBtn && root.contains(toggleBtn)) {
        e.preventDefault();
        const id = toggleBtn.dataset.ctToggle;
        activate(id, { allowCollapse: true });
        return;
      }
    });
    if (tabs.length) {
      root.addEventListener("keydown", (e) => {
        const current = document.activeElement;
        if (!current || !current.matches("[data-ct-tab]")) return;
        const list = tabs;
        const i = list.indexOf(current);
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          const next = list[(i + 1) % list.length];
          activate(next.dataset.ctTab);
          next.focus();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          const prev = list[(i - 1 + list.length) % list.length];
          activate(prev.dataset.ctTab);
          prev.focus();
        } else if (e.key === "Home") {
          e.preventDefault();
          const first = list[0];
          activate(first.dataset.ctTab);
          first.focus();
        } else if (e.key === "End") {
          e.preventDefault();
          const last = list[list.length - 1];
          activate(last.dataset.ctTab);
          last.focus();
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
        }
      });
    }
    if (syncHash && location.hash.startsWith("#ct=")) {
      const id = decodeURIComponent(location.hash.slice(4));
      if (byId(panels, id)) activate(id);
    }
    controllers.push({ root, activate });
  });
  return controllers;
}
function initSwiper(selector, config) {
  const el = document.querySelector(selector);
  if (!el) return;
  return new Swiper(el, config);
}
function initSliders() {
  initSwiper("#swiperCompany", {
    modules: [Navigation, Pagination],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1,
    spaceBetween: 16,
    navigation: {
      prevEl: "#swiperCompanyPrev",
      nextEl: "#swiperCompanyNext"
    },
    pagination: {
      el: "#swiperCompanyPagination",
      type: "fraction"
    }
  });
  initSwiper("#swiperProducts", {
    modules: [Navigation, Pagination],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1,
    spaceBetween: 12,
    navigation: {
      nextEl: "#swiperProductsPrev",
      prevEl: "#swiperProductsNext"
    },
    pagination: {
      el: "#swiperProductsPagination",
      type: "fraction"
    },
    breakpoints: {
      992: {
        spaceBetween: 20,
        slidesPerView: 2
      }
    }
  });
  initSwiper("#swiperCases", {
    modules: [Navigation, Pagination],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1,
    spaceBetween: 12,
    navigation: {
      prevEl: "#swiperCasesPrev",
      nextEl: "#swiperCasesNext"
    },
    pagination: {
      el: "#swiperCasesPagination",
      type: "fraction"
    },
    breakpoints: {
      992: {
        spaceBetween: 20,
        slidesPerView: 2
      },
      1280: {
        spaceBetween: 20,
        slidesPerView: 3.25
      }
    }
  });
  initSwiper("#swiperStorePartners", {
    modules: [Navigation, Pagination],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1.85,
    spaceBetween: 8,
    centeredSlides: true,
    loop: true,
    navigation: {
      prevEl: "#swiperStorePartnersPrev",
      nextEl: "#swiperStorePartnersNext"
    },
    pagination: {
      el: "#swiperStorePartnersPagination",
      type: "fraction"
    },
    breakpoints: {
      560: {
        spaceBetween: 12,
        slidesPerView: 2.5
      },
      768: {
        spaceBetween: 12,
        slidesPerView: 3.25
      },
      992: {
        spaceBetween: 16,
        slidesPerView: 4
      },
      1280: {
        spaceBetween: 20,
        slidesPerView: 5
      }
    }
  });
  initSwiper("#swiperStoreProducts", {
    modules: [Navigation, Pagination],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1,
    spaceBetween: 16,
    navigation: {
      prevEl: "#swiperStoreProductsPrev",
      nextEl: "#swiperStoreProductsNext"
    },
    pagination: {
      el: "#swiperStoreProductsPagination",
      type: "fraction"
    }
  });
  initSwiper("#swiperReviews", {
    modules: [Navigation, Pagination],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1,
    spaceBetween: 16,
    navigation: {
      prevEl: "#swiperReviewsPrev",
      nextEl: "#swiperReviewsNext"
    },
    pagination: {
      el: "#swiperReviewsPagination",
      type: "fraction"
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 16
      },
      992: {
        slidesPerView: 3,
        spaceBetween: 20
      }
    }
  });
  initSwiper("#swiperPublications", {
    modules: [Navigation, Pagination],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1,
    spaceBetween: 16,
    navigation: {
      prevEl: "#swiperPublicationsPrev",
      nextEl: "#swiperPublicationsNext"
    },
    pagination: {
      el: "#swiperPublicationsPagination",
      type: "fraction"
    },
    breakpoints: {
      768: {
        slidesPerView: 2,
        spaceBetween: 16
      },
      992: {
        slidesPerView: 3,
        spaceBetween: 20
      }
    }
  });
  initSwiper("#swiperAdminPromos", {
    modules: [Navigation, Pagination],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1,
    spaceBetween: 16,
    navigation: {
      prevEl: "#swiperAdminPromosPrev",
      nextEl: "#swiperAdminPromosNext"
    },
    pagination: {
      el: "#swiperAdminPromosPagination",
      type: "fraction"
    }
  });
  initSwiper("#swiperAdminAuthReviews", {
    modules: [Navigation, Pagination, EffectCoverflow],
    direction: "horizontal",
    speed: 800,
    slidesPerView: 1.1,
    spaceBetween: 12,
    centeredSlides: true,
    effect: "coverflow",
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 300,
      modifier: 1,
      slideShadows: false
    },
    navigation: {
      prevEl: "#swiperAdminAuthReviewsPrev",
      nextEl: "#swiperAdminAuthReviewsNext"
    },
    pagination: {
      el: "#swiperAdminAuthReviewsPagination",
      type: "fraction"
    },
    breakpoints: {
      slidesPerView: 1.25
    }
  });
}
function initPopups() {
  document.querySelectorAll("[data-popup-trigger]").forEach((trigger) => {
    const popupId = trigger.getAttribute("data-popup-trigger");
    const popup = popupId ? document.querySelector(`[data-popup="${popupId}"]`) : null;
    trigger.setAttribute(
      "aria-expanded",
      popup && popup.classList.contains(CLASSES$1.ACTIVE) ? "true" : "false"
    );
    trigger.addEventListener("click", handlePopupTriggerClick);
  });
  document.querySelectorAll("[data-popup-close]").forEach((btn) => {
    btn.addEventListener("click", handlePopupCloseClick);
  });
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("click", handleDocumentClick);
}
function handlePopupTriggerClick(e) {
  e.preventDefault();
  const popupId = this.getAttribute("data-popup-trigger");
  if (!popupId) return;
  const popup = document.querySelector(`[data-popup="${popupId}"]`);
  if (!popup) return;
  if (popup.classList.contains(CLASSES$1.ACTIVE)) {
    closePopup(popup);
    return;
  }
  openPopup(popupId, this);
}
function setTriggerExpanded(popupId, expanded) {
  if (!popupId) return;
  document.querySelectorAll(`[data-popup-trigger="${popupId}"]`).forEach(
    (trigger) => trigger.setAttribute("aria-expanded", expanded ? "true" : "false")
  );
}
function openPopup(popupId, triggerElement) {
  const popup = document.querySelector(`[data-popup="${popupId}"]`);
  if (popup) {
    popup.classList.add(CLASSES$1.ACTIVE);
    popup.setAttribute("aria-hidden", "false");
    setTriggerExpanded(popupId, true);
    if (triggerElement) {
      popup.dataset.triggerId = triggerElement.id || "";
    }
    const focusable = popup.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
    } else {
      popup.setAttribute("tabindex", "-1");
      popup.focus();
    }
  }
}
function closePopup(popup) {
  if (popup) {
    popup.classList.remove(CLASSES$1.ACTIVE);
    popup.setAttribute("aria-hidden", "true");
    const popupId = popup.getAttribute("data-popup");
    setTriggerExpanded(popupId, false);
    const { triggerId } = popup.dataset;
    if (triggerId) {
      const trigger = document.getElementById(triggerId);
      if (trigger) {
        trigger.focus();
      }
    }
  }
}
function handlePopupCloseClick(e) {
  e.preventDefault();
  const popup = this.closest("[data-popup]._active");
  if (popup) {
    closePopup(popup);
  }
}
function handleKeyDown(e) {
  if (e.key === "Escape" || e.keyCode === 27) {
    const activePopups = document.querySelectorAll("[data-popup]._active");
    if (activePopups.length > 0) {
      const lastPopup = activePopups[activePopups.length - 1];
      closePopup(lastPopup);
    }
  }
}
function handleDocumentClick(event) {
  const activePopups = document.querySelectorAll("[data-popup]._active");
  activePopups.forEach((popup) => {
    if (!popup.contains(event.target) && !event.target.closest("[data-popup-trigger]")) {
      closePopup(popup);
    }
  });
}
class DynamicAdapt {
  constructor(type = "max") {
    this.type = type;
    this.daClassname = "_dynamic_adapt_";
    this.objects = [];
    this.mediaQueries = [];
  }
  init() {
    this.nodes = document.querySelectorAll("[data-da]");
    this.nodes.forEach((node) => {
      const dataArray = node.dataset.da.trim().split(",");
      const object = {
        element: node,
        parent: node.parentNode,
        destination: document.querySelector(dataArray[0].trim()),
        breakpoint: dataArray[1] ? parseInt(dataArray[1].trim(), 10) : 767,
        place: dataArray[2] ? dataArray[2].trim() : "last",
        index: Array.from(node.parentNode.children).indexOf(node)
      };
      if (object.destination) this.objects.push(object);
    });
    this.sortObjects();
    this.setMediaQueries();
  }
  sortObjects() {
    this.objects.sort((a, b) => {
      if (a.breakpoint === b.breakpoint) {
        const order = { first: -1, last: 1 };
        return (order[a.place] || a.place) - (order[b.place] || b.place);
      }
      return this.type === "min" ? a.breakpoint - b.breakpoint : b.breakpoint - a.breakpoint;
    });
  }
  setMediaQueries() {
    this.mediaQueries = [...new Set(this.objects.map((obj) => obj.breakpoint))];
    this.mediaQueries.forEach((breakpoint) => {
      const matchMedia = window.matchMedia(
        `(${this.type}-width: ${breakpoint}px)`
      );
      const objectsFilter = this.objects.filter(
        (obj) => obj.breakpoint === breakpoint
      );
      matchMedia.addEventListener("change", () => {
        this.mediaHandler(matchMedia, objectsFilter);
      });
      this.mediaHandler(matchMedia, objectsFilter);
    });
  }
  mediaHandler(matchMedia, objects) {
    objects.forEach((obj) => {
      if (matchMedia.matches) {
        this.moveTo(obj);
      } else {
        this.moveBack(obj);
      }
    });
  }
  moveTo({ place, element, destination }) {
    element.classList.add(this.daClassname);
    if (place === "last" || place >= destination.children.length) {
      destination.append(element);
    } else if (place === "first") {
      destination.prepend(element);
    } else {
      destination.children[place].before(element);
    }
  }
  moveBack({ parent, element, index }) {
    if (element.classList.contains(this.daClassname)) {
      element.classList.remove(this.daClassname);
      parent.children[index] ? parent.children[index].before(element) : parent.append(element);
    }
  }
}
const SEL = {
  GROUP: "[data-accordion-group]",
  ITEM: "[data-accordion]",
  BTN: "[data-accordion-btn]",
  CONTENT: "[data-accordion-content]"
};
let uidCounter = 0;
let outsideClickBound = false;
const uid = (p = "acc") => `${p}-${Math.random().toString(36).slice(2, 8)}-${uidCounter++}`;
function isOpen(item) {
  return item.getAttribute("data-state") === "open";
}
function setState(item, state) {
  item.setAttribute("data-state", state);
}
function qs(el, sel) {
  return el.querySelector(sel);
}
function qsa(el, sel) {
  return Array.from(el.querySelectorAll(sel));
}
function wireA11y(item, btn, panel) {
  if (!btn.id) btn.id = uid("acc-btn");
  if (!panel.id) panel.id = uid("acc-panel");
  btn.setAttribute("aria-controls", panel.id);
  btn.setAttribute("aria-expanded", "false");
  btn.type = btn.type || "button";
  if (!panel.hasAttribute("role")) panel.setAttribute("role", "region");
  panel.setAttribute("aria-labelledby", btn.id);
  panel.setAttribute("aria-hidden", "true");
}
function revealPanel(panel) {
  panel.hidden = false;
  panel.removeAttribute("inert");
  panel.setAttribute("aria-hidden", "false");
}
function concealPanelAfterTransition(item, panel) {
  const onEnd = (e) => {
    if (e.target !== panel) return;
    panel.hidden = true;
    panel.setAttribute("inert", "");
    panel.setAttribute("aria-hidden", "true");
    setState(item, "closed");
    panel.removeEventListener("transitionend", onEnd);
  };
  panel.addEventListener("transitionend", onEnd, { once: true });
}
function openAccordion(item, btn, panel) {
  if (isOpen(item)) return;
  revealPanel(panel);
  setState(item, "open");
  btn.setAttribute("aria-expanded", "true");
}
function closeAccordion(item, btn, panel) {
  if (!isOpen(item)) return;
  setState(item, "closing");
  btn.setAttribute("aria-expanded", "false");
  concealPanelAfterTransition(item, panel);
}
function toggleAccordion(item, { showOnlyOne }) {
  const btn = qs(item, SEL.BTN);
  const panel = qs(item, SEL.CONTENT);
  if (!btn || !panel) return;
  const group = item.closest(SEL.GROUP) || document;
  if (!isOpen(item)) {
    if (showOnlyOne) {
      qsa(group, `${SEL.ITEM}[data-state="open"]`).forEach((openItem) => {
        if (openItem === item) return;
        const b = qs(openItem, SEL.BTN);
        const p = qs(openItem, SEL.CONTENT);
        closeAccordion(openItem, b, p);
      });
    }
    openAccordion(item, btn, panel);
  } else {
    closeAccordion(item, btn, panel);
  }
}
function setupRovingFocus(groupEl) {
  const buttons = qsa(groupEl, SEL.BTN);
  if (!buttons.length) return;
  buttons.forEach((b) => b.setAttribute("tabindex", "-1"));
  (buttons[0] || buttons[0]).setAttribute("tabindex", "0");
  const moveFocus = (delta) => {
    const list = qsa(groupEl, SEL.BTN);
    const currentIndex = list.findIndex(
      (b) => b.getAttribute("tabindex") === "0"
    );
    let nextIndex = currentIndex + delta;
    if (nextIndex < 0) nextIndex = list.length - 1;
    if (nextIndex >= list.length) nextIndex = 0;
    list.forEach((b) => b.setAttribute("tabindex", "-1"));
    const target = list[nextIndex];
    target.setAttribute("tabindex", "0");
    target.focus({ preventScroll: false });
  };
  groupEl.addEventListener("keydown", (e) => {
    const isBtn = e.target.matches(SEL.BTN);
    if (!isBtn) return;
    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        moveFocus(1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(-1);
        break;
      case "Home":
        e.preventDefault();
        {
          const list = qsa(groupEl, SEL.BTN);
          list.forEach((b) => b.setAttribute("tabindex", "-1"));
          list[0].setAttribute("tabindex", "0");
          list[0].focus();
        }
        break;
      case "End":
        e.preventDefault();
        {
          const list = qsa(groupEl, SEL.BTN);
          list.forEach((b) => b.setAttribute("tabindex", "-1"));
          const last = list[list.length - 1];
          last.setAttribute("tabindex", "0");
          last.focus();
        }
        break;
      case " ":
      case "Enter":
        e.preventDefault();
        e.target.click();
        break;
    }
  });
  buttons.forEach((btn) => {
    btn.addEventListener("mousedown", () => {
      buttons.forEach((b) => b.setAttribute("tabindex", "-1"));
      btn.setAttribute("tabindex", "0");
    });
  });
}
function initAccordions(selector = SEL.ITEM, { showOnlyOne = false, closeOnClickOutside = false } = {}) {
  const items = document.querySelectorAll(selector);
  if (!items.length) return;
  const groups = new Set(
    Array.from(items).map((i) => i.closest(SEL.GROUP) || document)
  );
  groups.forEach((g) => setupRovingFocus(g));
  items.forEach((item) => {
    const btn = qs(item, SEL.BTN);
    const panel = qs(item, SEL.CONTENT);
    if (!btn || !panel) return;
    wireA11y(item, btn, panel);
    const initiallyOpen = item.hasAttribute("data-open") || item.getAttribute("data-state") === "open";
    if (initiallyOpen) {
      revealPanel(panel);
      setState(item, "open");
      btn.setAttribute("aria-expanded", "true");
    } else {
      panel.hidden = true;
      panel.setAttribute("inert", "");
      setState(item, "closed");
    }
    btn.addEventListener("click", () => {
      toggleAccordion(item, { showOnlyOne });
    });
  });
  if (closeOnClickOutside && !outsideClickBound) {
    outsideClickBound = true;
    document.addEventListener("click", (e) => {
      if (e.target.closest(SEL.ITEM)) return;
      document.querySelectorAll(`${SEL.ITEM}[data-state="open"]`).forEach((openItem) => {
        const b = qs(openItem, SEL.BTN);
        const p = qs(openItem, SEL.CONTENT);
        closeAccordion(openItem, b, p);
      });
    });
  }
}
function initInputQuantity() {
  const controls = document.querySelectorAll("[data-input-qty]");
  if (!controls.length) return;
  controls.forEach((control) => {
    const input = control.querySelector("[data-input-qty-value]");
    const btnUp = control.querySelector("[data-input-qty-up]");
    const btnDown = control.querySelector("[data-input-qty-down]");
    if (!input || !btnUp || !btnDown) return;
    const MIN = 1;
    const MAX = 100;
    let value = parseInt(input.value, 10) || MIN;
    control.setAttribute("role", "spinbutton");
    control.setAttribute("aria-valuemin", MIN);
    control.setAttribute("aria-valuemax", MAX);
    control.setAttribute("aria-valuenow", value);
    btnUp.setAttribute("type", "button");
    btnUp.setAttribute("aria-label", "Increase Value");
    btnDown.setAttribute("type", "button");
    btnDown.setAttribute("aria-label", "Descrease Value");
    input.setAttribute("aria-label", "Quantity");
    input.setAttribute("inputmode", "numeric");
    input.setAttribute("autocomplete", "off");
    const updateUI = () => {
      input.value = value;
      control.setAttribute("aria-valuenow", value);
      btnDown.disabled = value <= MIN;
      btnUp.disabled = value >= MAX;
    };
    input.addEventListener("input", () => {
      const newValue = parseInt(input.value, 10);
      value = isNaN(newValue) || newValue < MIN ? MIN : Math.min(newValue, MAX);
      updateUI();
    });
    input.addEventListener("keypress", (e) => {
      const code = e.which || e.keyCode;
      if (code > 31 && (code < 48 || code > 57)) {
        e.preventDefault();
      }
    });
    btnUp.addEventListener("click", (e) => {
      e.preventDefault();
      if (value < MAX) value++;
      updateUI();
    });
    btnDown.addEventListener("click", (e) => {
      e.preventDefault();
      if (value > MIN) value--;
      updateUI();
    });
    updateUI();
  });
}
const FAQ_SELECTOR = "[data-faqs]";
const ACCORDION_SELECTOR = "[data-accordion]";
const IMAGE_SELECTOR = "[data-img]";
const ACTIVE_CLASS = "_active";
const MOBILE_MEDIA = "(max-width: 991.98px)";
function getOpenAccordion(accordions) {
  return accordions.find((item) => item.getAttribute("data-state") === "open");
}
function getAccordionImageKey(accordion, index) {
  const mapped = accordion.getAttribute("data-img");
  return mapped || String(index + 1).padStart(2, "0");
}
function syncFaqMedia(section) {
  const accordions = Array.from(section.querySelectorAll(ACCORDION_SELECTOR));
  const images = Array.from(section.querySelectorAll(IMAGE_SELECTOR));
  if (!accordions.length || !images.length) return;
  const openAccordion2 = getOpenAccordion(accordions);
  if (!openAccordion2) {
    images.forEach((image) => image.classList.remove(ACTIVE_CLASS));
    return;
  }
  const openIndex = accordions.indexOf(openAccordion2);
  const key = getAccordionImageKey(openAccordion2, openIndex);
  images.forEach((image) => {
    image.classList.toggle(ACTIVE_CLASS, image.dataset.img === key);
  });
}
function initFaqMedia() {
  const sections = document.querySelectorAll(FAQ_SELECTOR);
  if (!sections.length) return;
  const mediaQuery = window.matchMedia(MOBILE_MEDIA);
  const observers = /* @__PURE__ */ new Map();
  const clearActiveImages = (section) => {
    section.querySelectorAll(IMAGE_SELECTOR).forEach((image) => {
      image.classList.remove(ACTIVE_CLASS);
    });
  };
  const observeSection = (section) => {
    if (observers.has(section)) return;
    const observer = new MutationObserver((mutations) => {
      const hasStateChange = mutations.some(
        (mutation) => mutation.type === "attributes" && mutation.attributeName === "data-state"
      );
      if (hasStateChange) {
        syncFaqMedia(section);
      }
    });
    section.querySelectorAll(ACCORDION_SELECTOR).forEach((item) => {
      observer.observe(item, {
        attributes: true,
        attributeFilter: ["data-state"]
      });
    });
    observers.set(section, observer);
  };
  const unobserveSection = (section) => {
    const observer = observers.get(section);
    if (!observer) return;
    observer.disconnect();
    observers.delete(section);
  };
  const handleMode = () => {
    const isMobile2 = mediaQuery.matches;
    sections.forEach((section) => {
      if (isMobile2) {
        unobserveSection(section);
        clearActiveImages(section);
        return;
      }
      syncFaqMedia(section);
      observeSection(section);
    });
  };
  handleMode();
  mediaQuery.addEventListener("change", handleMode);
}
function initTOCItem(root) {
  const scopeSel = root.dataset.tocScope || "body";
  const headingsSel = root.dataset.tocHeadings || "h2";
  const activeClass = root.dataset.tocActiveClass || "_active";
  const offset = parseInt(root.dataset.tocOffset || "0", 10);
  const list = root.querySelector("[data-toc-list]");
  if (!list) return;
  const scope = document.querySelector(scopeSel);
  if (!scope) return;
  const translitMap = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ye",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "yi",
    й: "i",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ь: "",
    ю: "yu",
    я: "ya",
    ы: "y",
    э: "e",
    ё: "yo"
  };
  const translit = (s) => s.replace(/[\u0400-\u04FF]/g, (ch) => {
    const low = ch.toLowerCase();
    const t = translitMap[low] ?? "";
    return ch === low ? t : t.charAt(0).toUpperCase() + t.slice(1);
  });
  new Set(
    Array.from(document.querySelectorAll("[id]")).map((n) => n.id)
  );
  const slugify = (text, fallback = "section") => {
    let s = String(text || "").trim();
    if (!s) s = fallback;
    s = translit(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    if (!s) s = fallback;
    let base = s, id = base, i = 2;
    while (document.getElementById(id)) id = `${base}-${i++}`;
    return id;
  };
  const headings = Array.from(scope.querySelectorAll(headingsSel));
  if (!headings.length) return;
  headings.forEach((h, idx) => {
    if (!h.id) h.id = slugify(h.textContent, `section-${idx + 1}`);
  });
  list.innerHTML = "";
  const linkMap = /* @__PURE__ */ new Map();
  for (const h of headings) {
    const id = h.id;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#${encodeURIComponent(id)}`;
    a.textContent = (h.textContent || "").trim();
    a.setAttribute("data-toc-link", "");
    a.setAttribute("data-target", `#${id}`);
    a.setAttribute("role", "link");
    li.appendChild(a);
    list.appendChild(li);
    linkMap.set(id, a);
  }
  function smoothScrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
    window.scrollTo({ top, behavior: "smooth" });
  }
  root.addEventListener("click", (e) => {
    const a = e.target.closest("[data-toc-link]");
    if (!a) return;
    const selector = a.getAttribute("data-target") || a.getAttribute("href");
    if (!selector || !selector.startsWith("#")) return;
    e.preventDefault();
    const id = decodeURIComponent(selector.slice(1));
    smoothScrollToId(id);
  });
  const observer = new IntersectionObserver(
    (entries) => {
      let best = null;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!best || entry.intersectionRatio > best.intersectionRatio)
          best = entry;
      }
      if (!best) return;
      const id = best.target.id;
      linkMap.forEach((link, key) => {
        const active = key === id;
        link.classList.toggle(activeClass, active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    },
    {
      root: null,
      rootMargin: `${-(offset + 8)}px 0px -70% 0px`,
      threshold: [0.1, 0.25, 0.5, 0.75, 1]
    }
  );
  headings.forEach((h) => observer.observe(h));
  if (location.hash) {
    const id = decodeURIComponent(location.hash.slice(1));
    if (document.getElementById(id)) {
      setTimeout(() => smoothScrollToId(id), 0);
    }
  }
}
function init() {
  const list = document.querySelectorAll("[data-toc]");
  if (!list) return;
  [...list].forEach(initTOCItem);
}
const SELECTORS = {
  ROOT: "[data-sidebar]",
  TOGGLE: "[data-sidebar-toggle]",
  LAYOUT: ".admin-layout"
};
const CLASSES = {
  COLLAPSED: "_collapsed",
  EXPANDED: "_expanded",
  LAYOUT_COLLAPSED: "_sidebar-collapsed"
};
const STORAGE_KEY = "admin_sidebar_collapsed";
function readCollapsedState() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}
function writeCollapsedState(collapsed) {
  try {
    window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
  }
}
function initAdminSidebar() {
  const sidebars = document.querySelectorAll(SELECTORS.ROOT);
  if (!sidebars.length) return;
  sidebars.forEach((sidebar) => {
    const toggles = sidebar.querySelectorAll(SELECTORS.TOGGLE);
    if (!toggles.length) return;
    const layout = sidebar.closest(SELECTORS.LAYOUT);
    const syncState = () => {
      const expanded = sidebar.classList.contains(CLASSES.EXPANDED);
      const collapsed = !expanded;
      toggles.forEach((toggle) => {
        toggle.setAttribute("aria-expanded", String(expanded));
      });
      sidebar.classList.toggle(CLASSES.COLLAPSED, collapsed);
      layout?.classList.toggle(CLASSES.LAYOUT_COLLAPSED, collapsed);
      writeCollapsedState(collapsed);
    };
    const shouldCollapse = readCollapsedState();
    sidebar.classList.toggle(CLASSES.EXPANDED, !shouldCollapse);
    [...toggles].forEach((toggle) => {
      toggle.addEventListener("click", () => {
        sidebar.classList.toggle(CLASSES.EXPANDED);
        syncState();
      });
    });
    syncState();
  });
}
const LAYOUT_SELECTOR = ".admin-auth-layout";
const ACTION_SELECTOR = "[data-auth-layout-state]";
function initAdminAuthLayout() {
  document.addEventListener("click", (e) => {
    const actionBtn = e.target.closest(ACTION_SELECTOR);
    if (!actionBtn) return;
    const state = actionBtn.getAttribute("data-auth-layout-state");
    if (!state) return;
    const layout = actionBtn.closest(LAYOUT_SELECTOR);
    if (!layout) return;
    layout.setAttribute("data-state", state);
  });
}
const FOCUS_SELECTORS = [
  'a[href]:not([tabindex="-1"])',
  'area[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'input:not([type="hidden"]):not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
  "audio[controls], video[controls]",
  "summary"
].join(",");
const esc = (value) => {
  if (window.CSS?.escape) return window.CSS.escape(String(value));
  return String(value).replace(/["\\#.:;?+*^$[\](){}/|<>~`=,\s]/g, "\\$&");
};
class Modal {
  constructor(options) {
    const defaults = {
      closeOnEsc: true,
      closeOnBackdrop: true,
      trapFocus: true,
      returnFocus: true,
      // true | false | '#selector' | 'trigger'
      isOpen: () => {
      },
      isClose: () => {
      }
    };
    this.options = { ...defaults, ...options };
    this.overlays = Array.from(document.querySelectorAll("[data-modal]"));
    if (!this.overlays.length) return;
    this.overlay = null;
    this.current = null;
    this.currentOpts = { ...this.options };
    this.speed = 300;
    this.animation = "modal-fade";
    this.isOpen = false;
    this.previousActiveElement = null;
    this.returnFocusTarget = null;
    this.lastTrigger = null;
    this.fixBlocks = document.querySelectorAll(".fix-block");
    this.onKeydown = this.onKeydown.bind(this);
    this.onDocClick = this.onDocClick.bind(this);
    this.onOverlayClick = this.onOverlayClick.bind(this);
    document.addEventListener("click", this.onDocClick);
    this.overlays.forEach((overlay) => {
      overlay.addEventListener("click", this.onOverlayClick);
    });
  }
  // ---- helpers
  parseBool(val, fallback) {
    if (val == null) return fallback;
    const v = String(val).trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
    return fallback;
  }
  dispatch(container, name, detail = {}) {
    container?.dispatchEvent(
      new CustomEvent(`modal:${name}`, { bubbles: true, detail })
    );
  }
  resolveEffectiveOptions(container, trigger) {
    const ds = container.dataset;
    const closeOnEsc = this.parseBool(ds.closeOnEsc, this.options.closeOnEsc);
    const closeOnBackdrop = this.parseBool(
      ds.closeOnBackdrop,
      this.options.closeOnBackdrop
    );
    const trapFocus2 = this.parseBool(ds.trapFocus, this.options.trapFocus);
    let returnFocus = this.options.returnFocus;
    let returnFocusTarget = null;
    if (ds.returnFocus != null) {
      const raw = String(ds.returnFocus).trim();
      if (raw === "false") {
        returnFocus = false;
      } else if (raw === "true" || raw === "") {
        returnFocus = true;
      } else if (raw === "trigger") {
        returnFocus = "trigger";
      } else {
        const el = document.querySelector(raw);
        if (el) {
          returnFocus = true;
          returnFocusTarget = el;
        }
      }
    }
    const anim = trigger?.dataset.modalAnimation || ds.animation || "modal-fade";
    const spd = parseInt(trigger?.dataset.modalSpeed || ds.speed || 300, 10);
    return {
      closeOnEsc,
      closeOnBackdrop,
      trapFocus: trapFocus2,
      returnFocus,
      // boolean | 'trigger'
      returnFocusTarget,
      animation: anim,
      speed: isNaN(spd) ? 300 : spd
    };
  }
  setDialogA11y(container) {
    if (!container.hasAttribute("role"))
      container.setAttribute("role", "dialog");
    if (!container.hasAttribute("aria-modal"))
      container.setAttribute("aria-modal", "true");
    if (!container.hasAttribute("aria-labelledby")) {
      const h = container.querySelector("h1,h2,h3,[data-modal-title]");
      if (h) {
        if (!h.id)
          h.id = `modal-title-${Math.random().toString(36).slice(2, 8)}`;
        container.setAttribute("aria-labelledby", h.id);
      }
    }
    if (!container.hasAttribute("aria-describedby")) {
      const d = container.querySelector(
        "[data-modal-description], .modal__content, p"
      );
      if (d) {
        if (!d.id)
          d.id = `modal-desc-${Math.random().toString(36).slice(2, 8)}`;
        container.setAttribute("aria-describedby", d.id);
      }
    }
  }
  setSiblingsInert(isInert) {
    const root = document.body;
    Array.from(root.children).forEach((el) => {
      if (el === this.overlay) return;
      if (isInert) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    });
  }
  getFirstFocusable(container) {
    const nodes = container.querySelectorAll(FOCUS_SELECTORS);
    return nodes.length ? nodes[0] : null;
  }
  // ---- global listeners
  onDocClick(e) {
    const trigger = e.target.closest("[data-modal-target]");
    if (trigger) {
      const targetId = String(trigger.dataset.modalTarget || "").trim();
      if (!targetId) return;
      const candidate = document.querySelector(
        `[data-modal-container="${esc(targetId)}"]`
      );
      if (!candidate) return;
      this.open(candidate, trigger);
      return;
    }
    if (e.target.closest("[data-modal-close]")) {
      this.close();
    }
  }
  onOverlayClick(e) {
    if (!this.isOpen || !this.current) return;
    if (e.currentTarget !== this.overlay) return;
    if (!this.currentOpts.closeOnBackdrop) return;
    const container = e.target.closest("[data-modal-container]");
    if (!container) this.close();
  }
  onKeydown(e) {
    if (!this.isOpen) return;
    if (e.key === "Escape" && this.currentOpts.closeOnEsc) {
      e.preventDefault();
      this.close();
      return;
    }
    if (e.key === "Tab" && this.currentOpts.trapFocus) {
      this.focusCatch(e);
    }
  }
  // ---- open/close
  open(container, triggerEl = null) {
    if (!container || container === this.current) {
      if (this.isOpen) (this.getFirstFocusable(container) || container).focus();
      return;
    }
    const containerOverlay = container.closest("[data-modal]");
    if (!containerOverlay) return;
    this.overlay = containerOverlay;
    this.currentOpts = this.resolveEffectiveOptions(container, triggerEl);
    this.animation = this.currentOpts.animation;
    this.speed = this.currentOpts.speed;
    this.overlay.style.setProperty(
      "--modal-transition-time",
      `${this.speed / 1e3}s`
    );
    this.returnFocusTarget = this.currentOpts.returnFocusTarget || null;
    this.previousActiveElement = document.activeElement || triggerEl;
    this.lastTrigger = triggerEl;
    if (!this.isOpen) {
      this.dispatch(container, "beforeopen", { container });
      this.overlay.classList.add("is-open");
      this.overlay.removeAttribute("hidden");
      this.disableScroll();
      this.setSiblingsInert(true);
      window.addEventListener("keydown", this.onKeydown);
      requestAnimationFrame(() => this.overlay.classList.add("backdrop-in"));
    } else {
      if (this.current && this.current !== container) {
        const prev = this.current;
        const animClasses = Array.from(prev.classList).filter(
          (c) => c.startsWith("modal-")
        );
        prev.classList.remove("animate-open", "modal-open", ...animClasses);
      }
      this.dispatch(container, "beforeopen", { container });
    }
    this.current = container;
    this.current.setAttribute("tabindex", "-1");
    this.current.classList.add("modal-open", this.animation);
    this.setDialogA11y(this.current);
    requestAnimationFrame(() => {
      this.isOpen = true;
      this.current.classList.add("animate-open");
      const auto = this.current.querySelector("[autofocus]");
      (auto || this.getFirstFocusable(this.current) || this.current).focus();
      this.dispatch(this.current, "open", { container: this.current });
      this.options.isOpen(this);
    });
  }
  close() {
    if (!this.isOpen || !this.current) return;
    this.dispatch(this.current, "beforeclose", { container: this.current });
    this.overlay.classList.remove("backdrop-in");
    this.current.classList.remove("animate-open", this.animation, "modal-open");
    window.removeEventListener("keydown", this.onKeydown);
    this.options.isClose(this);
    window.setTimeout(() => {
      this.overlay.classList.remove("is-open");
      this.overlay.setAttribute("hidden", "");
      this.enableScroll();
      this.setSiblingsInert(false);
      const { returnFocus } = this.currentOpts;
      if (returnFocus) {
        let target = null;
        if (returnFocus === "trigger" && this.lastTrigger && document.contains(this.lastTrigger)) {
          target = this.lastTrigger;
        } else if (this.returnFocusTarget && document.contains(this.returnFocusTarget)) {
          target = this.returnFocusTarget;
        } else if (this.previousActiveElement && document.contains(this.previousActiveElement)) {
          target = this.previousActiveElement;
        }
        target?.focus?.();
      }
      this.dispatch(this.current, "close", { container: this.current });
      this.isOpen = false;
      this.current = null;
      this.returnFocusTarget = null;
      this.currentOpts = { ...this.options };
      this.lastTrigger = null;
    }, this.speed);
  }
  // ---- focus trap
  focusCatch(e) {
    if (!this.current) return;
    const nodes = Array.from(this.current.querySelectorAll(FOCUS_SELECTORS));
    if (!nodes.length) {
      this.current.focus();
      e.preventDefault();
      return;
    }
    const idx = nodes.indexOf(document.activeElement);
    if (e.shiftKey && (idx === 0 || idx === -1)) {
      nodes[nodes.length - 1].focus();
      e.preventDefault();
      return;
    }
    if (!e.shiftKey && idx === nodes.length - 1) {
      nodes[0].focus();
      e.preventDefault();
    }
  }
  // ---- scroll lock
  disableScroll() {
    const y = window.scrollY;
    document.body.classList.add("disable-scroll");
    document.body.dataset.position = y;
    document.body.style.top = `${-y}px`;
  }
  enableScroll() {
    const y = parseInt(document.body.dataset.position || "0", 10);
    document.body.style.top = "";
    document.body.classList.remove("disable-scroll");
    window.scrollTo({ top: y, left: 0 });
    document.body.removeAttribute("data-position");
  }
  lockPadding() {
    const paddingOffset = `${window.innerWidth - document.body.offsetWidth}px`;
    this.fixBlocks.forEach((el) => {
      el.style.paddingRight = paddingOffset;
    });
    document.body.style.paddingRight = paddingOffset;
  }
  unlockPadding() {
    this.fixBlocks.forEach((el) => {
      el.style.paddingRight = "";
    });
    document.body.style.paddingRight = "";
  }
  // ---- public API
  show(targetId = null, animation, speed) {
    if (!targetId) return;
    const container = document.querySelector(
      `[data-modal-container="${esc(targetId)}"]`
    );
    if (!container) return;
    if (animation) container.dataset.animation = animation;
    if (speed != null) container.dataset.speed = String(speed);
    this.open(container, null);
  }
  destroy() {
    this.enableScroll();
    this.setSiblingsInert(false);
    window.removeEventListener("keydown", this.onKeydown);
    document.removeEventListener("click", this.onDocClick);
    this.overlays.forEach((overlay) => {
      overlay.removeEventListener("click", this.onOverlayClick);
    });
  }
}
const INPUT_TYPES = {
  TEXT: "text",
  PASSWORD: "password"
};
function togglePasswordVisibility(input, toggleBtn) {
  const isPassword = input.type === INPUT_TYPES.PASSWORD;
  input.type = isPassword ? INPUT_TYPES.TEXT : INPUT_TYPES.PASSWORD;
  toggleBtn.classList.toggle(CLASSES$1.SHOW, isPassword);
}
function initPasswordInputs() {
  const passwordInputs = document.querySelectorAll('input[type="password"]');
  if (!passwordInputs.length) return;
  passwordInputs.forEach((input) => {
    const inputWrapper = input.closest(".input");
    if (!inputWrapper) return;
    const toggleBtn = inputWrapper.querySelector(".input__toggle");
    if (!toggleBtn) return;
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      togglePasswordVisibility(input, toggleBtn);
    });
  });
}
document.addEventListener("DOMContentLoaded", () => {
  isWebp();
  isMobile();
  initMenu();
  initSitemap();
  initSelects();
  initSliders();
  initHeader({
    selector: ".header",
    isScrolled: true,
    isHidden: true
  });
  initMaps();
  initContentTabs();
  initPopups();
  new DynamicAdapt("max").init();
  initAccordions("[data-accordion]", {
    showOnlyOne: true,
    closeOnClickOutside: true
  });
  initFaqMedia();
  initInputQuantity();
  init();
  initAdminSidebar();
  initAdminAuthLayout();
  new Modal();
  initPasswordInputs();
  SELECTORS$1.BODY.classList.add(CLASSES$1.LOADED);
});
