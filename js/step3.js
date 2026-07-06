// js/step3.js

document.addEventListener('DOMContentLoaded', () => {
  // Semua field di halaman ini statis (tidak ada dynamic row),
  // jadi field mana yang disimpan cukup ditentukan lewat
  // atribut data-save="true" di HTML.

  const savableFields = document.querySelectorAll('[data-save="true"]');

  savableFields.forEach(element => {
    if (!element.id) return;

    const storageKey = `step3-${element.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) element.value = saved;

    element.addEventListener('input', () => {
      localStorage.setItem(storageKey, element.value);
    });
  });
});