import { db, collection, query, getDocs } from "./firebase.js";

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getTime(value) {
  if (!value) return 0;
  if (value.toDate) return value.toDate().getTime();
  if (value.seconds) return value.seconds * 1000;
  return 0;
}

function renderCard(item) {
  const rating = item.rating || 0;
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

  return `
    <div class="testimonial-card">
      <div class="testimonial-stars">${stars}</div>
      ${item.review ? `<p class="testimonial-text">"${escapeHtml(item.review)}"</p>` : ""}
      <strong class="testimonial-name">${escapeHtml(item.customerName || "BennyFix Customer")}</strong>
      ${item.deviceName ? `<small class="testimonial-device">${escapeHtml(item.deviceName)}</small>` : ""}
    </div>
  `;
}

async function loadTestimonials() {
  const grid = document.getElementById("testimonialsGrid");
  if (!grid) return;

  try {
    const snap = await getDocs(query(collection(db, "testimonials")));
    const items = [];

    snap.forEach((docSnap) => items.push(docSnap.data()));

    items.sort((a, b) => getTime(b.approvedAt) - getTime(a.approvedAt));

    const top = items.slice(0, 6);

    if (!top.length) {
      grid.closest(".testimonials")?.classList.add("hidden");
      return;
    }

    grid.innerHTML = top.map(renderCard).join("");
  } catch (err) {
    console.error("Could not load testimonials:", err);
  }
}

document.addEventListener("DOMContentLoaded", loadTestimonials);