const gallery = document.querySelector(".gallery");
const orderings = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
];
const containers = Array.from(gallery.children);
const randomOrder = orderings[Math.floor(Math.random() * orderings.length)];
randomOrder.forEach((i) => gallery.appendChild(containers[i]));

const images = document.querySelectorAll(".image-container");
let cardsClickable = false;
const details = document.querySelector(".details");
const descriptionDiv = document.querySelector(".description");
const body = document.body;
const header = document.querySelector("header");
const moreButton = document.querySelector(".more-button");
const autonomicNote = document.getElementById("autonomic-note");
const introOverlay = document.getElementById("intro-overlay");
const introText1 = document.getElementById("intro-text1");
const introText2 = document.getElementById("intro-text2");
const introCard = document.getElementById("intro-card");
const clickTip = document.getElementById("click-tip");
const skipButton = document.getElementById("skip-button");
let introPlayed = false;
const mainMenu = document.querySelector(".main-menu");
const hamburger = document.querySelector(".hamburger");
const menuOverlay = document.getElementById("menu-overlay");
hamburger.addEventListener("click", () => {
  const isOpen = mainMenu.classList.toggle("open");
  if (isOpen) {
    menuOverlay.classList.remove("hidden");
  } else {
    menuOverlay.classList.add("hidden");
  }
});
menuOverlay.addEventListener("click", () => {
  mainMenu.classList.remove("open");
  menuOverlay.classList.add("hidden");
});
const mainContent = document.getElementById("main-content");
const contentSections = document.querySelectorAll(".content-section");
const subtext = document.querySelector(".subtext");
function adjustIntroOverlaySize() {
  introOverlay.style.height = `${window.innerHeight}px`;
  introOverlay.style.width = `${window.innerWidth}px`;
}
window.addEventListener("load", adjustIntroOverlaySize);
window.addEventListener("resize", adjustIntroOverlaySize);
adjustIntroOverlaySize();
const additionalData = {
  "1image": {
    color: "rgb(102, 179, 255)",
    text: `からだを止めて身を守る\n急ブレーキの役割\n止まってるのが\n不安に感じることはありません\n安心して休んで下さい`,
  },
  "2image": {
    color: "rgb(89, 222, 140)",
    text: `笑顔が増え\nリラックスしている\n安心できて\n人と繋がろうとする\nチューニングの役割`,
  },
  "3image": {
    color: "rgb(251, 111, 123)",
    text: `からだを奮い立たせる\nアクセルの役割\nスピードオーバーに注意して\nゆっくり安心して\n動ける状態を目指しましょう`,
  },
};

function createBurstCards() {
  const container = document.createElement("div");
  container.id = "card-burst";
  container.style.position = "fixed";
  container.style.top = 0;
  container.style.left = 0;
  container.style.width = "100vw";
  container.style.height = "100vh";
  container.style.pointerEvents = "none";
  container.style.zIndex = 1000;

  // 1枚目のカードのサイズを取得（参考用）
  const firstCard = document.querySelector(".image-container img");
  const cardWidth = firstCard ? firstCard.offsetWidth : 100;
  const cardHeight = firstCard ? firstCard.offsetHeight : 150;

  for (let i = 0; i < 20; i++) {
    const card = document.createElement("img");
    card.src = "images/card.png";
    card.className = "burst-card";
    card.style.position = "absolute";
    card.style.top = "50%";
    card.style.left = "50%";
    card.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
    card.style.width = `${cardWidth}px`;
    card.style.height = `${cardHeight}px`;
    container.appendChild(card);
  }

  document.body.appendChild(container);

  // 表示後 1 秒で非表示（削除）
  setTimeout(() => {
    container.remove();
  }, 1000);
}

function playCardBurst(onComplete) {
  // メインの3枚のカードをバーストカードと同時に表示する
  gallery.style.visibility = "visible";

  const container = document.createElement("div");
  container.id = "card-burst";
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "150",
  });
  const footer = document.querySelector("footer");
  const footerHeight = footer ? footer.offsetHeight : 0;
  const refImg = document.querySelector(".image-container");
  const cardWidth = refImg ? refImg.offsetWidth : 100;
  const cardHeight = refImg ? refImg.offsetHeight : 100;
  const availableWidth = window.innerWidth - cardWidth;
  const availableHeight = window.innerHeight - footerHeight - cardHeight;

  for (let i = 0; i < 20; i++) {
    const card = document.createElement("img");
    card.src = "images/card.png";
    card.className = "burst-card";
    const left = cardWidth / 2 + availableWidth * (0.4 + Math.random() * 0.2);
    const top = cardHeight / 2 + availableHeight * (0.4 + Math.random() * 0.2);
    Object.assign(card.style, {
      position: "absolute",
      width: `${cardWidth}px`,
      height: `${cardHeight}px`,
      left: `${left}px`,
      top: `${top}px`,
      transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`,
    });
    container.appendChild(card);
  }
  document.body.appendChild(container);
  const cards = container.querySelectorAll(".burst-card");

  // ヘッダーをカードのフェードアウトと同時に表示
  header.style.visibility = "visible";
  header.style.opacity = 0;
  gsap.to(header, { opacity: 1, duration: 1 });

  cards.forEach((card, index) => {
    gsap.to(card, {
      opacity: 0,
      duration: 0.5,
      delay: index * 0.1,
      x: () => (Math.random() - 0.5) * 200,
      y: () => (Math.random() - 0.5) * 200,
      rotation: () => Math.random() * 360,
      rotateX: () => Math.random() * 360,
      rotateY: () => Math.random() * 360,
      onComplete: () => {
        if (index === cards.length - 1) {
          container.remove();
          if (typeof onComplete === "function") {
            onComplete();
          }
        }
      },
    });
  });
}

function scatterCards() {
  const cards = document.querySelectorAll(".burst-card");

  return new Promise((resolve) => {
    gsap.to(cards, {
      duration: 1,
      x: () => (Math.random() - 0.5) * 300,
      y: () => (Math.random() - 0.5) * 300,
      rotation: () => Math.random() * 360,
      ease: "power2.out",
      onComplete: resolve,
    });
  });
}

function prepareCards() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  images.forEach((card) => {
    const img = card.querySelector("img");
    img.dataset.front = `images/${img.alt}.jpg`;
    img.src = "images/card.png";
    gsap.set(card, {
      x: (Math.random() - 0.5) * vw,
      y: (Math.random() - 0.5) * vh,
      rotation: Math.random() * 360,
      rotateY: 180,
    });
  });
}

function flipCardsToFront() {
  images.forEach((card, index) => {
    const img = card.querySelector("img");

    gsap.to(card, {
      rotateY: 0,
      duration: 1,
      delay: index * 0.3,
      ease: "power2.out",
      onStart: () => {
        img._flipped = false; // 初期化
      },
      onUpdate: () => {
        const currentRotation = gsap.getProperty(card, "rotateY");
        if (!img._flipped && currentRotation < 95 && currentRotation > 85) {
          img.src = img.dataset.front;
          img._flipped = true;
        }
      },
    });
  });
}

function animateCards() {
  gallery.classList.add("centered");
  gsap.to(images, {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 1,
    stagger: 0.5,
    ease: "power2.out",
    onComplete: () => {
      cardsClickable = true;
    },
  });
}

function showWhiteOverlay() {
  const overlay = document.getElementById("white-overlay");

  return new Promise((resolve) => {
    gsap.fromTo(
      overlay,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 1,
        ease: "power1.inOut",
        onComplete: () => {
          gsap.to(overlay, {
            opacity: 0,
            duration: 0.5,
            ease: "power1.inOut",
            onComplete: resolve,
          });
        },
      },
    );
  });
}

// Intro sequence with skip-on-click functionality
const introSequence = [
  {
    start: () => introText1.classList.add("show-text"),
    finish: () => {
      introText1.style.animation = "none";
      introText1.style.opacity = "1";
    },
    delay: 3000,
  },
  {
    start: () => introText2.classList.add("show-text"),
    finish: () => {
      introText2.style.animation = "none";
      introText2.style.opacity = "1";
    },
    delay: 2000,
  },
  {
    start: () => introCard.classList.add("show-card"),
    finish: () => {
      introCard.style.animation = "none";
      introCard.style.opacity = "1";
      introCard.style.pointerEvents = "auto";
    },
    delay: 5000,
  },
  {
    start: () => {
      const tipText = window.matchMedia("(max-width: 600px)").matches
        ? "※画像をタップ"
        : "※画像をクリック";
      clickTip.textContent = tipText;
      clickTip.classList.add("blink");
      skipButton.classList.add("show-text");
      skipButton.style.pointerEvents = "auto";
    },
    finish: () => {},
    delay: 0,
  },
];

let introStep = 0;
let introTimer = null;

function playIntroStep() {
  if (introStep >= introSequence.length) return;
  const step = introSequence[introStep];
  step.start();
  introTimer = setTimeout(() => {
    introStep++;
    playIntroStep();
  }, step.delay);
}

window.addEventListener("DOMContentLoaded", () => {
  introTimer = setTimeout(playIntroStep, 100);
});

introOverlay.addEventListener("click", (e) => {
  if (e.target === introCard || introStep >= introSequence.length) return;
  clearTimeout(introTimer);
  const step = introSequence[introStep];
  step.finish();
  introStep++;
  playIntroStep();
});

skipButton.addEventListener("click", (e) => {
  e.stopPropagation();
  clearTimeout(introTimer);
  introStep = introSequence.length;
  introOverlay.remove();
  showTopPage();
});

introCard.addEventListener("click", () => {
  if (introPlayed) return;
  introPlayed = true;
  introCard.style.pointerEvents = "none";

  // Hide intro elements to prevent them from showing through the transition
  introOverlay.remove();
  header.style.visibility = "hidden";
  gallery.style.visibility = "hidden";

  prepareCards(); // 3枚のカードなど初期セット
  createBurstCards(); // ← ここで30枚を生成

  Promise.all([scatterCards(), showWhiteOverlay()]).then(() => {
    playCardBurst(() => {
      // ← この段階で30枚を消す
      header.style.visibility = "visible";
      animateCards(); // ← 3枚を整列
      setTimeout(flipCardsToFront, 2000); // ← 表にめくる
    });
  });
});

// Change button text on mobile
if (window.matchMedia("(max-width: 600px)").matches) {
  moreButton.textContent = "詳細へ";
}
let currentImg = null;

images.forEach((img) => {
  img.addEventListener("click", () => {
    if (!cardsClickable || currentImg) return;
    currentImg = img;
    images.forEach((i) => {
      if (i !== img) {
        i.classList.add("fade-out-other");
      }
    });
    setTimeout(() => {
      images.forEach((i) => {
        if (i !== img) {
          i.classList.add("hidden");
        }
      });
      header.classList.add("hidden");
      window.scrollTo(0, 0);
      img.style.transform = "";
      img.classList.add("expanded");
      body.classList.add("fade-bg");
      setTimeout(() => {
        img.classList.add("dim-image");
        const desc = img.getAttribute("data-desc");
        descriptionDiv.innerHTML = desc.replace(/\n/g, "<br>");
        img.appendChild(details);
        details.classList.remove("hidden");
        descriptionDiv.classList.add("fade-in-text");
        moreButton.classList.add("fade-in-btn");
      }, 500);
    }, 500);
  });
});


function showSection(id) {
  contentSections.forEach((sec) => {
    if (sec.id === id) {
      sec.classList.remove("hidden");
    } else {
      sec.classList.add("hidden");
    }
  });
}

function showTopPage() {
  details.classList.add("hidden");
  if (currentImg) currentImg.classList.add("hidden");
  gallery.classList.add("hidden");
  body.style.backgroundColor = "";
  subtext.style.display = "none";
  menuOverlay.classList.add("hidden");
  mainMenu.classList.remove("hidden");
  mainContent.classList.remove("hidden");
  header.classList.remove("hidden");
  hamburger.classList.remove("hidden");
  window.scrollTo(0, 0);
  showSection("about");
  detailStage = "done";
}

mainMenu.addEventListener("click", (e) => {
  const target = e.target;
  if (target.tagName !== "A") return;
  e.preventDefault();
  mainMenu.classList.remove("open");
  menuOverlay.classList.add("hidden");
  if (target.id === "choose-images") {
    window.location.href = "index.html";
    return;
  }
  const section = target.dataset.section;
  if (section) {
    showSection(section);
  }
});

let detailStage = "initial";
moreButton.addEventListener("click", (e) => {
  if (detailStage === "initial") {
    e.preventDefault();
    descriptionDiv.classList.add("fade-up-out");
    moreButton.classList.add("fade-up-out");
    setTimeout(() => {
      descriptionDiv.style.display = "none";
      moreButton.style.display = "none";
    }, 1000);
    setTimeout(() => {
      const imgAlt = currentImg.querySelector("img").alt;
      const data = additionalData[imgAlt];
      body.classList.remove("fade-bg");
      body.style.backgroundColor = data.color;
      descriptionDiv.innerHTML = data.text.replace(/\n/g, "<br>");
      descriptionDiv.style.display = "block";
      descriptionDiv.classList.remove("fade-up-out");
      descriptionDiv.classList.add("fade-in-quick");
      setTimeout(() => {
        moreButton.textContent = "次へ";
        moreButton.href = "#";
        moreButton.style.display = "inline-block";
        moreButton.classList.remove("fade-up-out");
        moreButton.classList.add("fade-in-quick");
        autonomicNote.classList.remove("hidden");
        autonomicNote.classList.add("fade-in-quick");
        detailStage = "next";
      }, 1000);
    }, 2000);
  } else if (detailStage === "next") {
    e.preventDefault();
    showTopPage();
  }
});
