initShell();

let incidents = loadData("incidents", startIncidents);

const incidentTable = document.getElementById("incidentTable");
const incidentForm = document.getElementById("incidentForm");
const statusFilter = document.getElementById("statusFilter");

function getFilteredIncidents() {
    const value = statusFilter.value;

    if (value === "all") return incidents;
    return incidents.filter(item => item.status === value);
}

function renderIncidents(list = getFilteredIncidents()) {
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

        const actionCell = document.createElement("td");
        const resolveButton = document.createElement("button");
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn small danger icon-danger dev-only";
        deleteButton.textContent = "✕";
        deleteButton.title = "Удалить (режим разработчика)";
        deleteButton.addEventListener("click", () => deleteIncident(item.id));
        actionCell.append(deleteButton);
        resolveButton.className = "btn small";
        resolveButton.textContent = "Решить";
        resolveButton.disabled = item.status === "resolved";

        resolveButton.addEventListener("click", () => {
            resolveIncident(item.id);
        });

        actionCell.append(resolveButton);

        row.append(idCell, titleCell, priorityCell, statusCell, createdCell, slaCell, actionCell);
        incidentTable.append(row);
    });
}

function resolveIncident(id) {
    const item = incidents.find(incident => incident.id === id);
    if (!item) return;

    item.status = "resolved";
    item.resolvedAt = new Date().toISOString();

    saveData("incidents", incidents);
    renderIncidents();
}

function deleteIncident(id) {
    if (!confirm("Удалить инцидент " + id + "?")) return;
    incidents = incidents.filter(item => item.id !== id);
    saveData("incidents", incidents);
    renderIncidents();
}

incidentForm.addEventListener("submit", event => {
    event.preventDefault();

    const title = incidentForm.elements.title.value.trim();
    const priority = incidentForm.elements.priority.value;

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

    statusFilter.value = "all";
    renderIncidents(incidents);
    incidentForm.reset();
});

statusFilter.addEventListener("change", () => {
    renderIncidents();
});

renderIncidents();