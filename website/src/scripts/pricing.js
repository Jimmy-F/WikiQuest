// Pricing Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const billingToggle = document.getElementById('billingToggle');

  if (billingToggle) {
    billingToggle.addEventListener('click', () => {
      billingToggle.classList.toggle('active');

      const isAnnual = billingToggle.classList.contains('active');

      // Toggle prices
      document.querySelectorAll('.monthly-price').forEach(el => {
        el.style.display = isAnnual ? 'none' : 'inline';
      });

      document.querySelectorAll('.annual-price').forEach(el => {
        el.style.display = isAnnual ? 'inline' : 'none';
      });

      document.querySelectorAll('.monthly-period').forEach(el => {
        el.style.display = isAnnual ? 'none' : 'inline';
      });

      document.querySelectorAll('.annual-period').forEach(el => {
        el.style.display = isAnnual ? 'inline' : 'none';
      });

      document.querySelectorAll('.monthly-desc').forEach(el => {
        el.style.display = isAnnual ? 'none' : 'block';
      });

      document.querySelectorAll('.annual-save').forEach(el => {
        el.style.display = isAnnual ? 'block' : 'none';
      });
    });
  }
});
