// js/step3.js

// ==========================================
// Patch export PDF: tampilkan seluruh isi textarea
// (membungkus html2canvas, kode export lama tidak perlu diubah)
// ==========================================
(function patchHtml2CanvasForTextareas() {

  function applyPatch() {
    if (typeof window.html2canvas !== 'function') return;
    if (window.html2canvas.__textareaPatched) return;

    const originalHtml2Canvas = window.html2canvas;

    const patched = function (element, options = {}) {
      options = Object.assign({}, options);
      const userOnClone = options.onclone;

      // Ukur tinggi isi sebenarnya dari textarea asli (termasuk teks yang tersembunyi)
      const originalTextareas = Array.from(document.querySelectorAll('textarea'));
      const fullHeights = originalTextareas.map(ta => ta.scrollHeight + 4);

      options.onclone = function (clonedDoc, clonedElement) {
        // Hanya salinan yang diubah, halaman asli tidak tersentuh
        clonedDoc.querySelectorAll('textarea').forEach((ta, i) => {
          const h = fullHeights[i] !== undefined ? fullHeights[i] : ta.scrollHeight + 4;
          ta.style.overflow = 'hidden';
          ta.style.resize = 'none';
          ta.style.height = h + 'px';
          ta.style.minHeight = h + 'px';
          ta.scrollTop = 0;
        });

        if (typeof userOnClone === 'function') {
          return userOnClone(clonedDoc, clonedElement);
        }
      };

      return originalHtml2Canvas.call(this, element, options);
    };

    // pertahankan properti bawaan html2canvas jika ada
    Object.assign(patched, originalHtml2Canvas);
    patched.__textareaPatched = true;
    window.html2canvas = patched;
  }

  // Coba langsung; jika html2canvas belum dimuat, coba lagi nanti
  applyPatch();
  document.addEventListener('DOMContentLoaded', applyPatch);
  window.addEventListener('load', applyPatch);
})();

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