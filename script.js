const images = document.querySelectorAll('.image-container');
const details = document.querySelector('.details');
const descriptionDiv = document.querySelector('.description');
const closeBtn = document.querySelector('.close-btn');
const body = document.body;

images.forEach(img => {
  img.addEventListener('click', () => {
    images.forEach(i => i.classList.remove('expanded'));
    img.classList.add('expanded');
    const desc = img.getAttribute('data-desc');
    descriptionDiv.innerHTML = desc.replace(/\n/g, '<br>');
    details.classList.remove('hidden');
    closeBtn.classList.remove('hidden');
    body.classList.add('fade-bg');
  });
});

closeBtn.addEventListener('click', () => {
  images.forEach(i => i.classList.remove('expanded'));
  details.classList.add('hidden');
  closeBtn.classList.add('hidden');
  body.classList.remove('fade-bg');
});
