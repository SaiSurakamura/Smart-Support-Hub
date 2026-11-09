const settings = {
    slaHours: {
        critical: 4,
        high: 8,
        medium: 24,
        low: 72
    }
};

const slaNames = {
    on_track: "В срок",
    breached: "Нарушен",
    met: "Решён вовремя"
};

const stageNames = {
    planning: "Планирование",
    setup: "Установка",
    training: "Обучение",
    production: "Продуктив"
};

const priorityNames = {
    critical: "Критический",
    high: "Высокий",
    medium: "Средний",
    low: "Низкий"
};

const incidentStatusNames = {
    new: "Новый",
    in_progress: "В работе",
    resolved: "Решён"
};

const requestTypeNames = {
    corrective: "Корректирующее",
    adaptive: "Адаптивное",
    perfective: "Совершенствующее",
    preventive: "Профилактическое"
};

const requestStatusNames = {
    new: "Новая",
    planned: "Запланирована",
    done: "Выполнена"
};

const releaseLevelNames = {
    major: "Major",
    minor: "Minor",
    patch: "Patch"
};

function getSlaState(incident, config = settings, now = Date.now()) {
    const hours = config?.slaHours?.[incident.priority];
    if (!hours) return "on_track";

    const created = new Date(incident.createdAt).getTime();
    if (Number.isNaN(created)) return "on_track";

    const deadline = created + hours * 60 * 60 * 1000;

    if (incident.status === "resolved") {
        const resolved = new Date(incident.resolvedAt).getTime();
        if (Number.isNaN(resolved)) return "breached";
        return resolved <= deadline ? "met" : "breached";
    }

    return now > deadline ? "breached" : "on_track";
}

function getSlaRemaining(incident, config = settings, now = Date.now()) {
    if (incident.status === "resolved") return "";
    const hours = config?.slaHours?.[incident.priority];
    if (!hours) return "";
    const created = new Date(incident.createdAt).getTime();
    if (Number.isNaN(created)) return "";
    const deadline = created + hours * 60 * 60 * 1000;
    const diff = deadline - now;
    const abs = Math.abs(diff);
    const h = Math.floor(abs / 3600000);
    const m = Math.floor((abs % 3600000) / 60000);
    const human = `${h}ч ${m}м`;
    return diff >= 0 ? `осталось ${human}` : `просрочено на ${human}`;
}

function getSlaPercent(incidents, config = settings) {
    const resolved = incidents.filter(item => item.status === "resolved");
    if (resolved.length === 0) return 100;

    const met = resolved.filter(item => getSlaState(item, config) === "met");
    return Math.round((met.length / resolved.length) * 100);
}

function getNextVersion(current, level) {
    const clean = String(current || "").trim().replace(/^v/i, "");
    const parts = clean.split(".").map(Number);

    if (parts.length !== 3 || parts.some(part => Number.isNaN(part))) {
        return "—";
    }

    if (level === "major") return `v${parts[0] + 1}.0.0`;
    if (level === "minor") return `v${parts[0]}.${parts[1] + 1}.0`;
    return `v${parts[0]}.${parts[1]}.${parts[2] + 1}`;
}

function nextId(prefix, list, pad = 3) {
    const maxNumber = list.reduce((max, item) => {
        const raw = String(item.id || "").replace(/\D/g, "");
        const number = Number(raw);
        return Number.isFinite(number) && number > max ? number : max;
    }, 0);

    return `${prefix}-${String(maxNumber + 1).padStart(pad, "0")}`;
}

function formatDateTime(iso) {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;

    return date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

function parseChanges(text) {
    return String(text || "")
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);
}

function parseVersion(version) {
    const parts = String(version || "")
        .replace(/^v/i, "")
        .split(".")
        .map(Number);

    return [
        Number.isFinite(parts[0]) ? parts[0] : 0,
        Number.isFinite(parts[1]) ? parts[1] : 0,
        Number.isFinite(parts[2]) ? parts[2] : 0
    ];
}

function compareSemver(a, b) {
    const va = parseVersion(a.version || a);
    const vb = parseVersion(b.version || b);

    for (let i = 0; i < 3; i += 1) {
        if (va[i] !== vb[i]) return va[i] - vb[i];
    }

    return 0;
}

const startDeployments = [
    {
        id: "DEP-01",
        client: "Колледж, учебная часть",
        product: "Система расписания",
        version: "v1.0.0",
        stage: "training",
        owner: "Иванов А.",
        plannedDate: "2026-11-20",
        done: 2,
        total: 3
    },
    {
        id: "DEP-02",
        client: "Отдел кадров",
        product: "Портал сотрудников",
        version: "v1.0.0",
        stage: "setup",
        owner: "Петрова С.",
        plannedDate: "2026-11-25",
        done: 1,
        total: 4
    },
    {
        id: "DEP-03",
        client: "Библиотека",
        product: "Каталог изданий",
        version: "v1.0.0",
        stage: "production",
        owner: "Сидоров К.",
        plannedDate: "2026-10-30",
        done: 3,
        total: 3
    }
];

const startIncidents = [
    {
        id: "INC-001",
        title: "Не открывается отчёт",
        priority: "high",
        status: "in_progress",
        createdAt: "2026-11-08T10:00:00",
        resolvedAt: null
    },
    {
        id: "INC-002",
        title: "Ошибка входа в систему",
        priority: "critical",
        status: "new",
        createdAt: "2026-11-09T08:00:00",
        resolvedAt: null
    },
    {
        id: "INC-003",
        title: "Не обновляется расписание",
        priority: "medium",
        status: "resolved",
        createdAt: "2026-11-01T09:00:00",
        resolvedAt: "2026-11-01T15:00:00"
    },
    {
        id: "INC-004",
        title: "Медленная загрузка главной страницы",
        priority: "low",
        status: "resolved",
        createdAt: "2026-10-20T10:00:00",
        resolvedAt: "2026-10-25T10:00:00"
    },
    {
        id: "INC-005",
        title: "Не приходит уведомление",
        priority: "high",
        status: "resolved",
        createdAt: "2026-11-05T10:00:00",
        resolvedAt: "2026-11-05T17:00:00"
    },
    {
        id: "INC-006",
        title: "Кнопка экспорта не работает",
        priority: "medium",
        status: "in_progress",
        createdAt: "2026-11-07T10:00:00",
        resolvedAt: null
    }
];

const startRequests = [
    {
        id: "REQ-001",
        title: "Добавить экспорт отчёта в PDF",
        type: "perfective",
        status: "planned",
        targetVersion: "v1.2.0"
    },
    {
        id: "REQ-002",
        title: "Исправить открытие страницы инцидентов",
        type: "corrective",
        status: "done",
        targetVersion: "v1.1.0"
    },
    {
        id: "REQ-003",
        title: "Поддержать новую версию браузера",
        type: "adaptive",
        status: "new",
        targetVersion: "v1.2.0"
    },
    {
        id: "REQ-004",
        title: "Обновить устаревшую библиотеку",
        type: "preventive",
        status: "planned",
        targetVersion: "v1.2.0"
    }
];

const startReleases = [
    {
        id: "REL-001",
        version: "v1.0.0",
        date: "2026-10-15",
        level: "major",
        changes: [
            "Базовая панель управления",
            "Модуль внедрений",
            "Модуль инцидентов"
        ]
    },
    {
        id: "REL-002",
        version: "v1.0.0",
        date: "2026-11-08",
        level: "minor",
        changes: [
            "Добавлен модуль сопровождения",
            "Добавлен модуль релизов",
            "Добавлены графики Chart.js",
            "Исправлены замечания пользователя"
        ]
    }
];