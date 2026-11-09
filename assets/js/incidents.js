initShell();

let incidents = loadData("incidents", startIncidents);

const incidentTable = document.getElementById("incidentTable");
const incidentForm = document.getElementById("incidentForm");
const statusFilter = document.getElementById("statusFilter");
const searchInput = document.getElementById("searchInput");

function getFilteredIncidents() {
    const value = statusFilter ? statusFilter.value : "all";
    const query = searchInput ? (searchInput.value || "").trim().toLowerCase() : "";
    let list = incidents;
    if (value !== "all") list = list.filter(item => item.status === value);
    if (query) list = list.filter(item => String(item.title || "").toLowerCase().includes(query));
    return list;
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

function renderIncidents(list = getFilteredIncidents()) {
    if (!incidentTable) return;
    incidentTable.innerHTML = "";

    list.forEach(item => {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.id;

        const titleCell = document.createElement("td");
        titleCell.textContent = item.title;

        const priorityCell = document.createElement("td");
        priorityCell.append(makeBadge(priorityNames[item.priority] || item.priority, item.priority));

        const statusCell = document.createElement("td");
        statusCell.append(makeBadge(incidentStatusNames[item.status] || item.status, item.status));

        const createdCell = document.createElement("td");
        createdCell.textContent = formatDateTime(item.createdAt);

        const slaState = getSlaState(item, settings);
        const slaCell = document.createElement("td");
        slaCell.append(makeBadge(slaNames[slaState] || slaState, slaState));
        const remaining = getSlaRemaining(item, settings);
        if (remaining) {
            const timeEl = document.createElement("div");
            timeEl.className = "sla-time" + (slaState === "breached" ? " overdue" : "");
            timeEl.textContent = remaining;
            slaCell.append(timeEl);
        }

        const actionCell = document.createElement("td");
        const resolveButton = document.createElement("button");
        resolveButton.className = "btn small";
        resolveButton.textContent = "Решить";
        resolveButton.disabled = item.status === "resolved";
        resolveButton.addEventListener("click", () => resolveIncident(item.id));
        actionCell.append(resolveButton);

        if (isDevMode()) {
            const deleteButton = document.createElement("button");
            deleteButton.className = "btn small danger icon-danger";
            deleteButton.textContent = "✕";
            deleteButton.title = "Удалить";
            deleteButton.addEventListener("click", () => deleteIncident(item.id));
            actionCell.append(deleteButton);
        }

        row.append(idCell, titleCell, priorityCell, statusCell, createdCell, slaCell, actionCell);
        incidentTable.append(row);
    });
}

function resolveIncident(id) {
    if (!confirm("Решить инцидент " + id + "?")) return;
    const item = incidents.find(incident => incident.id === id);
    if (!item) return;
    item.status = "resolved";
    item.resolvedAt = new Date().toISOString();
    saveData("incidents", incidents);
    renderIncidents();
    window.dispatchEvent(new Event("dataChanged"));
    toast("Инцидент решён", "success", 2000);
}

function deleteIncident(id) {
    if (!confirm("Удалить инцидент " + id + "?")) return;
    incidents = incidents.filter(item => item.id !== id);
    saveData("incidents", incidents);
    renderIncidents();
    window.dispatchEvent(new Event("dataChanged"));
    toast("Инцидент удалён", "warning", 2000);
}

if (incidentForm) {
    incidentForm.addEventListener("submit", event => {
        event.preventDefault();
        const title = incidentForm.elements.title ? incidentForm.elements.title.value.trim() : "";
        const priority = incidentForm.elements.priority ? incidentForm.elements.priority.value : "high";
        if (!title) {
            alert("Введите описание инцидента");
            return;
        }
        incidents.push({
            id: nextId("INC", incidents, 3),
            title,
            priority,
            status: "new",
            createdAt: new Date().toISOString(),
            resolvedAt: null
        });
        saveData("incidents", incidents);
        if (statusFilter) statusFilter.value = "all";
        renderIncidents(incidents);
        incidentForm.reset();
        toast("Инцидент создан", "success", 2000);
    });
}

if (statusFilter) {
    statusFilter.addEventListener("change", () => renderIncidents());
}

if (searchInput) {
    searchInput.addEventListener("input", () => renderIncidents());
}

renderIncidents();