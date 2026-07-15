document.addEventListener("DOMContentLoaded", () => {
  const animatedElements = document.querySelectorAll(
    ".legal-card, .legal-navigation, .legal-closing",
  );
  const tocLinks = document.querySelectorAll(".toc-grid a");

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
    },
  );

  animatedElements.forEach((el) => observer.observe(el));
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          tocLinks.forEach((link) => {
            link.classList.remove("active");
          });

          const activeLink = document.querySelector(
            `.toc-grid a[href="#${entry.target.id}"]`,
          );

          if (activeLink) {
            activeLink.classList.add("active");
          }
        }
      });
    },
    {
      threshold: 0.2,
      rootMargin: "-100px 0px -60% 0px",
    },
  );

  sections.forEach((section) => {
    navObserver.observe(section);
  });
});
