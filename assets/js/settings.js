initShell();

const $ = id => document.getElementById(id);
const on = (el, ev, fn) => { if (el) el.addEventListener(ev, fn); };

const roleSelect = $("roleSelect");
const devPassword = $("devPassword");
const devAuthButton = $("devAuthButton");
const settingsThemeBtn = $("settingsThemeBtn");
const settingsNeonBtn = $("settingsNeonBtn");
const resetButton = $("resetButton");

applyDevLabels();

/* Смена профиля через select */
on(roleSelect, "change", () => {
    const wanted = roleSelect.value;
    if (wanted === "developer" && !isDevMode()) {
        roleSelect.value = getRole();
        toast("Для профиля «Разработчик» введите пароль", "warning");
        if (devPassword) devPassword.focus();
        return;
    }
    setRole(wanted);
    toast(`Профиль переключён: ${roleName(wanted)}`, wanted === "developer" ? "success" : "info");
});

/* Подтверждение пароля — через checkDevPassword из storage.js */
on(devAuthButton, "click", async () => {
    const raw = (devPassword && devPassword.value.trim()) || "";

    if (!raw) {
        toast("Введите пароль", "warning");
        if (devPassword) devPassword.focus();
        return;
    }

    const res = await checkDevPassword(raw);

    if (res.reason === "crypto") {
        toast("SHA-256 недоступен: открой сайт через Live Server (http/127.0.0.1), а не file://", "danger", 5000);
        return;
    }

    if (!res.ok) {
        toast("Неверный пароль. Профиль «Разработчик» не включён", "danger", 4000);
        if (devPassword) { devPassword.value = ""; devPassword.focus(); }
        return;
    }

    setRole("developer");
    if (roleSelect) roleSelect.value = "developer";
    if (devPassword) devPassword.value = "";
    toast("Режим разработчика включён. Кнопки удаления появились в инцидентах и заявках", "success", 4200);
});

/* Переключатели внутри карточки «Внешний вид» */
on(settingsThemeBtn, "click", () => { toggleTheme(); toast("Тема переключена", "info", 1800); });
on(settingsNeonBtn, "click", () => { toggleNeon(); toast("Неон переключён", "info", 1800); });

/* Очистка данных */
on(resetButton, "click", () => {
    const ok = confirm("Удалить ВСЕ локальные данные (внедрения, инциденты, заявки, релизы, настройки и профиль)? Действие необратимо.");
    if (!ok) return;
    ["deployments", "incidents", "requests", "releases", "theme", "neon", "role"].forEach(k => localStorage.removeItem(k));
    toast("Данные очищены. Перезагрузка…", "warning", 1500);
    setTimeout(() => location.reload(), 700);
});

const exportButton = document.getElementById("exportButton");
if (exportButton) {
    exportButton.addEventListener("click", () => {
        const data = {
            deployments: loadData("deployments", startDeployments),
            incidents: loadData("incidents", startIncidents),
            requests: loadData("requests", startRequests),
            releases: loadData("releases", startReleases)
        };
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "data-export.json";
        a.click();
        URL.revokeObjectURL(url);
        toast("Данные экспортированы в data-export.json", "success", 3000);
    });
}