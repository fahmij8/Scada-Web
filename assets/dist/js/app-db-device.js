let fillTableDevices = () => {
    let itemProcessed = 0;
    firebase
        .database()
        .ref(`devices`)
        .once("value", (snapshot) => {
            let dbJson = snapshot.val();
            Object.entries(dbJson).forEach((data) => {
                $("#fill-devices").append(`
                <tr>
                    <td>${new Date(parseInt(data[0])).toLocaleString()}</td>
                    <td>${data[1]["buttonEmergency"][0]}</td>
                    <td>${data[1]["buttonMode"][0]}</td>
                    <td>${data[1]["buttonPump1"][0]}</td>
                    <td>${data[1]["buttonPump2"][0]}</td>
                    <td>${data[1]["buttonStart"][0]}</td>
                    <td>${data[1]["buttonStop"][0]}</td>
                    <td>${data[1]["outAHU"][0]}</td>
                    <td>${data[1]["outChiller"][0]}</td>
                    <td>${data[1]["outPump1"][0]}</td>
                    <td>${data[1]["outPump2"][0]}</td>
                </tr>
                `);
                itemProcessed += 1;
                if (itemProcessed === Object.entries(dbJson).length) {
                    let tables = $("#dataDevices").DataTable({
                        retrieve: true,
                        order: [[0, "desc"]],
                        lengthMenu: [
                            [5, 10, 15, -1],
                            [5, 10, 15, "All"],
                        ],
                        columnDefs: [{ orderable: false, targets: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }],
                        buttons: [
                            { extend: "copy", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Copy" },
                            { extend: "pdf", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Export as PDF" },
                            { extend: "excel", className: "btn btn-primary shadow d-block d-md-inline-block d-lg-inline-block mb-2 mb-md-0 mb-lg-0 mr-0 mr-md-1 mr-lg-1", text: "Export as Excel" },
                        ],
                    });
                    tables.buttons(0, null).containers().appendTo("#exportDevice");
                }
            });
        });
};

export { fillTableDevices };
