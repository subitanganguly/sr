// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {
    logoutUser,
    auth,
    db
} from "../firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";


// =====================================================
// ROLE THAT CAN SEE .for-admin LINKS
// =====================================================

const ADMIN_ROLES = [
    "main-admin",
    "dev-admin",
    "owner"
];


// =====================================================
// SIDEBAR
// =====================================================

document.addEventListener("DOMContentLoaded", function () {

    const sidebarContainer =
        document.getElementById("sidebar-container");


    // =================================================
    // CHECK SIDEBAR CONTAINER
    // =================================================

    if (!sidebarContainer) {
        console.error(
            "Sidebar container not found."
        );
        return;
    }


    // =================================================
    // LOAD SIDEBAR.HTML
    // =================================================

    fetch("sidebar/sidebar.html")

        .then(response => {

            if (!response.ok) {

                throw new Error(
                    "Unable to load sidebar.html"
                );

            }

            return response.text();

        })

        .then(html => {

            // Insert sidebar
            sidebarContainer.innerHTML = html;

            // Initialize sidebar
            initSidebar();

        })

        .catch(error => {

            console.error(
                "Sidebar Error:",
                error
            );

        });


    // =================================================
    // INITIALIZE SIDEBAR
    // =================================================

    function initSidebar() {

        const sidebar =
            document.getElementById("sidebar");

        const overlay =
            document.getElementById("sidebarOverlay");

        const menuButton =
            document.getElementById("menuButton");


        // =================================================
        // CHECK REQUIRED ELEMENTS
        // =================================================

        if (!sidebar) {

            console.error(
                "Sidebar element #sidebar not found."
            );

            return;
        }


        // =================================================
        // MOBILE MENU
        // =================================================

        if (menuButton) {

            menuButton.addEventListener(
                "click",
                function () {

                    sidebar.classList.toggle("show");

                    if (overlay) {

                        overlay.classList.toggle("show");

                    }

                }
            );

        }


        // =================================================
        // CLOSE SIDEBAR
        // =================================================

        if (overlay) {

            overlay.addEventListener(
                "click",
                function () {

                    sidebar.classList.remove("show");

                    overlay.classList.remove("show");

                }
            );

        }


        // =================================================
        // HIGHLIGHT CURRENT PAGE
        // =================================================

        const currentPage =
            window.location.pathname
                .split("/")
                .pop() || "index.html";


        const links =
            sidebar.querySelectorAll(
                ".sidebar-link"
            );


        links.forEach(link => {

            const href =
                link.getAttribute("href");


            if (href === currentPage) {

                link.classList.add("active");

            }

        });


        // =================================================
        // ROLE-BASED VISIBILITY
        // =================================================

        applyRoleVisibility();


        // =================================================
        // LOGOUT BUTTON
        // =================================================

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );


        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                async function () {

                    // Prevent double click
                    logoutBtn.disabled = true;

                    try {

                        await logoutUser();

                    } catch (error) {

                        console.error(
                            "Logout Error:",
                            error
                        );

                        logoutBtn.disabled = false;

                    }

                }
            );

        } else {

            console.warn(
                "Logout button #logoutBtn not found in sidebar."
            );

        }

    }


    // =================================================
    // APPLY ROLE VISIBILITY
    //  - .for-admin            → only main-admin / dev-admin
    //  - .for-measurement-sheet → main-admin / dev-admin
    //                             OR business-admin with
    //                             measurementSheetAccess === true
    // =================================================

    function applyRoleVisibility() {

        const adminLinks =
            document.querySelectorAll(
                ".sidebar-link.for-admin"
            );

        const measurementLinks =
            document.querySelectorAll(
                ".sidebar-link.for-measurement-sheet"
            );


        // Hide by default until we know the role
        adminLinks.forEach(link => {
            link.classList.add("d-none");
        });

        measurementLinks.forEach(link => {
            link.classList.add("d-none");
        });


        onAuthStateChanged(auth, async (user) => {

            if (!user) {
                // Not logged in — nothing to show
                return;
            }

            let role = "";
            let measurementSheetAccess = false;

            try {

                const snap =
                    await get(
                        ref(
                            db,
                            `sr_group/users/${user.uid}`
                        )
                    );

                if (snap.exists()) {

                    const data = snap.val() || {};

                    role =
                        String(data.role || "");

                    // Boolean, stored only for business-admin
                    measurementSheetAccess =
                        data.measurementSheetAccess === true;

                }

            } catch (err) {

                console.warn(
                    "Could not read user role for sidebar:",
                    err
                );

            }


            const isAdmin =
                ADMIN_ROLES.includes(role);


            // =================================================
            // .for-admin LINKS
            // =================================================

            adminLinks.forEach(link => {

                if (isAdmin) {

                    link.classList.remove("d-none");

                } else {

                    link.classList.add("d-none");

                }

            });


            // =================================================
            // MEASUREMENT SHEET LINK
            //  main-admin / dev-admin  → always visible
            //  business-admin           → visible only if
            //                              measurementSheetAccess === true
            //  anything else            → hidden
            // =================================================

            const canSeeMeasurementSheet =
                isAdmin ||
                (
                    role === "business-admin" &&
                    measurementSheetAccess === true
                );


            measurementLinks.forEach(link => {

                if (canSeeMeasurementSheet) {

                    link.classList.remove("d-none");

                } else {

                    link.classList.add("d-none");

                }

            });


            // =================================================
            // HIDE "ADMIN" MENU TITLE IF NOT ADMIN
            // =================================================

            const adminTitle =
                Array.from(
                    document.querySelectorAll(
                        ".sidebar-menu .menu-title"
                    )
                ).find(
                    el => el.textContent
                        .trim()
                        .toUpperCase() === "ADMIN"
                );


            if (adminTitle) {

                if (isAdmin) {

                    adminTitle.classList.remove("d-none");

                } else {

                    adminTitle.classList.add("d-none");

                }

            }

        });

    }

});