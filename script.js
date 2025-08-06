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
