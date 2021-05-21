let fillTableAlerts = () => {
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
            });
            $("#dataTable").DataTable();
        });
};

export { fillTableAlerts };
