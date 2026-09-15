const BUTTON_ID = 'wishlist-share-button'
const STYLE_ID = 'wishlist-share-button-style'

function publicWishlistUrl() {
  return `${window.location.origin}/wishlist/julia`
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    #wishlist-share-button { position: fixed; right: 24px; bottom: 24px; z-index: 40; display: inline-flex; align-items: center; gap: 9px; padding: 13px 17px; border: 1px solid rgba(255,255,255,.88); border-radius: 16px; background: rgba(255,255,255,.78); color: #403a44; font: 700 13px/1.2 Inter, ui-sans-serif, system-ui, sans-serif; cursor: pointer; backdrop-filter: blur(18px); box-shadow: 0 14px 35px rgba(55,43,58,.14); transition: transform .2s, box-shadow .2s; }
    #wishlist-share-button:hover { transform: translateY(-2px); box-shadow: 0 18px 42px rgba(55,43,58,.18); }
    #wishlist-share-button .share-icon { width: 25px; height: 25px; display: grid; place-items: center; border-radius: 9px; background: #f2eafa; color: #765eb0; font-size: 17px; }
    #wishlist-share-status { position: fixed; left: 50%; bottom: 24px; z-index: 60; transform: translate(-50%, 20px); opacity: 0; pointer-events: none; padding: 11px 15px; border-radius: 13px; background: #29242c; color: #fff; font: 650 12px/1.2 Inter, ui-sans-serif, system-ui, sans-serif; box-shadow: 0 12px 30px rgba(35,27,40,.2); transition: opacity .2s, transform .2s; }
    #wishlist-share-status.visible { opacity: 1; transform: translate(-50%, 0); }
    @media (max-width: 600px) { #wishlist-share-button { right: 16px; left: 16px; bottom: 16px; justify-content: center; } #wishlist-share-status { bottom: 74px; } }
  `
  document.head.appendChild(style)
}

async function shareWishlist() {
  const url = publicWishlistUrl()
  const title = 'Мой вишлист Юлии'
  const text = 'Вот мой список желаний. Если захочешь что-то подарить, можешь выбрать подарок здесь ❤️'
  try {
    if (navigator.share) { await navigator.share({ title, text, url }); return }
    await navigator.clipboard.writeText(url)
    showStatus('Ссылка скопирована')
  } catch (error) {
    if (error?.name !== 'AbortError') showStatus('Не удалось поделиться ссылкой')
  }
}

function showStatus(text) {
  let status = document.getElementById('wishlist-share-status')
  if (!status) { status = document.createElement('div'); status.id = 'wishlist-share-status'; document.body.appendChild(status) }
  status.textContent = text
  status.classList.add('visible')
  window.clearTimeout(status._timer)
  status._timer = window.setTimeout(() => status.classList.remove('visible'), 2200)
}

function syncShareButton() {
  const path = window.location.pathname
  const isJuliaWishlist = path.endsWith('/wishlist/julia') || path.endsWith('/wishlist/julia/') || path.endsWith('/julia') || path.endsWith('/julia/')
  let button = document.getElementById(BUTTON_ID)
  if (!isJuliaWishlist) { button?.remove(); return }
  installStyles()
  if (button) return
  button = document.createElement('button')
  button.id = BUTTON_ID
  button.type = 'button'
  button.innerHTML = '<span class="share-icon">↗</span><span>Рассказать о желаниях</span>'
  button.addEventListener('click', shareWishlist)
  document.body.appendChild(button)
}

const originalPushState = history.pushState
history.pushState = function (...args) { const result = originalPushState.apply(this, args); window.dispatchEvent(new Event('wishlist-route-change')); return result }
const originalReplaceState = history.replaceState
history.replaceState = function (...args) { const result = originalReplaceState.apply(this, args); window.dispatchEvent(new Event('wishlist-route-change')); return result }
window.addEventListener('popstate', syncShareButton)
window.addEventListener('wishlist-route-change', syncShareButton)
const observer = new MutationObserver(syncShareButton)
observer.observe(document.documentElement, { childList: true, subtree: true })
syncShareButton()
