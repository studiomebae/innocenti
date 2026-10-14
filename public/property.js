const gallery = document.querySelector('.gallery');
const slides = [...gallery.querySelectorAll('[data-slide]')];
const mainImage = document.querySelector('#gallery-image');
let currentSlide = 0;
function showSlide(index) {
  currentSlide = (index + slides.length) % slides.length;
  const thumbnail = slides[currentSlide].querySelector('img');
  const url = new URL(thumbnail.src);
  url.searchParams.set('w', '1800');
  url.searchParams.set('q', '85');
  mainImage.src = url.href;
  mainImage.alt = thumbnail.alt;
  slides.forEach((button, i) => {
    button.classList.toggle('selected', i === currentSlide);
    button.setAttribute('aria-pressed', String(i === currentSlide));
  });
  document.querySelector('.gallery-counter').textContent = `${currentSlide + 1} / ${slides.length}`;
}
slides.forEach((button, index) => button.addEventListener('click', () => showSlide(index)));
gallery.querySelector('.gallery-prev').addEventListener('click', () => showSlide(currentSlide - 1));
gallery.querySelector('.gallery-next').addEventListener('click', () => showSlide(currentSlide + 1));
gallery.querySelector('.gallery-main').addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showSlide(currentSlide + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let touchStart;
const galleryMain = gallery.querySelector('.gallery-main');
galleryMain.addEventListener('touchstart', event => { touchStart = event.changedTouches[0].clientX; }, {passive:true});
galleryMain.addEventListener('touchend', event => {
  if (touchStart === undefined) return;
  const distance = touchStart - event.changedTouches[0].clientX;
  if (Math.abs(distance) > 50) showSlide(currentSlide + (distance > 0 ? 1 : -1));
  touchStart = undefined;
}, {passive:true});
document.querySelector('[data-book]').addEventListener('click', event => openHome(Number(event.currentTarget.dataset.book)));
