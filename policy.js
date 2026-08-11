document.addEventListener("DOMContentLoaded", () => {

  const animatedElements = document.querySelectorAll(
    ".legal-card, .legal-navigation, .legal-closing"
  );

  const tocLinks = document.querySelectorAll(".toc-grid a");

  // Sections used by the table of contents
  const sections = document.querySelectorAll(".legal-card");


  /* ==========================================================
     CARD ANIMATION
  ========================================================== */

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    {
      threshold: 0.15,
    }
  );

  animatedElements.forEach((el) => {
    observer.observe(el);
  });


  /* ==========================================================
     TABLE OF CONTENTS ACTIVE LINK
  ========================================================== */

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {

        if (!entry.isIntersecting) {
          return;
        }

        tocLinks.forEach((link) => {
          link.classList.remove("active");
        });

        const activeLink = document.querySelector(
          `.toc-grid a[href="#${entry.target.id}"]`
        );

        if (activeLink) {
          activeLink.classList.add("active");
        }

      });
    },
    {
      threshold: 0.2,
      rootMargin: "-100px 0px -60% 0px",
    }
  );

  sections.forEach((section) => {
    navObserver.observe(section);
  });

});


/* ==========================================================
   MOBILE MENU
========================================================== */

function toggleMenu() {

  document
    .getElementById("navWrapper")
    ?.classList
    .toggle("active");

}


/* ==========================================================
   MOBILE MENU BACKDROP
========================================================== */

const backdrop = document.getElementById("drawerBackdrop");

if (backdrop) {

  backdrop.onclick = function () {

    document
      .getElementById("navWrapper")
      ?.classList
      .remove("active");

  };

}
