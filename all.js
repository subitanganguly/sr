
    import {
        logoutUser
    } from "./firebase-config.js";


    document.addEventListener("DOMContentLoaded", () => {

        const profile = sessionStorage.getItem("userProfile");

        if (!profile) {
            window.location.href = "login.html";
            return;
        }

        try {

            const user = JSON.parse(profile);

            const userName =
                user.name ||
                user.username ||
                "User";

            const userRole =
                user.role ||
                "No Role";


            // Display user information
            document.getElementById("userName").textContent = userName;
            document.getElementById("userRole").textContent = userRole;

            document.getElementById("dropdownUserName").textContent = userName;
            document.getElementById("dropdownUserRole").textContent = userRole;


            // Logout
            document
                .getElementById("logoutBtn")
                .addEventListener("click", logoutUser);

        } catch (error) {

            console.error("Invalid user profile:", error);

            sessionStorage.removeItem("userProfile");

            window.location.href = "login.html";
        }

    });

