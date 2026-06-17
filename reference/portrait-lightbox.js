;(function () {
  const dialog = document.createElement('dialog')
  dialog.className = 'portrait-lightbox'
  dialog.innerHTML = `
    <form method="dialog" class="portrait-lightbox-toolbar">
      <button type="submit" class="portrait-lightbox-close" aria-label="Close portrait">&times;</button>
    </form>
    <figure class="portrait-lightbox-figure">
      <img class="portrait-lightbox-full" alt="">
      <figcaption class="portrait-lightbox-caption"></figcaption>
    </figure>`
  document.body.appendChild(dialog)

  const fullImg = dialog.querySelector('.portrait-lightbox-full')
  const caption = dialog.querySelector('.portrait-lightbox-caption')

  function openFrom(button) {
    const thumb = button.querySelector('img')
    fullImg.src = button.dataset.fullSrc
    fullImg.alt = thumb?.alt ?? ''
    caption.textContent = thumb?.alt ?? ''
    dialog.showModal()
  }

  document.querySelectorAll('.portrait-launch').forEach((button) => {
    button.addEventListener('click', () => openFrom(button))
  })

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close()
    }
  })
})()
