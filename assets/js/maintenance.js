initShell();

let requests = loadData("requests", startRequests);

const requestTable = document.getElementById("requestTable");
const requestForm = document.getElementById("requestForm");

function setDefaultTargetVersion() {
    const targetInput = requestForm.elements.targetVersion;
    targetInput.value = getNextVersion(getCurrentVersion(), "minor");
}

function changeRequestStatus(id, newStatus) {
    const item = requests.find(req => req.id === id);
    if (!item) return;
    item.status = newStatus;
    saveData("requests", requests);
    window.dispatchEvent(new Event("dataChanged"));
    toast(`Статус заявки изменён: ${requestStatusNames[newStatus]}`, "info", 2000);
}

function deleteRequest(id) {
    if (!confirm("Удалить заявку " + id + "?")) return;
    requests = requests.filter(item => item.id !== id);
    saveData("requests", requests);
    renderRequests();
    window.dispatchEvent(new Event("dataChanged"));
    toast("Заявка удалена", "warning", 2000);
}

function renderRequests() {
    if (!requestTable) return;
    requestTable.innerHTML = "";

    requests.forEach(item => {
        const row = document.createElement("tr");

        const idCell = document.createElement("td");
        idCell.textContent = item.id;

        const titleCell = document.createElement("td");
        titleCell.textContent = item.title;

        const typeCell = document.createElement("td");
        typeCell.append(makeBadge(requestTypeNames[item.type] || item.type, item.type));

        const statusCell = document.createElement("td");
        const statusBadge = document.createElement("span");
        statusBadge.className = `badge ${item.status}`;
        statusBadge.textContent = requestStatusNames[item.status] || item.status;
        statusBadge.style.cursor = "pointer";
        statusBadge.title = "Кликни, чтобы изменить статус";
        statusBadge.addEventListener("click", () => cycleRequestStatus(item.id));
        statusCell.append(statusBadge);

        const versionCell = document.createElement("td");
        versionCell.textContent = item.targetVersion;

        const actionCell = document.createElement("td");
        if (isDevMode()) {
            const deleteButton = document.createElement("button");
            deleteButton.className = "btn small danger icon-danger";
            deleteButton.textContent = "✕";
            deleteButton.title = "Удалить";
            deleteButton.addEventListener("click", () => deleteRequest(item.id));
            actionCell.append(deleteButton);
        }

        row.append(idCell, titleCell, typeCell, statusCell, versionCell, actionCell);
        requestTable.append(row);
    });
}

function cycleRequestStatus(id) {
    const item = requests.find(req => req.id === id);
    if (!item) return;
    const order = ["new", "planned", "done"];
    const currentIndex = order.indexOf(item.status);
    const nextIndex = (currentIndex + 1) % order.length;
    item.status = order[nextIndex];
    saveData("requests", requests);
    renderRequests();
    window.dispatchEvent(new Event("dataChanged"));
    toast(`Статус изменён: ${requestStatusNames[item.status]}`, "info", 2000);
}

requestForm.addEventListener("submit", event => {
    event.preventDefault();
    const title = requestForm.elements.title.value.trim();
    const type = requestForm.elements.type.value;
    const status = requestForm.elements.status.value;
    const targetVersion = requestForm.elements.targetVersion.value.trim();
    if (!title) {
        alert("Введите название заявки");
        return;
    }
    if (!targetVersion) {
        alert("Укажите целевую версию");
        return;
    }
    requests.push({
        id: nextId("REQ", requests, 3),
        title,
        type,
        status,
        targetVersion
    });
    saveData("requests", requests);
    renderRequests();
    requestForm.reset();
    setDefaultTargetVersion();
    toast("Заявка создана", "success", 2000);
});

setDefaultTargetVersion();
renderRequests();