function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
function loadData(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
}
function makeBadge(text, className = "") {
    const span = document.createElement("span");
    span.className = `badge ${className}`.trim();
    span.textContent = text;
    return span;
}

/* ===== ПРОФИЛИ / РОЛИ ===== */
const DEV_HASH = "a25f4e7f06baed292f0e7f8026302752fc854f0f53b488902558c0f33028c3d7";

async function sha256(text) {
    if (!window.crypto || !crypto.subtle) return null;
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function checkDevPassword(input) {
    const hash = await sha256(String(input || "").trim());
    if (hash === null) return { ok: false, reason: "crypto" };
    return { ok: hash === DEV_HASH.toLowerCase(), reason: "" };
}

const roleNames = { operator: "Оператор", admin: "Администратор", developer: "Разработчик" };
function roleName(role) { return roleNames[role] || "Оператор"; }
function getRole() {
    const role = localStorage.getItem("role");
    return role === "admin" || role === "developer" ? role : "operator";
}
function setRole(role) {
    const safe = role === "admin" || role === "developer" ? role : "operator";
    localStorage.setItem("role", safe);
    document.body.classList.toggle("dev-on", safe === "developer");
    applyDevLabels();
}
function isDevMode() { return getRole() === "developer"; }
function setDevMode(on) { setRole(on ? "developer" : "operator"); }
function applyDevLabels() {
    const role = getRole();
    const on = role === "developer";
    document.querySelectorAll("#roleStateText, #devStateText").forEach(el => { el.textContent = roleName(role); });
    document.querySelectorAll("#roleSelect").forEach(el => { el.value = role; });
    document.querySelectorAll("#devOnButton").forEach(el => el.style.display = on ? "none" : "");
    document.querySelectorAll("#devOffButton").forEach(el => el.style.display = on ? "" : "none");
}

/* ===== TOAST ===== */
function ensureToastHost() {
    let host = document.getElementById("toastHost");
    if (!host) { host = document.createElement("div"); host.id = "toastHost"; host.className = "toast-host"; document.body.append(host); }
    return host;
}
function toast(message, type = "info", ms = 3200) {
    const host = ensureToastHost();
    const el = document.createElement("div");
    el.className = `toast ${type}`; el.setAttribute("role", "status"); el.textContent = message;
    host.append(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
        el.classList.remove("show");
        el.addEventListener("transitionend", () => el.remove(), { once: true });
        setTimeout(() => el.remove(), 400);
    }, ms);
}

/* ===== ОНБОРДИНГ (Fix A, Issue #1) ===== */
function getPageName() {
    const path = location.pathname.split('/').pop() || 'index.html';
    return path.replace('.html', '');
}

function initOnboarding() {
    const page = getPageName();
    const banner = document.getElementById('onboardBanner');
    const showBtn = document.getElementById('showGuideBtn');
    if (!banner) return;

    // Проверяем, закрывал ли пользователь баннер именно на ЭТОЙ странице
    const isDismissed = localStorage.getItem(`onboarded_${page}`) === 'yes';
    banner.style.display = isDismissed ? 'none' : 'flex';

    // Кнопка "Понятно, скрыть" внутри баннера
    const dismissBtn = document.getElementById('onboardDismiss');
    if (dismissBtn) {
        dismissBtn.onclick = () => {
            localStorage.setItem(`onboarded_${page}`, 'yes');
            banner.style.display = 'none';
        };
    }

    // Кнопка "?" в топбаре — просто показывает баннер, не меняя localStorage
    if (showBtn) {
        showBtn.onclick = () => {
            banner.style.display = 'flex';
        };
    }
}

/* ===== ВЕРСИЯ ===== */
function getCurrentVersion() {
    const releases = loadData("releases", startReleases);
    if (!Array.isArray(releases) || releases.length === 0) return "v1.0.0";
    return [...releases].sort(compareSemver).at(-1).version;
}
function updateTopVersion() {
    const version = getCurrentVersion();
    document.querySelectorAll("#currentVersionTop, .current-version").forEach(el => { el.textContent = version; });
}

/* ===== ТЕМА / НЕОН ===== */
function applyThemeLabels() {
    const isLight = document.body.classList.contains("light");
    const isNoNeon = document.body.classList.contains("no-neon");
    document.querySelectorAll("#themeButton").forEach(btn => { btn.textContent = isLight ? "🌙 Тёмная" : "☀️ Светлая"; });
    document.querySelectorAll("#neonButton").forEach(btn => { btn.textContent = isNoNeon ? "✨ Neon" : "🚫 Neon"; });
    document.querySelectorAll("#settingsThemeState").forEach(el => { el.textContent = isLight ? "Светлая" : "Тёмная"; });
    document.querySelectorAll("#settingsNeonState").forEach(el => { el.textContent = isNoNeon ? "Выключен" : "Включён"; });
}
function toggleTheme() {
    document.body.classList.toggle("light");
    localStorage.setItem("theme", document.body.classList.contains("light") ? "light" : "dark");
    applyThemeLabels();
    window.dispatchEvent(new Event("themeChanged"));
}
function toggleNeon() {
    document.body.classList.toggle("no-neon");
    localStorage.setItem("neon", document.body.classList.contains("no-neon") ? "off" : "on");
    applyThemeLabels();
}
function initTheme() {
    if (localStorage.getItem("theme") === "light") document.body.classList.add("light");
    // Fix B (Issue #2): неон ВЫКЛЮЧЕН по умолчанию, включается только явно
    if (localStorage.getItem("neon") !== "on") document.body.classList.add("no-neon");
    applyThemeLabels();
    document.querySelectorAll("#themeButton").forEach(btn => btn.addEventListener("click", toggleTheme));
    document.querySelectorAll("#neonButton").forEach(btn => btn.addEventListener("click", toggleNeon));
}

/* ===== NAV ===== */
function initNav() {
    const page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav a").forEach(link => {
        link.classList.remove("active");
        const href = link.getAttribute("href");
        if (href === page || (page === "" && href === "index.html")) link.classList.add("active");
    });
}

/* ===== MOBILE MENU ===== */
function initMobileMenu() {
    const btn = document.getElementById("menuBtn");
    const backdrop = document.getElementById("menuBackdrop");
    const sidebar = document.querySelector(".sidebar");
    if (!btn || !sidebar) return;
    if (btn.dataset.menuBound === "1") return;
    btn.dataset.menuBound = "1";
    const close = () => { sidebar.classList.remove("open"); if (backdrop) backdrop.classList.remove("show"); };
    const toggle = () => { const isOpen = sidebar.classList.toggle("open"); if (backdrop) backdrop.classList.toggle("show", isOpen); };
    btn.addEventListener("click", toggle);
    if (backdrop) backdrop.addEventListener("click", close);
    sidebar.querySelectorAll(".nav a").forEach(link => link.addEventListener("click", close));
    document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
}

function initShell() {
    initTheme();
    initNav();
    initMobileMenu();
    initOnboarding();                                  // <- добавлено
    document.body.classList.toggle("dev-on", isDevMode());
    applyDevLabels();
    ensureToastHost();
    updateTopVersion();
}

(function () {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initMobileMenu);
    else initMobileMenu();
})();