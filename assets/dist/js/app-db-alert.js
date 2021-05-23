let fillTableAlerts = () => {
    let itemProcessed = 0;
    firebase
        .database()
        .ref(`alerts`)
        .once("value", (snapshot) => {
            let dbJson = snapshot.val();
            Object.entries(dbJson).forEach((data) => {
                $("#fill-alerts").append(`
                <tr>
                    <td>${new Date(parseInt(data[0])).toLocaleString()}</td>
                    <td>${data[1][0]}</td>
                </tr>
                `);
                itemProcessed += 1;
                if (itemProcessed === Object.entries(dbJson).length) {
                    let tables = $("#dataAlerts").DataTable({
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
                    tables.buttons(0, null).containers().appendTo("#exportAlert");
                }
            });
        });
};

export { fillTableAlerts };
