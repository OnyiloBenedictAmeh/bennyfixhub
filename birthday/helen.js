// ==============================
// BIRTHDAY COUNTDOWN
// ==============================

const introScreen = document.getElementById("introScreen");
const birthdayScreen = document.getElementById("birthdayScreen");
const moreScreen = document.getElementById("moreScreen");

const minutesElement = document.getElementById("minutes");
const secondsElement = document.getElementById("seconds");

const surpriseBtn = document.getElementById("surpriseBtn");
const wishScreen = document.getElementById("wishScreen");
const birthdayCake = document.getElementById("birthdayCake");
const wishResult = document.getElementById("wishResult");
const continueBtn = document.getElementById("continueBtn");
const musicToggle = document.getElementById("musicToggle");
const birthdayMusic = document.getElementById("birthdayMusic");
const musicIcon = document.getElementById("musicIcon");
const musicText = document.getElementById("musicText");
const celebrationLayer =
    document.getElementById("celebrationLayer");
const balloonContainer =
    document.getElementById("balloonContainer");
    const fireworksContainer =
    document.getElementById("fireworksContainer");
// 10 minutes
let remainingTime = 10;


function updateCountdown() {

    const minutes = Math.floor(remainingTime / 60);

    const seconds = remainingTime % 60;

    minutesElement.textContent =
        String(minutes).padStart(2, "0");

    secondsElement.textContent =
        String(seconds).padStart(2, "0");


    // Little messages while waiting
    const note = document.querySelector(".countdown-note");

    if (remainingTime > 540) {

        note.textContent = "Be patient... 👀";

    } else if (remainingTime > 420) {

        note.textContent = "Something good takes time... ✨";

    } else if (remainingTime > 300) {

        note.textContent = "Still waiting? 😂";

    } else if (remainingTime > 120) {

        note.textContent = "We're getting closer...";

    } else if (remainingTime > 30) {

        note.textContent = "Almost there 👀";

    } else {

        note.textContent = "Get ready... 🎉";

        document
            .getElementById("countdown")
            .classList.add("last-seconds");

    }


    if (remainingTime <= 0) {

        clearInterval(timer);

        revealBirthday();

        return;

    }

    remainingTime--;

}

// ==============================
// START COUNTDOWN AFTER INTRO
// ==============================

let timer;

setTimeout(() => {

    updateCountdown();

    timer = setInterval(updateCountdown, 1000);

}, 12000);

// ==============================
// FLOATING BALLOONS
// ==============================

function createBalloons() {

    const balloonCount = 18;

    for (let i = 0; i < balloonCount; i++) {

        const balloon = document.createElement("div");

        balloon.classList.add("balloon");

        // Random horizontal position
        balloon.style.left =
            Math.random() * 100 + "%";

        // Random size
        const size =
            Math.random() * 25 + 45;

        balloon.style.width = size + "px";
        balloon.style.height = size * 1.25 + "px";

        // Different balloon colors
        const colors = [
            "#ff6fae",
            "#c58cff",
            "#ffcf70",
            "#6dd5ff",
            "#ff8b8b",
            "#8ff0c8"
        ];

        balloon.style.background =
            colors[Math.floor(Math.random() * colors.length)];

        // Different speeds
        balloon.style.animationDuration =
            (Math.random() * 5 + 7) + "s";

        // Stagger the balloons
        balloon.style.animationDelay =
            (Math.random() * 3) + "s";

        // Slightly different starting rotation
        balloon.style.transform =
            `rotate(${Math.random() * 20 - 10}deg)`;

        balloonContainer.appendChild(balloon);

        // Remove after animation
        setTimeout(() => {

            balloon.remove();

        }, 13000);

    }

}
// ==============================
// REVEAL BIRTHDAY
// ==============================
function revealBirthday() {

    introScreen.style.display = "none";

    celebrationLayer.classList.remove("hidden");

    createConfetti();
    createBalloons();

    createFirework();

    setTimeout(createFirework, 900);
    setTimeout(createFirework, 1800);
    setTimeout(createFirework, 2800);
    setTimeout(createFirework, 3800);

    // Let the celebration breathe
    setTimeout(() => {

        celebrationLayer.style.opacity = "0";

        celebrationLayer.style.transition =
            "opacity 1s ease";

        setTimeout(() => {

            celebrationLayer.style.display = "none";

            birthdayScreen.classList.remove("hidden");

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }, 1000);

    }, 4500);

}

// ==============================
// SECOND SURPRISE
// ==============================

surpriseBtn.addEventListener("click", () => {

    birthdayScreen.style.display = "none";

    wishScreen.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});
// ==============================
// MAKE A WISH
// ==============================

birthdayCake.addEventListener("click", () => {

    birthdayCake.classList.add("candles-out");

    wishResult.classList.remove("hidden");

    continueBtn.classList.remove("hidden");

    createConfetti();

});
// ==============================
// OPEN LETTER
// ==============================

continueBtn.addEventListener("click", () => {

    wishScreen.style.display = "none";

    moreScreen.classList.remove("hidden");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

});
// ==============================
// CONFETTI
// ==============================

function createConfetti() {

    const container = document.getElementById("confetti");

    const pieces = 100;

    for (let i = 0; i < pieces; i++) {

        const piece = document.createElement("div");

        piece.classList.add("confetti");

        piece.style.left =
            Math.random() * 100 + "vw";

        piece.style.animationDuration =
            (Math.random() * 3 + 2) + "s";

        piece.style.animationDelay =
            Math.random() * 0.8 + "s";

        piece.style.transform =
            `rotate(${Math.random() * 360}deg)`;

        piece.style.opacity =
            Math.random() * 0.7 + 0.3;

        container.appendChild(piece);


        setTimeout(() => {
            piece.remove();
        }, 6000);

    }

}
// ==============================
// BIRTHDAY MUSIC
// ==============================

musicToggle.addEventListener("click", async () => {

    if (birthdayMusic.paused) {

        try {

            await birthdayMusic.play();

            musicIcon.textContent = "🔊";
            musicText.textContent = "Playing";

            musicToggle.classList.add("music-playing");

        } catch (error) {

            console.log("Music could not start:", error);

        }

    } else {

        birthdayMusic.pause();

        musicIcon.textContent = "♪";
        musicText.textContent = "Play";

        musicToggle.classList.remove("music-playing");

    }

});
// ==============================
// FIREWORKS
// ==============================

function createFirework() {

    const firework =
        document.createElement("div");

    firework.classList.add("firework");

    // Keep fireworks mostly around the edges
    // so they don't cover Helen's name.

    firework.style.left =
        (Math.random() * 80 + 10) + "%";

    firework.style.top =
        (Math.random() * 45 + 10) + "%";

    const colors = [
        "#ff8bd8",
        "#c58cff",
        "#ffcf70",
        "#6dd5ff",
        "#8ff0c8",
        "#ffffff"
    ];

    firework.style.color =
        colors[Math.floor(Math.random() * colors.length)];

    fireworksContainer.appendChild(firework);

    setTimeout(() => {
        firework.remove();
    }, 1500);
}