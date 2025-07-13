const images = document.querySelectorAll('.image-container');
const details = document.querySelector('.details');
const descriptionDiv = document.querySelector('.description');
const closeBtn = document.querySelector('.close-btn');
const body = document.body;
const header = document.querySelector('header');
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
      }, 500);
    }, 500);
  });
});

closeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});
