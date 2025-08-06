// GSAP-based animation script
const gallery = document.querySelector('.gallery');
const orderings = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1]
];
const containers = Array.from(gallery.children);
const randomOrder = orderings[Math.floor(Math.random() * orderings.length)];
randomOrder.forEach(i => gallery.appendChild(containers[i]));

const images = document.querySelectorAll('.image-container');
const details = document.querySelector('.details');
const descriptionDiv = document.querySelector('.description');
const closeBtn = document.querySelector('.close-btn');
const body = document.body;
const header = document.querySelector('header');
const moreButton = document.querySelector('.more-button');
const introOverlay = document.getElementById('intro-overlay');
const introText1 = document.getElementById('intro-text1');
const introText2 = document.getElementById('intro-text2');
const introCard = document.getElementById('intro-card');
const clickTip = document.getElementById('click-tip');

const additionalData = {
  '1image': {
    color: 'rgb(174, 198, 207)',
    text: `からだを止めて身を守る\n急ブレーキの役割\n背側迷走神経\n止まってるのが\n不安に感じることはありません\n安心して休んで下さい`
  },
  '2image': {
    color: 'rgb(194, 233, 191)',
    text: `笑顔が増えリラックスしている\n人と繋がろうとする\nチューニングの役割を持った\n腹側迷走神経\nバランスのとれた状態`
  },
  '3image': {
    color: 'rgb(255, 204, 203)',
    text: `からだを奮い立たせて\nアクセル全開の交感神経\nスピードオーバーに注意して\nゆっくり安心して\n動ける状態を目指します`
  }
};

// ------------------------------------
// Intro sequence with skip-on-click functionality
// Before: setTimeout + CSS animations
// After: GSAP-powered sequence with delayedCall
// ------------------------------------
let tipBlinkTween = null;
const introSequence = [
  {
    start: () => gsap.fromTo(introText1, { opacity: 0 }, { opacity: 1, duration: 3 }),
    finish: () => gsap.set(introText1, { opacity: 1 }),
    delay: 3
  },
  {
    start: () => gsap.fromTo(introText2, { opacity: 0 }, { opacity: 1, duration: 3 }),
    finish: () => gsap.set(introText2, { opacity: 1 }),
    delay: 2
  },
  {
    start: () => gsap.fromTo(introCard, { opacity: 0 }, {
      opacity: 1,
      duration: 2,
      onComplete: () => gsap.set(introCard, { pointerEvents: 'auto' })
    }),
    finish: () => gsap.set(introCard, { opacity: 1, pointerEvents: 'auto' }),
    delay: 5
  },
  {
    start: () => {
      const tipText = window.matchMedia('(max-width: 600px)').matches ? '※画像をタップ' : '※画像をクリック';
      clickTip.textContent = tipText;
      tipBlinkTween = gsap.fromTo(clickTip, { opacity: 0 }, {
        opacity: 1,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      });
    },
    finish: () => {},
    delay: 0
  }
];

let introStep = 0;
let introTimer = null;

function playIntroStep() {
  if (introStep >= introSequence.length) return;
  const step = introSequence[introStep];
  step.start();
  introTimer = gsap.delayedCall(step.delay, () => {
    introStep++;
    playIntroStep();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  gsap.delayedCall(0.1, playIntroStep);
  // Initial slide-in for gallery images
  gsap.from('.image-container', { x: 100, opacity: 0, duration: 1, stagger: 0.2 });
});

introOverlay.addEventListener('click', (e) => {
  if (e.target === introCard || introStep >= introSequence.length) return;
  if (introTimer) introTimer.kill();
  const step = introSequence[introStep];
  step.finish();
  introStep++;
  playIntroStep();
});

introCard.addEventListener('click', () => {
  gsap.to([introText1, introText2, introCard], { opacity: 0, duration: 2 });
  if (tipBlinkTween) {
    tipBlinkTween.kill();
    gsap.to(clickTip, { opacity: 0, duration: 1, onComplete: () => clickTip.remove() });
  }
  gsap.to(introOverlay, {
    opacity: 0,
    duration: 3,
    onStart: () => gsap.delayedCall(1, () => gsap.set(introOverlay, { pointerEvents: 'none' })),
    onComplete: () => introOverlay.remove()
  });
});

// Change button text on mobile
if (window.matchMedia('(max-width: 600px)').matches) {
  moreButton.textContent = '詳細へ';
}

let currentImg = null;
images.forEach(img => {
  img.addEventListener('click', () => {
    if (currentImg) return;
    currentImg = img;
    const others = Array.from(images).filter(i => i !== img);
    const tl = gsap.timeline();

    // Before: class toggling with setTimeout
    // After: GSAP timeline orchestrates the sequence
    tl.to(others, { opacity: 0, duration: 0.5 })
      .set(others, { display: 'none' })
      .set(img, { position: 'fixed', top: '50%', left: '50%', xPercent: -50, yPercent: -50, zIndex: 10 })
      .to(img, { scale: 2, duration: 0.5, ease: 'power1.out' })
      .add(() => {
        img.appendChild(closeBtn);
        closeBtn.classList.remove('hidden');
        gsap.to(body, { backgroundColor: 'rgba(128,128,128,0.8)', duration: 0.5 });
        gsap.set(header, { display: 'none' });
      })
      .to({}, { duration: 0.5 })
      .add(() => {
        const desc = img.getAttribute('data-desc');
        descriptionDiv.innerHTML = desc.replace(/\n/g, '<br>');
        img.appendChild(details);
        details.classList.remove('hidden');
      })
      .to(img.querySelector('img'), { opacity: 0.5, duration: 3 }, '<')
      .fromTo(descriptionDiv, { opacity: 0 }, { opacity: 1, duration: 3 }, '<')
      .fromTo(moreButton, { opacity: 0 }, { opacity: 1, duration: 3 }, '<');
  });
});

closeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

let detailStage = 'initial';
moreButton.addEventListener('click', (e) => {
  if (detailStage !== 'initial') return;
  e.preventDefault();
  const tl = gsap.timeline();
  tl.to(descriptionDiv, { y: -20, opacity: 0, duration: 1 })
    .to(moreButton, { y: -20, opacity: 0, duration: 1 }, '<')
    .set([descriptionDiv, moreButton], { display: 'none' })
    .to({}, { duration: 1 })
    .add(() => {
      const imgAlt = currentImg.querySelector('img').alt;
      const data = additionalData[imgAlt];
      gsap.to(body, { backgroundColor: data.color, duration: 1 });
      descriptionDiv.innerHTML = data.text.replace(/\n/g, '<br>');
      gsap.set(descriptionDiv, { display: 'block' });
    })
    .fromTo(descriptionDiv, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 })
    .add(() => {
      moreButton.textContent = '次へ';
      moreButton.href = 'index.html';
      gsap.set(moreButton, { display: 'inline-block' });
    })
    .fromTo(moreButton, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1 }, '<')
    .add(() => { detailStage = 'next'; });
});

