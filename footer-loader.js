// =========================
// SHARED FOOTER LOADER
// =========================
// Every public page keeps an empty <footer id="siteFooter"></footer> shell.
// This fetches footer.html once and injects it, then wires up the bits that
// depend on the footer actually being in the DOM (copyright year, the
// mobile accordion toggle) — those can't run until after injection.

async function loadFooter() {
  const target = document.getElementById("siteFooter");
  if (!target) return;

  try {
    const res = await fetch("footer.html");
    if (!res.ok) throw new Error(`Footer fetch failed: ${res.status}`);
    target.innerHTML = await res.text();
  } catch (err) {
    console.error("Could not load footer:", err);
    return;
  }

  const copyrightEl = target.querySelector(".copyright");
  if (copyrightEl) {
    copyrightEl.textContent = `© ${new Date().getFullYear()} BennyFix Hub`;
  }

  target.querySelectorAll(".footer-section h4").forEach((h4) => {
    h4.addEventListener("click", () => {
      h4.parentElement.classList.toggle("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", loadFooter);