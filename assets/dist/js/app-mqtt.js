import { getUserInfo } from "./app-firebaseauth.js";

let dashboardHandler = () => {
    // MQTT Stuff
    // Docs : https://www.eclipse.org/paho/files/jsdoc/Paho.MQTT.Client.html
    let isAdmin = false;
    getUserInfo().then((data) => {
        if (data.email === "fahmijabbar@upi.edu") {
            isAdmin = true;
            if (sessionStorage.getItem("warned") === null) {
                Swal.fire({
                    icon: "info",
                    title: "Welcome!",
                    text: `Welcome Admin, Wishing you have a great day!`,
                });
                sessionStorage.setItem("warned", true);
            }
            return false;
        } else {
            if (sessionStorage.getItem("warned") === null) {
                Swal.fire({
                    icon: "warning",
                    title: "Heads up!",
                    text: `Since you're logged in not as Administrator. The only access is granted is viewing data.`,
                });
                sessionStorage.setItem("warned", true);
            }
            return false;
        }
    });
    let clientId = "mqttjs_" + Math.random().toString(16).substr(2, 8);
    let client = new Paho.MQTT.Client("broker.mqttdashboard.com", 8000, clientId);
    let datas;
    let countAlert = 0;
    let alertStop = 0;
    let alertStart = 0;
    $("#nav-dash").addClass("active");
    $(".dash-mqtt-on").click(() => {
        let onFailure = (error) => {
            console.log("Connection Failed!");
            Swal.fire({
                icon: "error",
                title: "Connection Failed",
                text: `Unable to establish connection to MQTT Broker, Reason : ${error} `,
            });
        };
        let onConnect = () => {
            console.log("Client Connected!");
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener("mouseenter", Swal.stopTimer);
                    toast.addEventListener("mouseleave", Swal.resumeTimer);
                },
            });

            Toast.fire({
                icon: "success",
                title: "MQTT Connection Established",
            });
            $(".dash-mqtt-on").removeClass("d-block");
            $(".dash-mqtt-on").addClass("d-none");
            $(".dash-set-value").removeClass("d-none");
            $(".dash-set-value").addClass("d-block");
            $(".dash-mqtt-off").removeClass("d-none");
            $(".dash-mqtt-off").addClass("d-block");
            $(".dash-mqtt-stat").html("Connected");
            // MQTT Method
            client.onConnectionLost = (error) => {
                console.log(error);
                let errorMessage = "";
                JSON.stringify(error.errorCode) == 0 ? (errorMessage = "User closing connection") : (errorMessage = error.errorMessage);
                Swal.fire({
                    icon: "error",
                    title: "Disconnected",
                    text: `You have lost connection to MQTT Broker, Reason : ${errorMessage} `,
                });
            };
            client.onMessageDelivered = (info) => {
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener("mouseenter", Swal.stopTimer);
                        toast.addEventListener("mouseleave", Swal.resumeTimer);
                    },
                });

                Toast.fire({
                    icon: "success",
                    title: "State changed successfully",
                });
            };
            client.onMessageArrived = (message) => {
                $(".dash-mqtt-lu").html(`Today, ${new Date().toLocaleTimeString()}`);
                datas = JSON.parse(message.payloadString);
                console.log(datas);
                firebase
                    .database()
                    .ref(`devices/${new Date().getTime()}`)
                    .once("value", (snapshot) => {
                        if (!snapshot.exists()) {
                            firebase.database().ref(`devices/${new Date().getTime()}`).set(datas);
                        }
                    });
                let progressBar = (temp) => {
                    return ((parseInt(temp) - 20) / 20) * 100;
                };
                $(".dash-chil-temp").html(`${datas["memoryChillerTemp"][0]}°C`);
                $(".dash-chil-prog").css("width", `${progressBar(datas["memoryChillerTemp"][0])}`);
                $(".dash-actual-temp").html(`${datas["memoryActualTemp"][0]}°C`);
                $(".dash-actual-prog").css("width", `${progressBar(datas["memoryActualTemp"][0])}`);
                $(".dash-set-temp").html(`${datas["memorySetTemp"][0]}°C`);
                $(".dash-set-prog").css("width", `${progressBar(datas["memorySetTemp"][0])}`);
                if (datas["memoryActualTemp"][0] === datas["memorySetTemp"][0]) {
                    firebase
                        .database()
                        .ref(`alerts/${new Date().getTime()}`)
                        .once("value", (snapshot) => {
                            if (!snapshot.exists()) {
                                firebase.database().ref(`alerts/${new Date().getTime()}`).set(["Info : Set Value Reached"]);
                            }
                        });
                    countAlert += 1;
                    $(".fill-alerts").prepend(`
                        <a class="dropdown-item d-flex align-items-center">
                            <div class="mr-3">
                                <div class="icon-circle bg-warning">
                                    <i class="far fa-check text-white"></i>
                                </div>
                            </div>
                            <div>
                                <div class="small text-gray-500">${new Date().toLocaleString()}</div>
                                <span class="font-weight-bold">Set Value Reached</span>
                            </div>
                        </a>
                    `);
                    $(".badge-counter").html(countAlert);
                    toastPush("info");
                }

                if (datas["flagSystem"][0] === false) {
                    $(".dash-sys-stat").html("Stopped");
                    if (alertStop === 0) {
                        firebase
                            .database()
                            .ref(`alerts/${new Date().getTime()}`)
                            .once("value", (snapshot) => {
                                if (!snapshot.exists()) {
                                    firebase.database().ref(`alerts/${new Date().getTime()}`).set(["Info : System Stopped"]);
                                }
                            });
                        alertStop = 1;
                        alertStart = 0;
                        countAlert += 1;
                        $(".fill-alerts").prepend(`
                            <a class="dropdown-item d-flex align-items-center">
                                <div class="mr-3">
                                    <div class="icon-circle bg-warning">
                                        <i class="fas fa-cogs text-white"></i>
                                    </div>
                                </div>
                                <div>
                                    <div class="small text-gray-500">${new Date().toLocaleString()}</div>
                                    <span class="font-weight-bold">System is stopped</span>
                                </div>
                            </a>
                        `);
                        $(".badge-counter").html(countAlert);
                        toastPush("info");
                    }
                } else {
                    $(".dash-sys-stat").html("Running");
                    if (alertStart === 0) {
                        firebase
                            .database()
                            .ref(`alerts/${new Date().getTime()}`)
                            .once("value", (snapshot) => {
                                if (!snapshot.exists()) {
                                    firebase.database().ref(`alerts/${new Date().getTime()}`).set(["Info : System Running"]);
                                }
                            });
                        alertStop = 0;
                        alertStart = 1;
                        countAlert += 1;
                        $(".fill-alerts").prepend(`
                            <a class="dropdown-item d-flex align-items-center">
                                <div class="mr-3">
                                    <div class="icon-circle bg-success">
                                        <i class="fas fa-cogs text-white"></i>
                                    </div>
                                </div>
                                <div>
                                    <div class="small text-gray-500">${new Date().toLocaleString()}</div>
                                    <span class="font-weight-bold">System is running</span>
                                </div>
                            </a>
                        `);
                        $(".badge-counter").html(countAlert);
                        toastPush("info");
                    }
                }
                if (datas["flagWarning"][0] === true) {
                    firebase
                        .database()
                        .ref(`alerts/${new Date().getTime()}`)
                        .once("value", (snapshot) => {
                            if (!snapshot.exists()) {
                                firebase.database().ref(`alerts/${new Date().getTime()}`).set(["Warning : Pump 2 works before pump 1 in manual mode"]);
                            }
                        });
                    countAlert += 1;
                    $(".fill-alerts").prepend(`
                        <a class="dropdown-item d-flex align-items-center">
                            <div class="mr-3">
                                <div class="icon-circle bg-warning">
                                    <i class="far fa-exclamation-circle text-white"></i>
                                </div>
                            </div>
                            <div>
                                <div class="small text-gray-500">${new Date().toLocaleString()}</div>
                                <span class="font-weight-bold">Pump 2 works before pump 1 in manual mode</span>
                            </div>
                        </a>
                    `);
                    $(".badge-counter").html(countAlert);
                    toastPush("warning");
                }
                if (datas["flagDanger"][0] === true) {
                    firebase
                        .database()
                        .ref(`alerts/${new Date().getTime()}`)
                        .once("value", (snapshot) => {
                            if (!snapshot.exists()) {
                                firebase.database().ref(`alerts/${new Date().getTime()}`).set(["Danger : Actual temprature >= 40°C"]);
                            }
                        });
                    countAlert += 1;
                    $(".fill-alerts").prepend(`
                        <a class="dropdown-item d-flex align-items-center">
                            <div class="mr-3">
                                <div class="icon-circle bg-danger">
                                    <i class="far fa-exclamation-circle text-white"></i>
                                </div>
                            </div>
                            <div>
                                <div class="small text-gray-500">${new Date().toLocaleString()}</div>
                                <span class="font-weight-bold">Actual temprature >= 40°C</span>
                            </div>
                        </a>
                    `);
                    $(".badge-counter").html(countAlert);
                    toastPush("warning");
                }
                if (datas["buttonStart"][0] === false) {
                    $("#start-check").prop("checked", false);
                    $(".start-status").html("Off");
                } else {
                    $("#start-check").prop("checked", true);
                    $(".start-status").html("On");
                }
                if (datas["buttonStop"][0] === false) {
                    $("#stop-check").prop("checked", false);
                    $(".stop-status").html("Off");
                } else {
                    $("#stop-check").prop("checked", true);
                    $(".stop-status").html("On");
                }
                if (datas["buttonEmergency"][0] === false) {
                    $("#emergency-check").prop("checked", false);
                    $(".emergency-status").html("Off");
                } else {
                    $("#emergency-check").prop("checked", true);
                    $(".emergency-status").html("On");
                }
                if (datas["buttonMode"][0] === false) {
                    $("#mode-check").prop("checked", false);
                    $(".mode-status").html("Manual");
                } else {
                    $("#mode-check").prop("checked", true);
                    $(".mode-status").html("Automatic");
                }
                if (datas["buttonPump1"][0] === false) {
                    $("#pump1-check").prop("checked", false);
                    $(".pump1-status").html("Off");
                } else {
                    $("#pump1-check").prop("checked", true);
                    $(".pump1-status").html("On");
                }
                if (datas["buttonPump2"][0] === false) {
                    $("#pump2-check").prop("checked", false);
                    $(".pump2-status").html("Off");
                } else {
                    $("#pump2-check").prop("checked", true);
                    $(".pump2-status").html("On");
                }
                if (datas["outPump1"][0] === false) {
                    $("#outpump1-check").prop("checked", false);
                    $(".outpump1-status").html("Off");
                } else {
                    $("#outpump1-check").prop("checked", true);
                    $(".outpump1-status").html("On");
                }
                if (datas["outPump2"][0] === false) {
                    $("#outpump2-check").prop("checked", false);
                    $(".outpump2-status").html("Off");
                } else {
                    $("#outpump2-check").prop("checked", true);
                    $(".outpump2-status").html("On");
                }
                if (datas["outChiller"][0] === false) {
                    $("#chiller-check").prop("checked", false);
                    $(".chiller-status").html("Off");
                } else {
                    $("#chiller-check").prop("checked", true);
                    $(".chiller-status").html("On");
                }
                if (datas["outAHU"][0] === false) {
                    $("#ahu-check").prop("checked", false);
                    $(".ahu-status").html("Off");
                } else {
                    $("#ahu-check").prop("checked", true);
                    $(".ahu-status").html("On");
                }
            };
            client.subscribe("scada-fahmi-m5Hj/status/device");
        };
        client.connect({
            onSuccess: onConnect,
            onFailure: onFailure,
        });
    });
    $(".dash-mqtt-off").click(() => {
        client.disconnect();
        console.log("Client Disconnected!");
        $(".dash-mqtt-on").removeClass("d-none");
        $(".dash-mqtt-on").addClass("d-block");
        $(".dash-set-value").removeClass("d-block");
        $(".dash-set-value").addClass("d-none");
        $(".dash-mqtt-off").removeClass("d-block");
        $(".dash-mqtt-off").addClass("d-none");
        $(".dash-mqtt-stat").html("Disconnected");
    });
    $(".dash-set-value").click(async () => {
        if (isAdmin) {
            const { value: temprature } = await Swal.fire({
                title: "Enter your desired temprature",
                input: "number",
                inputLabel: "Only between between 20°C-40°C",
                showCancelButton: true,
                inputValidator: (value) => {
                    if (!value) {
                        return "You need to write something!";
                    } else {
                        if (parseInt(value) < 20 || parseInt(value) > 40) {
                            return "Incorrect temprature!";
                        }
                    }
                },
            });

            if (temprature) {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [parseInt(temprature)],
                    }),
                    2,
                    false
                );
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning",
                text: `You don't have access to do this since you're not administrator.`,
            });
        }
    });
    // Start Button Handler
    $("#start-check").click((state) => {
        if (isAdmin) {
            if (state.target.checked === true) {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [true],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            } else {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [false],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning",
                text: `You don't have access to do this since you're not administrator.`,
            });
            return false;
        }
    });
    // Stop Button Handler
    $("#stop-check").click((state) => {
        if (isAdmin) {
            if (state.target.checked === true) {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [true],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            } else {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [false],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning",
                text: `You don't have access to do this since you're not administrator.`,
            });
            return false;
        }
    });
    // Emergency Button Handler
    $("#emergency-check").click((state) => {
        if (isAdmin) {
            if (state.target.checked === true) {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [true],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            } else {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [false],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning",
                text: `You don't have access to do this since you're not administrator.`,
            });
            return false;
        }
    });
    // Mode Button Handler
    $("#mode-check").click((state) => {
        if (isAdmin) {
            if (state.target.checked === true) {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [true],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            } else {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [false],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning",
                text: `You don't have access to do this since you're not administrator.`,
            });
            return false;
        }
    });
    // Pump 1 Button Handler
    $("#pump1-check").click((state) => {
        if (isAdmin) {
            if (state.target.checked === true) {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [true],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            } else {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [false],
                        buttonPump2: [datas["buttonPump2"][0]],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning",
                text: `You don't have access to do this since you're not administrator.`,
            });
            return false;
        }
    });
    // Pump 2 Button Handler
    $("#pump2-check").click((state) => {
        if (isAdmin) {
            if (state.target.checked === true) {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [true],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            } else {
                client.send(
                    "scada-fahmi-m5Hj/write/device",
                    JSON.stringify({
                        buttonEmergency: [datas["buttonEmergency"][0]],
                        buttonMode: [datas["buttonMode"][0]],
                        buttonPump1: [datas["buttonPump1"][0]],
                        buttonPump2: [false],
                        buttonStart: [datas["buttonStart"][0]],
                        buttonStop: [datas["buttonStop"][0]],
                        memorySetTemp: [datas["memorySetTemp"][0]],
                    }),
                    2,
                    false
                );
            }
        } else {
            Swal.fire({
                icon: "warning",
                title: "Warning",
                text: `You don't have access to do this since you're not administrator.`,
            });
            return false;
        }
    });
};

let toastPush = (icons) => {
    const Toast = Swal.mixin({
        toast: true,
        position: "bottom-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener("mouseenter", Swal.stopTimer);
            toast.addEventListener("mouseleave", Swal.resumeTimer);
        },
    });

    Toast.fire({
        icon: icons,
        title: "Check alert message!",
    });
};

export { dashboardHandler };
