// year
document.getElementById("year").textContent = new Date().getFullYear();

/* ripple click feedback */
function ripple(el, x, y) {
  const r = el.getBoundingClientRect();
  const s = Math.max(r.width, r.height);
  const span = document.createElement("span");
  span.className = "ripple";
  span.style.width = span.style.height = `${s}px`;
  span.style.left = `${x - r.left - s / 2}px`;
  span.style.top = `${y - r.top - s / 2}px`;
  el.appendChild(span);
  span.addEventListener("animationend", () => span.remove());
}

document.addEventListener("pointerdown", (e) => {
  const el = e.target.closest(".tab, .btn, .linkbtn, .mini");
  if (!el) return;
  ripple(el, e.clientX, e.clientY);
});

const btn = document.getElementById("themeToggle");

function setTheme(mode){
  const html = document.documentElement;
  if (mode === "dark") html.setAttribute("data-theme","dark");
  else html.removeAttribute("data-theme");
  localStorage.setItem("theme", mode);
  if (btn) btn.textContent = mode === "dark" ? "𖤓" : "☽";
}

const saved = localStorage.getItem("theme");
if (saved) setTheme(saved);
else {
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  setTheme(prefersDark ? "dark" : "light");
}

btn?.addEventListener("click", () => {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  setTheme(isDark ? "light" : "dark");
});


/* tab switching */
const tabs = [...document.querySelectorAll(".tab")];
const pages = [...document.querySelectorAll(".page")];

function showTab(name) {
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  pages.forEach(p => p.classList.toggle("show", p.dataset.page === name));

  // update hash for sharing links
  history.replaceState(null, "", `#${name}`);
  // "scroll then appear" feel: scroll to top of browser content
  document.querySelector(".browser").scrollIntoView({ behavior: "smooth", block: "start" });
}

tabs.forEach(t => t.addEventListener("click", () => showTab(t.dataset.tab)));

// buttons inside pages jump tabs
document.addEventListener("click", (e) => {
  const jump = e.target.closest("[data-jump]");
  if (!jump) return;
  showTab(jump.getAttribute("data-jump"));
});

// open tab from URL hash
const start = (location.hash || "#home").slice(1);
if (["home","about","fandoms","byf"].includes(start)) showTab(start);

/* reveal on load (and on scroll) */
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      io.unobserve(entry.target);
    }
  }
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* modal image viewer */
const modal = document.getElementById("modal");
const modalImg = document.getElementById("modalImg");
const modalCap = document.getElementById("modalCap");

function openModal(src, cap="") {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  modalImg.src = src;
  modalCap.textContent = cap;
  document.body.style.overflow = "hidden";
}
function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  modalImg.src = "";
  modalCap.textContent = "";
  document.body.style.overflow = "";
}

document.addEventListener("click", (e) => {
  const opener = e.target.closest("[data-modal]");
  if (opener) {
    const src = opener.getAttribute("data-modal");
    const cap = opener.querySelector("img")?.alt || "";
    openModal(src, cap);
  }
  if (e.target.closest("[data-close]")) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
});

// Feature-style accordion behavior (My fandoms)
(function featureAccordion(){
  const list = document.getElementById("fandomAcc");
  if (!list) return;

  const items = [...list.querySelectorAll(".feature-item")];
  const title = document.getElementById("previewTitle");
  const img = document.getElementById("previewImg");
  const body = document.getElementById("previewBody");

  function setOpen(item, open){
    item.classList.toggle("is-open", open);
  }

function openItem(item){
  const id = item.dataset.target;
  const tpl = document.getElementById(id);
  if (!tpl) return;

  const t = item.querySelector(".feature-title")?.textContent?.trim() || "Preview";
  const d = item.querySelector(".feature-desc")?.textContent?.trim() || "";

  // title bar: giữ title
  title.textContent = t;

  // (NEW) nếu bạn tạo dòng desc ở trên (mình hướng dẫn ở phần B)
  const mobileDesc = document.getElementById("mobilePreviewDesc");
  if (mobileDesc) mobileDesc.textContent = d;

  // image từ data-img của button
  const imgPath = item.dataset.img || "images/banner.jpg";
  img.classList.remove("missing-img");
  img.src = imgPath;
  img.alt = t;

  // swap body
  body.innerHTML = "";
  body.appendChild(tpl.content.cloneNode(true));
}

  items.forEach(item => {
    item.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // click again to close
      if (isOpen){
        setOpen(item, false);
        return;
      }

      // open this, close others
      items.forEach(i => setOpen(i, i === item));
      openItem(item);
    });
  });

  // initialize first open
  const first = items.find(i => i.classList.contains("is-open")) || items[0];
  if (first){
    items.forEach(i => setOpen(i, i === first));
    openItem(first);
  }

  // ===== MOBILE: swipe preview to switch fandom (with animation) =====
let idx = items.findIndex(i => i.classList.contains("is-open"));
if (idx < 0) idx = 0;

const previewWindow = document.querySelector(".feature-window");

if (previewWindow) {

  const animateTo = (direction, nextIdx) => {
    // direction: "left" = next, "right" = prev
    const outClass = direction === "left" ? "swipe-out-left" : "swipe-out-right";

    // out
    previewWindow.classList.remove("swipe-in");
    previewWindow.classList.add(outClass);

    // đổi content ở giữa animation (sau 150ms)
    setTimeout(() => {
      idx = nextIdx;
      items.forEach((i) => setOpen(i, false));
      setOpen(items[idx], true);
      openItem(items[idx]);

      // reset về giữa (in)
      previewWindow.classList.remove(outClass);
      previewWindow.classList.add("swipe-in");
    }, 150);
  };

  const go = (step) => {
    const nextIdx = (idx + step + items.length) % items.length;
    animateTo(step > 0 ? "left" : "right", nextIdx);
  };

  // ===== Touch swipe =====
  let startX = 0;
  let startY = 0;
  let tracking = false;

  previewWindow.addEventListener("touchstart", (e) => {
    if (!e.touches || !e.touches.length) return;
    tracking = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  previewWindow.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const dx = endX - startX;
    const dy = endY - startY;

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) go(+1);
      else go(-1);
    }
  }, { passive: true });

  // ===== Mouse drag (laptop test) =====
  let isDown = false;
  let mouseStartX = 0;
  let mouseStartY = 0;
  let moved = false;

  previewWindow.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    previewWindow.classList.add("is-dragging");
  });

  previewWindow.addEventListener("mousemove", (e) => {
    if (!isDown) return;

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;

    // nếu kéo ngang mạnh hơn kéo dọc thì animate theo tay
    if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(dy)) {
      moved = true;
      previewWindow.style.transform = `translateX(${dx * 0.25}px)`;
      previewWindow.style.opacity = `${1 - Math.min(Math.abs(dx) / 350, 0.35)}`;
    }
  });

  const endMouse = (e) => {
    if (!isDown) return;
    isDown = false;

    previewWindow.classList.remove("is-dragging");
    previewWindow.style.transform = "";
    previewWindow.style.opacity = "";

    if (!moved) return;

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;

    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) go(+1);
      else go(-1);
    }
  };

  previewWindow.addEventListener("mouseup", endMouse);
  previewWindow.addEventListener("mouseleave", endMouse);

  // initial state
  previewWindow.classList.add("swipe-in");
}

})();

