initShell();

let releases = loadData("releases", startReleases);

const releaseTable = document.getElementById("releaseTable");
const releaseForm = document.getElementById("releaseForm");

const nextCurrent = document.getElementById("nextCurrent");
const nextLevel = document.getElementById("nextLevel");
const nextResult = document.getElementById("nextResult");
const calcNextButton = document.getElementById("calcNextButton");

function setDefaults() {
    const dateInput = releaseForm.elements.releaseDate;
    dateInput.value = new Date().toISOString().slice(0, 10);

    nextCurrent.value = getCurrentVersion();
    updateNextHint();
}

function updateNextHint() {
    nextResult.textContent = getNextVersion(nextCurrent.value, nextLevel.value);
}

function renderReleases() {
    releaseTable.innerHTML = "";

    const sorted = [...releases].sort(compareSemver);

    sorted.forEach(item => {
        const row = document.createElement("tr");

        const versionCell = document.createElement("td");
        versionCell.textContent = item.version;

        const dateCell = document.createElement("td");
        dateCell.textContent = formatDate(item.date);

        const levelCell = document.createElement("td");
        levelCell.append(makeBadge(releaseLevelNames[item.level] || item.level, item.level));

        const changesCell = document.createElement("td");
        changesCell.textContent = Array.isArray(item.changes)
            ? item.changes.join("; ")
            : "—";

        row.append(versionCell, dateCell, levelCell, changesCell);
        releaseTable.append(row);
    });
}

releaseForm.addEventListener("submit", event => {
    event.preventDefault();

    const rawVersion = releaseForm.elements.version.value.trim();
    const date = releaseForm.elements.releaseDate.value;
    const level = releaseForm.elements.level.value;
    const changes = parseChanges(releaseForm.elements.changes.value);

    if (!/^v?\d+\.\d+\.\d+$/.test(rawVersion)) {
        alert("Версия должна быть в формате v1.2.3");
        return;
    }

    if (!date) {
        alert("Укажите дату релиза");
        return;
    }

    if (changes.length === 0) {
        alert("Добавьте хотя бы одно изменение");
        return;
    }

    const version = rawVersion.startsWith("v") ? rawVersion : `v${rawVersion}`;

    releases.push({
        id: nextId("REL", releases, 3),
        version,
        date,
        level,
        changes
    });

    saveData("releases", releases);
    renderReleases();
    updateTopVersion();
    releaseForm.reset();
    setDefaults();
});

calcNextButton.addEventListener("click", updateNextHint);
nextCurrent.addEventListener("input", updateNextHint);
nextLevel.addEventListener("change", updateNextHint);

setDefaults();
renderReleases();