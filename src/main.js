import './style.css';

const cards = document.querySelectorAll('.world');

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.12 },
);

cards.forEach((card, index) => {
  card.style.setProperty('--delay', `${Math.min(index % 3, 2) * 70}ms`);
  observer.observe(card);
});
