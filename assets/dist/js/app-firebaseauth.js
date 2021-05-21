import { routePage } from "./app-route.js";

const firebaseInit = async () => {
    let firebaseConfig = {
        apiKey: "AIzaSyBjOgRwvO0GDHBC16reK1snSsuZer2PxrM",
        authDomain: "scada-fahmi.firebaseapp.com",
        databaseURL: "https://scada-fahmi-default-rtdb.firebaseio.com",
        projectId: "scada-fahmi",
        storageBucket: "scada-fahmi.appspot.com",
        messagingSenderId: "703314064926",
        appId: "1:703314064926:web:d8617e80e067c2b5aae00f",
        measurementId: "G-HS6GB5FR6R",
    };
    await firebase.initializeApp(firebaseConfig);
    await firebase.analytics();
};

const getUserInfo = async () => {
    return await firebase.auth().currentUser;
};

const logOut = () => {
    firebase
        .auth()
        .signOut()
        .then(() => {
            window.location.href = "./index.html";
            routePage();
        })
        .catch((error) => {
            console.error(error);
        });
};

export { firebaseInit, getUserInfo, logOut };
