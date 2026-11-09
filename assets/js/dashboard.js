initShell();

const deployments = loadData("deployments", startDeployments);
const incidents = loadData("incidents", startIncidents);
const requests = loadData("requests", startRequests);
const releases = loadData("releases", startReleases);

const activeDeployments = deployments.filter(item => item.stage !== "production").length;
const openIncidents = incidents.filter(item => item.status !== "resolved").length;
const slaPercent = getSlaPercent(incidents, settings);
const currentVersion = releases.length
    ? [...releases].sort(compareSemver)[releases.length - 1].version
    : "v1.0.0";

document.getElementById("kpiDeployments").textContent = activeDeployments;
document.getElementById("kpiIncidents").textContent = openIncidents;
document.getElementById("kpiSla").textContent = `${slaPercent}%`;
document.getElementById("kpiVersion").textContent = currentVersion;

let priorityChart = null;
let requestChart = null;

function destroyCharts() {
    if (priorityChart) {
        priorityChart.destroy();
        priorityChart = null;
    }

    if (requestChart) {
        requestChart.destroy();
        requestChart = null;
    }
}

function renderCharts() {
    destroyCharts();

    if (typeof Chart === "undefined") return;

    const isLight = document.body.classList.contains("light");

    Chart.defaults.color = isLight ? "#557084" : "#8bb0c4";
    Chart.defaults.borderColor = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";

    const priorityLevels = ["critical", "high", "medium", "low"];
    const priorityCounts = priorityLevels.map(level =>
        incidents.filter(item => item.priority === level).length
    );

    const requestTypes = ["corrective", "adaptive", "perfective", "preventive"];
    const requestCounts = requestTypes.map(type =>
        requests.filter(item => item.type === type).length
    );

    const priorityCanvas = document.getElementById("priorityChart");
    if (priorityCanvas) {
        priorityChart = new Chart(priorityCanvas, {
            type: "bar",
            data: {
                labels: priorityLevels.map(level => priorityNames[level]),
                datasets: [
                    {
                        label: "Инциденты",
                        data: priorityCounts,
                        backgroundColor: [
                            "rgba(255, 83, 112, 0.7)",
                            "rgba(255, 200, 87, 0.7)",
                            "rgba(0, 229, 255, 0.7)",
                            "rgba(61, 220, 151, 0.7)"
                        ],
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    const requestCanvas = document.getElementById("requestChart");
    if (requestCanvas) {
        requestChart = new Chart(requestCanvas, {
            type: "doughnut",
            data: {
                labels: requestTypes.map(type => requestTypeNames[type]),
                datasets: [
                    {
                        data: requestCounts,
                        backgroundColor: [
                            "rgba(255, 83, 112, 0.75)",
                            "rgba(255, 200, 87, 0.75)",
                            "rgba(0, 229, 255, 0.75)",
                            "rgba(61, 220, 151, 0.75)"
                        ],
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        });
    }
}

window.addEventListener("themeChanged", renderCharts);
renderCharts();