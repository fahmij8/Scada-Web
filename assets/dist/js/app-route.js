import { getUserInfo, logOut } from "./app-firebaseauth.js";
import { sbInit } from "./app-sbinit.js";
import { dashboardHandler } from "./app-mqtt.js";
import { fillTableAlerts } from "./app-db-alert.js";
import { fillTableDevices } from "./app-db-device.js";
import { handleGraph } from "./app-db-temprature.js";

const loadPage = (page) => {
    fetch(`./assets/pages/${page}.html`)
        .then((response) => {
            return response.text();
        })
        .then((html) => {
            let content = document.querySelector("#starter-content");
            firebase.auth().onAuthStateChanged(async (user) => {
                if (!user && page !== "login") {
                    // Tell user to login
                    content.innerHTML = "Redirecting ...";
                    window.location.href = "./#login";
                    routePage();
                } else if (!user && page === "login") {
                    // Display Login page
                    content.innerHTML = html;
                    $("#login").click(() => {
                        let provider = new firebase.auth.GoogleAuthProvider();
                        firebase.auth().signInWithRedirect(provider);
                    });
                    $("body").attr("class", "bg-gradient-light");
                } else if (user && page === "login") {
                    // Redirect to dashboard
                    content.innerHTML = "Redirecting ...";
                    window.location.href = "./#dashboard";
                    routePage();
                } else {
                    // Display corresponding page
                    await loadShell(html, "#fillContent");
                }
            });
        })
        .catch(() => {
            routeNotFound();
        });
};

const loadShell = async (contentToAppend, elements) => {
    let page = window.location.hash.substr(1);
    let content = document.querySelector("#starter-content");
    fetch(`./assets/pages/navshell.html`)
        .then((response) => {
            return response.text();
        })
        .then((html) => {
            if ($("#accordionSidebar").length === 0) {
                // If shell is not loaded yet
                content.innerHTML = html;
                $("body").removeAttr("class");
                $("body").attr("id", "page-top");
                // Reinitialize Handler
                sbInit();
                $(".handle-all-alerts").click(() => {
                    window.location.href = "#alerts";
                    setTimeout(() => routePage(), 10);
                });
                // Profile Navbar
                getUserInfo().then((data) => {
                    $("#dashboard-name").html(data.displayName);
                    $("#dashboard-pic").attr("src", data.photoURL);
                    $("#dashboard-logout").click(() => {
                        logOut();
                    });
                });
                // Click Navigation Link Handler
                $(".nav-handler").click(() => {
                    window.location.href = `#${page}`;
                    setTimeout(() => routePage(), 10);
                });
            }

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
                console.log("Page Dashboard");
                dashboardHandler();
            } else if (page === "information") {
                console.log("Page Info");
                $("#nav-info").addClass("active");
            } else if (page === "alerts") {
                console.log("Page Alert");
                $("#nav-db").addClass("active");
                $("#nav-db-arr").removeClass("collapsed");
                $("#collapseUtil").addClass("show");
                $("#nav-alerts").addClass("active");
                fillTableAlerts();
            } else if (page === "devices") {
                console.log("Page Device");
                $("#nav-db").addClass("active");
                $("#nav-db-arr").removeClass("collapsed");
                $("#collapseUtil").addClass("show");
                $("#nav-devices").addClass("active");
                fillTableDevices();
            } else if (page === "temprature") {
                handleGraph();
            } else {
                routeNotFound();
            }
        })
        .catch(() => {
            console.log("Page not found!");
            fetch(`./assets/pages/404.html`)
                .then((response) => {
                    return response.text();
                })
                .then(async (html) => {
                    content.innerHTML = html;
                });
        });
};

const routePage = () => {
    let page = window.location.hash.substr(1);
    if (page == "") page = "login";
    loadPage(page);
};

const routeNotFound = () => {
    console.log("Page not found!");
    fetch(`./assets/pages/404.html`)
        .then((response) => {
            return response.text();
        })
        .then(async (html) => {
            await loadShell(html, "#fillContent");
        });
};

export { routePage };
