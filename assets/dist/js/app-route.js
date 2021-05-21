import { getUserInfo, logOut } from "./app-firebaseauth.js";
import { sbInit } from "./app-sbinit.js";
import { dashboardHandler } from "./app-mqtt.js";
import { fillTableAlerts } from "./app-db-alert.js";
import { fillTableDevices } from "./app-db-device.js";

const loadPage = (page) => {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
            let content = document.querySelector("#starter-content");
            if (xhttp.status === 200) {
                firebase.auth().onAuthStateChanged(async (user) => {
                    if (!user && page !== "login") {
                        // Tell user to login
                        window.location.href = "./#login";
                        routePage();
                    } else if (!user && page === "login") {
                        // Display Login page
                        content.innerHTML = xhttp.responseText;
                        $("#login").click(() => {
                            let provider = new firebase.auth.GoogleAuthProvider();
                            firebase.auth().signInWithRedirect(provider);
                        });
                        $("body").attr("class", "bg-gradient-light");
                    } else if (user && page === "login") {
                        // Redirect to dashboard
                        window.location.href = "./#dashboard";
                        routePage();
                    } else {
                        // Display corresponding page
                        let contentPage = xhttp.responseText;
                        await loadShell(contentPage, "#fillContent");
                    }
                });
            } else {
                // Display not found page
                xhttp.open("GET", `./assets/pages/404.html`, true);
                xhttp.send();
                if (xhttp.readyState === 4) {
                    if (xhttp.status === 200) {
                        loadShell(xhttp.responseText, "#fillContent");
                    }
                }
            }
        }
    };
    xhttp.open("GET", `./assets/pages/${page}.html`, true);
    xhttp.send();
};

const loadShell = async (contentToAppend, elements) => {
    let page = window.location.hash.substr(1);
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
            let content = document.querySelector("#starter-content");
            if (xhttp.status === 200) {
                if ($("#accordionSidebar").length === 0) {
                    // If shell is not loaded yet
                    content.innerHTML = xhttp.responseText;
                    $("body").removeAttr("class");
                    $("body").attr("id", "page-top");
                    // Reinitialize Handler
                    sbInit();
                    // Profile Navbar
                    getUserInfo().then((data) => {
                        $("#dashboard-name").html(data.displayName);
                        $("#dashboard-pic").attr("src", data.photoURL);
                        $("#dashboard-logout").click(() => {
                            logOut();
                        });
                    });
                }
                // Click Navigation Link Handler
                $(".nav-handler").click(() => {
                    window.location.href = `#${page}`;
                    setTimeout(() => routePage(), 10);
                });

                // Clear navigation active state
                $("#nav-dash").removeClass("active");
                $("#nav-info").removeClass("active");
                $("#nav-db").removeClass("active");
                $("#nav-db-arr").addClass("collapsed");
                $("#collapseUtil").removeClass("show");
                $("#nav-alerts").removeClass("active");
                $("#nav-devices").removeClass("active");

                // Append html
                document.querySelector(elements).innerHTML = contentToAppend;

                if (page === "dashboard") {
                    dashboardHandler();
                } else if (page === "information") {
                    $("#nav-info").addClass("active");
                } else if (page === "alerts") {
                    $("#nav-db").addClass("active");
                    $("#nav-db-arr").removeClass("collapsed");
                    $("#collapseUtil").addClass("show");
                    $("#nav-alerts").addClass("active");
                    fillTableAlerts();
                } else if (page === "devices") {
                    $("#nav-db").addClass("active");
                    $("#nav-db-arr").removeClass("collapsed");
                    $("#collapseUtil").addClass("show");
                    $("#nav-devices").addClass("active");
                    fillTableDevices();
                }
            } else {
                xhttp.open("GET", `./assets/pages/404.html`, true);
                xhttp.send();
                content.innerHTML = xhttp.responseText;
            }
        }
    };
    xhttp.open("GET", `./assets/pages/navshell.html`, true);
    xhttp.send();
};

const routePage = () => {
    let page = window.location.hash.substr(1);
    if (page == "") page = "login";
    setTimeout(() => loadPage(page), 300);
};

export { routePage };
