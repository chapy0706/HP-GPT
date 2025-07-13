const images = document.querySelectorAll('.image-container');
const details = document.querySelector('.details');
const descriptionDiv = document.querySelector('.description');

images.forEach(img => {
  img.addEventListener('click', () => {
    images.forEach(i => i.classList.remove('expanded'));
    img.classList.add('expanded');
    const desc = img.getAttribute('data-desc');
    descriptionDiv.textContent = desc;
    details.classList.remove('hidden');
  });
});
