const BUTTON_ID = 'wishlist-share-button'

function publicWishlistUrl() {
  return `${window.location.origin}/wishlist/julia`
}

async function shareWishlist() {
  const url = publicWishlistUrl()
  const title = 'Мой вишлист Юлии'
  const text = 'Вот мой список желаний. Если захочешь что-то подарить, можешь выбрать подарок здесь ❤️'

  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return
    }
    await navigator.clipboard.writeText(url)
    showStatus('Ссылка скопирована')
  } catch (error) {
    if (error?.name !== 'AbortError') showStatus('Не удалось поделиться ссылкой')
  }
}

function showStatus(text) {
  let status = document.getElementById('wishlist-share-status')
  if (!status) {
    status = document.createElement('div')
    status.id = 'wishlist-share-status'
    document.body.appendChild(status)
  }
  status.textContent = text
  status.classList.add('visible')
  window.clearTimeout(status._timer)
  status._timer = window.setTimeout(() => status.classList.remove('visible'), 2200)
}

function syncShareButton() {
  const isJuliaWishlist = window.location.pathname.endsWith('/wishlist/julia') || window.location.pathname.endsWith('/wishlist/julia/') || window.location.pathname.endsWith('/julia') || window.location.pathname.endsWith('/julia/')
  let button = document.getElementById(BUTTON_ID)

  if (!isJuliaWishlist) {
    button?.remove()
    return
  }

  if (button) return

  button = document.createElement('button')
  button.id = BUTTON_ID
  button.type = 'button'
  button.innerHTML = '<span class="share-icon">↗</span><span>Рассказать о желаниях</span>'
  button.addEventListener('click', shareWishlist)
  document.body.appendChild(button)
}

const originalPushState = history.pushState
history.pushState = function (...args) {
  const result = originalPushState.apply(this, args)
  window.dispatchEvent(new Event('wishlist-route-change'))
  return result
}

const originalReplaceState = history.replaceState
history.replaceState = function (...args) {
  const result = originalReplaceState.apply(this, args)
  window.dispatchEvent(new Event('wishlist-route-change'))
  return result
}

window.addEventListener('popstate', syncShareButton)
window.addEventListener('wishlist-route-change', syncShareButton)

const observer = new MutationObserver(syncShareButton)
observer.observe(document.documentElement, { childList: true, subtree: true })

syncShareButton()
