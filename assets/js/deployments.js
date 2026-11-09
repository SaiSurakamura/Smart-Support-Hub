initShell();

let deployments = loadData("deployments", startDeployments);
const deploymentTable = document.getElementById("deploymentTable");
const deploymentForm = document.getElementById("deploymentForm");

function renderDeployments() {
    deploymentTable.innerHTML = "";

    deployments.forEach(item => {
        const row = document.createElement("tr");

        const percent = item.total > 0
            ? Math.round((item.done / item.total) * 100)
            : 0;

        const cells = [
            item.id,
            item.client,
            item.product,
            item.version,
            stageNames[item.stage] || item.stage,
            null,
            item.owner,
            formatDate(item.plannedDate)
        ];

        cells.forEach(value => {
            const cell = document.createElement("td");

            if (value === null) {
                const wrapper = document.createElement("div");
                wrapper.className = "progress";

                const bar = document.createElement("span");
                bar.style.width = `${percent}%`;

                wrapper.append(bar);
                cell.append(wrapper);

                const label = document.createElement("div");
                label.className = "hint";
                label.textContent = `${percent}%`;
                cell.append(label);
            } else {
                cell.textContent = value;
            }

            row.append(cell);
        });

        deploymentTable.append(row);
    });
}

deploymentForm.addEventListener("submit", event => {
    event.preventDefault();

    const client = deploymentForm.elements.client.value.trim();
    const product = deploymentForm.elements.product.value.trim();
    const version = deploymentForm.elements.version.value.trim();
    const stage = deploymentForm.elements.stage.value;
    const owner = deploymentForm.elements.owner.value.trim();
    const plannedDate = deploymentForm.elements.plannedDate.value;
    const done = Number(deploymentForm.elements.done.value);
    const total = Number(deploymentForm.elements.total.value);

    if (!client || !product || !version || !owner || !plannedDate) {
        alert("Заполните все обязательные поля");
        return;
    }

    if (total <= 0) {
        alert("Всего шагов должно быть больше нуля");
        return;
    }

    const safeDone = Math.max(0, Math.min(total, done));

    deployments.push({
        id: nextId("DEP", deployments, 2),
        client,
        product,
        version,
        stage,
        owner,
        plannedDate,
        done: safeDone,
        total
    });

    saveData("deployments", deployments);
    renderDeployments();
    deploymentForm.reset();
});

renderDeployments();