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

function playCardBurst(onComplete) {
  const container = document.createElement('div');
  container.id = 'card-burst';
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '150'
  });
  const footer = document.querySelector('footer');
  const footerHeight = footer ? footer.offsetHeight : 0;
  const refImg = document.querySelector('.image-container');
  const cardWidth = refImg ? refImg.offsetWidth : 100;
  const cardHeight = refImg ? refImg.offsetHeight : 100;
  const availableWidth = window.innerWidth - cardWidth;
  const availableHeight = window.innerHeight - footerHeight - cardHeight;

  for (let i = 0; i < 30; i++) {
    const card = document.createElement('img');
    card.src = 'images/card.png';
    card.className = 'burst-card';
    const left = cardWidth / 2 + availableWidth * (0.25 + Math.random() * 0.5);
    const top = cardHeight / 2 + availableHeight * (0.25 + Math.random() * 0.5);
    Object.assign(card.style, {
      position: 'absolute',
      width: `${cardWidth}px`,
      height: `${cardHeight}px`,
      left: `${left}px`,
      top: `${top}px`,
      transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`
    });
    container.appendChild(card);
  }
  document.body.appendChild(container);
  const cards = container.querySelectorAll('.burst-card');
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
          if (typeof onComplete === 'function') {
            onComplete();
          }
        }
      }
    });
  });
}

function prepareCards() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  images.forEach(card => {
    const img = card.querySelector('img');
    img.dataset.front = img.src;
    img.src = 'images/card.png';
    gsap.set(card, {
      x: (Math.random() - 0.5) * vw,
      y: (Math.random() - 0.5) * vh,
      rotation: Math.random() * 360,
      rotateY: 180
    });
  });
}

function animateCards() {
  const tl = gsap.timeline();
  tl.to(images, {
    x: 0,
    y: 0,
    rotation: 0,
    duration: 1,
    stagger: 0.5,
    ease: 'power2.out'
  });
  tl.to(images, {
    rotateY: 0,
    duration: 0.8,
    stagger: 0.5,
    ease: 'power2.out',
    onStart: function () {
      const img = this.targets()[0].querySelector('img');
      const front = img.dataset.front;
      gsap.delayedCall(0.4, () => {
        img.src = front;
      });
    }
  });
}

// Intro sequence with skip-on-click functionality
const introSequence = [
  {
    start: () => introText1.classList.add('show-text'),
    finish: () => {
      introText1.style.animation = 'none';
      introText1.style.opacity = '1';
    },
    delay: 3000
  },
  {
    start: () => introText2.classList.add('show-text'),
    finish: () => {
      introText2.style.animation = 'none';
      introText2.style.opacity = '1';
    },
    delay: 2000
  },
  {
    start: () => introCard.classList.add('show-card'),
    finish: () => {
      introCard.style.animation = 'none';
      introCard.style.opacity = '1';
      introCard.style.pointerEvents = 'auto';
    },
    delay: 5000
  },
  {
    start: () => {
      const tipText = window.matchMedia('(max-width: 600px)').matches ? '※画像をタップ' : '※画像をクリック';
      clickTip.textContent = tipText;
      clickTip.classList.add('blink');
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
  introTimer = setTimeout(() => {
    introStep++;
    playIntroStep();
  }, step.delay);
}

window.addEventListener('DOMContentLoaded', () => {
  introTimer = setTimeout(playIntroStep, 100);
});

introOverlay.addEventListener('click', (e) => {
  if (e.target === introCard || introStep >= introSequence.length) return;
  clearTimeout(introTimer);
  const step = introSequence[introStep];
  step.finish();
  introStep++;
  playIntroStep();
});

introCard.addEventListener('click', () => {
  prepareCards();
  playCardBurst(animateCards);
  introOverlay.classList.add('fade-out-overlay');
  introText1.classList.add('fade-out-text');
  introText2.classList.add('fade-out-text');
  introCard.classList.add('fade-out-text');
  if (clickTip.classList.contains('blink')) {
    clickTip.classList.remove('blink');
    clickTip.classList.add('fade-out-tip');
    setTimeout(() => {
      clickTip.remove();
    }, 1000);
  }
  setTimeout(() => {
    introOverlay.style.pointerEvents = 'none';
  }, 1000);
  setTimeout(() => {
    introOverlay.remove();
  }, 3000);
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
    images.forEach(i => {
      if (i !== img) {
        i.classList.add('fade-out-other');
      }
    });
    setTimeout(() => {
      images.forEach(i => {
        if (i !== img) {
          i.classList.add('hidden');
        }
      });
      img.classList.add('expanded');
      img.appendChild(closeBtn);
      closeBtn.classList.remove('hidden');
      body.classList.add('fade-bg');
      header.classList.add('hidden');
      setTimeout(() => {
        img.classList.add('dim-image');
        const desc = img.getAttribute('data-desc');
        descriptionDiv.innerHTML = desc.replace(/\n/g, '<br>');
        img.appendChild(details);
        details.classList.remove('hidden');
        descriptionDiv.classList.add('fade-in-text');
        moreButton.classList.add('fade-in-btn');
      }, 500);
    }, 500);
  });
});

closeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

let detailStage = 'initial';
moreButton.addEventListener('click', (e) => {
  if (detailStage !== 'initial') return;
  e.preventDefault();
  descriptionDiv.classList.add('fade-up-out');
  moreButton.classList.add('fade-up-out');
  setTimeout(() => {
    descriptionDiv.style.display = 'none';
    moreButton.style.display = 'none';
  }, 1000);
  setTimeout(() => {
    const imgAlt = currentImg.querySelector('img').alt;
    const data = additionalData[imgAlt];
    body.classList.remove('fade-bg');
    body.style.backgroundColor = data.color;
    descriptionDiv.innerHTML = data.text.replace(/\n/g, '<br>');
    descriptionDiv.style.display = 'block';
    descriptionDiv.classList.remove('fade-up-out');
    descriptionDiv.classList.add('fade-in-quick');
    setTimeout(() => {
      moreButton.textContent = '次へ';
      moreButton.href = 'index.html';
      moreButton.style.display = 'inline-block';
      moreButton.classList.remove('fade-up-out');
      moreButton.classList.add('fade-in-quick');
      detailStage = 'next';
    }, 1000);
  }, 2000);
});
