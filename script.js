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

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    introText1.classList.add('show-text');
  }, 100);
  setTimeout(() => {
    introText2.classList.add('show-text');
  }, 3100);
  setTimeout(() => {
    introCard.classList.add('show-card');
  }, 5100);
});

introCard.addEventListener('click', () => {
  introOverlay.classList.add('fade-out-overlay');
  introText1.classList.add('fade-out-text');
  introText2.classList.add('fade-out-text');
  introCard.classList.add('fade-out-text');
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
