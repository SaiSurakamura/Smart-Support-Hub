initShell();

let requests = loadData("requests", startRequests);

const requestTable = document.getElementById("requestTable");
const requestForm = document.getElementById("requestForm");

function setDefaultTargetVersion() {
    const targetInput = requestForm.elements.targetVersion;
    targetInput.value = getNextVersion(getCurrentVersion(), "minor");
}

function renderRequests() {
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
        statusCell.append(makeBadge(requestStatusNames[item.status] || item.status, item.status));

        const versionCell = document.createElement("td");
        versionCell.textContent = item.targetVersion;

        const actionCell = document.createElement("td");
        actionCell.className = "dev-only-col";
        const deleteButton = document.createElement("button");
        deleteButton.className = "btn small danger icon-danger dev-only";
        deleteButton.textContent = "✕";
        deleteButton.title = "Удалить (режим разработчика)";
        deleteButton.addEventListener("click", () => deleteRequest(item.id));
        actionCell.append(deleteButton);
        row.append(actionCell);

        row.append(idCell, titleCell, typeCell, statusCell, versionCell);
        requestTable.append(row);
    });
}

function deleteRequest(id) {
    if (!confirm("Удалить заявку " + id + "?")) return;
    requests = requests.filter(item => item.id !== id);
    saveData("requests", requests);
    renderRequests();
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
});

setDefaultTargetVersion();
renderRequests();