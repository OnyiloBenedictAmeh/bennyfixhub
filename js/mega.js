// =========================
// MEGA MENU
// =========================

let mega;
let backdrop;
let megaTimeout;
let resizeTimeout;

const megaData = {
  support: {
    icon: "bx-support",
    title: "Get expert help anytime, anywhere",
    text: "Our experts help you get the most out of your plan with premium expert tech support.",
    cards: [
      { img: "phone.jpg", title: "Phone Support", desc: "Fix software and hardware issues." },
      { img: "laptop.jpg", title: "Laptop Support", desc: "Troubleshoot Windows and Mac devices." },
      { img: "tablet.jpg", title: "Tablet Support", desc: "Get help with tablets and accessories." },
      { img: "diagnostic.jpg", title: "Diagnostics", desc: "Run tests and identify problems." },
    ],
  },
  repairs: {
    icon: "bx-wrench",
    title: "Fast & Reliable Repairs",
    text: "Certified technicians ready to fix your devices with warranty protection.",
    cards: [
      { img: "repair-phone.jpg", title: "Phone Repair", desc: "Fix your phone's issues." },
      { img: "repair-laptop.jpg", title: "Laptop Repair", desc: "Get your laptop fixed." },
      { img: "repair-tablet.jpg", title: "Tablet Repair", desc: "Repair your tablet." },
      { img: "repair-pc.jpg", title: "PC Repair", desc: "Fix your PC issues." },
    ],
  },
  sales: {
    icon: "bx-dollar-circle",
    title: "Maximize Your Device's Value",
    text: "Sell your old devices and get cash for them. We buy used devices at fair prices.",
    cards: [
      { img: "sell-phone.jpg", title: "Sell Phone", desc: "Get cash for your old phone." },
      { img: "sell-laptop.jpg", title: "Sell Laptop", desc: "Maximize the value of your old laptop." },
      { img: "sell-tablet.jpg", title: "Sell Tablet", desc: "Turn your unused tablet into cash." },
      { img: "sell-pc.jpg", title: "Sell PC", desc: "Sell your old PC and get a fair price." },
    ],
  },
};

function loadMega(menu) {
  const data = megaData[menu];
  if (!data) return;

  document.getElementById("megaTitle").textContent = data.title;
  document.getElementById("megaText").textContent = data.text;

  const iconEl = document.getElementById("megaIcon");
  if (iconEl) iconEl.innerHTML = `<i class="bx ${data.icon}"></i>`;

  const grid = document.getElementById("megaGrid");
  grid.innerHTML = "";

  data.cards.forEach((card) => {
    const el = document.createElement("div");
    el.className = "mega-item";
    el.innerHTML = `
      <img src="${card.img}" alt="${card.title}">
      <div class="mega-item-content">
        <h4>${card.title}</h4>
        <p>${card.desc}</p>
      </div>
    `;
    grid.appendChild(el);
  });
}

function openMega(tab) {
  if (!mega) return;
  mega.classList.add("show");
  backdrop?.classList.add("show");
  loadMega(tab);
}

function closeMega() {
  if (!mega) return;
  mega.classList.remove("show");
  backdrop?.classList.remove("show");
}

function updateMegaLayout() {
  document.querySelectorAll(".mega-content").forEach((container) => {
    const items = [...container.querySelectorAll(".mega-box")].filter(
      (el) => el.offsetParent !== null
    ).length;

    if (items === 3) container.classList.add("three-items");
    else container.classList.remove("three-items");
  });
}

// =========================
// INIT ON DOM READY
// =========================
document.addEventListener("DOMContentLoaded", () => {
  mega = document.getElementById("mega");
  backdrop = document.querySelector(".mega-backdrop");

  // Drawer backdrop (mobile)
  const navWrapper = document.getElementById("navWrapper");
  const drawerBackdrop = document.querySelector(".drawer-backdrop");

  drawerBackdrop?.addEventListener("click", () => {
    navWrapper.classList.remove("open");
    drawerBackdrop.classList.remove("show");

    document.querySelector(".hamburger i")?.classList.remove("bx-x");
    document.querySelector(".hamburger i")?.classList.add("bx-menu");

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.remove("open");
      const mobileMega = item.querySelector(".mobile-mega");
      if (mobileMega) mobileMega.innerHTML = "";
    });
  });

  // Nav item hover + click
  const items = document.querySelectorAll(".nav-item");

  items.forEach((item) => {
    const menu = item.dataset.menu;
    if (!menu) return;

    item.addEventListener("mouseenter", () => {
      if (window.innerWidth > 900) {
        clearTimeout(megaTimeout);
        document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
        item.classList.add("active");
        openMega(menu);
      }
    });

    item.addEventListener("mouseleave", () => {
      if (window.innerWidth > 900) {
        megaTimeout = setTimeout(closeMega, 200);
      }
    });

    item.addEventListener("click", (e) => {
      if (window.innerWidth <= 900) {
        e.preventDefault();

        const mobileMega = item.querySelector(".mobile-mega");
        const data = megaData[menu];

        // Close other open menus
        document.querySelectorAll(".nav-item").forEach((nav) => {
          if (nav !== item) {
            nav.classList.remove("open");
            const box = nav.querySelector(".mobile-mega");
            if (box) box.innerHTML = "";
          }
        });

        // Toggle current
        if (item.classList.contains("open")) {
          item.classList.remove("open");
          mobileMega.innerHTML = "";
          return;
        }

        item.classList.add("open");
        mobileMega.innerHTML = `
          <div class="mobile-mega-header">
            <h4>${data.title}</h4>
            <p>${data.text}</p>
          </div>
          <div class="mega-grid">
            ${data.cards
              .map(
                (card) => `
              <div class="mega-card">
                <img src="${card.img}" alt="${card.title}">
                <div class="mega-card-content">
                  <h4>${card.title}</h4>
                  <p>${card.desc}</p>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `;
      }
    });
  });

  mega?.addEventListener("mouseenter", () => clearTimeout(megaTimeout));
  mega?.addEventListener("mouseleave", closeMega);
  backdrop?.addEventListener("click", closeMega);

  updateMegaLayout();
});

window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateMegaLayout, 150);
});