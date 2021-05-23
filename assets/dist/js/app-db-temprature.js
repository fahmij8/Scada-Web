let handleGraph = () => {
    let itemProcessed = 0;
    let dataset = [[], [], [], [], []];
    firebase
        .database()
        .ref(`devices`)
        .once("value", (snapshot) => {
            let dbJson = snapshot.val();
            Object.entries(dbJson)
                .reverse()
                .slice(0, 10)
                .forEach((data) => {
                    dataset[0].push(new Date(parseInt(data[0])).getHours() + ":" + new Date(parseInt(data[0])).getMinutes());
                    dataset[1].push(data[1]["memoryActualTemp"][0]);
                    dataset[2].push(data[1]["memoryChillerTemp"][0]);
                    dataset[3].push(data[1]["memorySetTemp"][0]);
                    itemProcessed += 1;
                    if (itemProcessed === 10) {
                        dataset[4].push(new Date(parseInt(data[0])).toLocaleDateString());
                        dataset[0].reverse();
                        dataset[1].reverse();
                        dataset[2].reverse();
                        dataset[3].reverse();
                        generateChart(document.getElementById("actTempChart"), dataset[0], dataset[1], "Actual Temprature", dataset[4]);
                        generateChart(document.getElementById("chiTempChart"), dataset[0], dataset[2], "Chiller Temprature", dataset[4]);
                        generateChart(document.getElementById("setTempChart"), dataset[0], dataset[3], "Set Temprature", dataset[4]);
                    }
                });
            itemProcessed = 0;
            Object.entries(dbJson)
                .reverse()
                .forEach((data) => {
                    $("#fill-temp").append(`
                    <tr>
                        <td>${new Date(parseInt(data[0])).toLocaleString()}</td>
                        <td>${data[1]["memoryActualTemp"][0]}°C</td>
                        <td>${data[1]["memoryChillerTemp"][0]}°C</td>
                        <td>${data[1]["memorySetTemp"][0]}°C</td>
                    </tr>
                    `);
                    itemProcessed += 1;
                    if (itemProcessed === Object.entries(dbJson).length) {
                        let tables = $("#dataTemp").DataTable({
                            retrieve: true,
                            order: [[0, "desc"]],
                            lengthMenu: [
                                [5, 20, 50, -1],
                                [5, 20, 50, "All"],
                            ],
                            buttons: [
                                { extend: "copy", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Copy" },
                                { extend: "pdf", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Export as PDF" },
                                { extend: "excel", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Export as Excel" },
                            ],
                        });
                        tables.buttons(0, null).containers().appendTo("#exportTemp");
                    }
                });
        });
};

let generateChart = (canvas, datasetLabel, datasetData, label, lu) => {
    (Chart.defaults.global.defaultFontFamily = "Nunito"), '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
    Chart.defaults.global.defaultFontColor = "#858796";
    new Chart(canvas, {
        type: "line",
        data: {
            labels: datasetLabel,
            datasets: [
                {
                    label: label,
                    lineTension: 0.3,
                    backgroundColor: "rgba(78, 115, 223, 0.05)",
                    borderColor: "rgba(78, 115, 223, 1)",
                    pointRadius: 3,
                    pointBackgroundColor: "rgba(78, 115, 223, 1)",
                    pointBorderColor: "rgba(78, 115, 223, 1)",
                    pointHoverRadius: 3,
                    pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                    pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                    pointHitRadius: 10,
                    pointBorderWidth: 2,
                    data: datasetData,
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 25,
                    top: 25,
                    bottom: 0,
                },
            },
            scales: {
                xAxes: [
                    {
                        time: {
                            unit: "date",
                        },
                        gridLines: {
                            display: false,
                            drawBorder: false,
                        },
                        ticks: {
                            maxTicksLimit: 7,
                        },
                    },
                ],
                yAxes: [
                    {
                        ticks: {
                            maxTicksLimit: 5,
                            padding: 10,
                            callback: function (value, index, values) {
                                return value + "°C";
                            },
                        },
                        gridLines: {
                            color: "rgb(234, 236, 244)",
                            zeroLineColor: "rgb(234, 236, 244)",
                            drawBorder: false,
                            borderDash: [2],
                            zeroLineBorderDash: [2],
                        },
                    },
                ],
            },
            legend: {
                display: false,
            },
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                titleMarginBottom: 10,
                titleFontColor: "#6e707e",
                titleFontSize: 14,
                borderColor: "#dddfeb",
                borderWidth: 1,
                xPadding: 15,
                yPadding: 15,
                displayColors: false,
                intersect: false,
                mode: "index",
                caretPadding: 10,
                callbacks: {
                    title: function (tooltipItem, chart) {
                        return tooltipItem[0].yLabel + "°C";
                    },
                    label: function (tooltipItem, chart) {
                        var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || "";
                        return "Last Updated : " + lu + " - " + tooltipItem.xLabel;
                    },
                },
            },
        },
    });
};

export { handleGraph };
