m// menu.js

window.toggleMenu = function () {
  const navWrapper = document.getElementById("navWrapper");
  const drawerBackdrop = document.getElementById("drawerBackdrop");
  const icon = document.querySelector(".hamburger i");

  if (!navWrapper || !icon) return;

  navWrapper.classList.toggle("open");
  drawerBackdrop?.classList.toggle("show");

  if (navWrapper.classList.contains("open")) {
    icon.classList.replace("bx-menu", "bx-x");
  } else {
    icon.classList.replace("bx-x", "bx-menu");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const drawerBackdrop = document.getElementById("drawerBackdrop");

  drawerBackdrop?.addEventListener("click", () => {
    document.getElementById("navWrapper")?.classList.remove("open");
    drawerBackdrop.classList.remove("show");

    const icon = document.querySelector(".hamburger i");
    icon?.classList.replace("bx-x", "bx-menu");
  });
});