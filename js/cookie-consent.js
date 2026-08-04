const COOKIE_KEY = "bennyfix-cookie-consent";

function showCookieBanner() {
  const banner = document.getElementById("cookieConsent");
  if (!banner || localStorage.getItem(COOKIE_KEY)) return;
  banner.classList.remove("hidden");
}

function hideCookieBanner(choice) {
  const banner = document.getElementById("cookieConsent");
  localStorage.setItem(COOKIE_KEY, choice);
  banner?.classList.add("hidden");
  window.dispatchEvent(new CustomEvent("cookie-consent:resolved"));
}

document.addEventListener("DOMContentLoaded", () => {
  showCookieBanner();

  document.getElementById("cookieAcceptBtn")?.addEventListener("click", () => {
    hideCookieBanner("accepted");
  });

  document.getElementById("cookieDeclineBtn")?.addEventListener("click", () => {
    hideCookieBanner("declined");
  });
});
