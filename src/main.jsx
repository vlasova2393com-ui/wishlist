import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Heart, Plus, ChevronRight, Gift, Users, Lock, Sparkles, ExternalLink, LoaderCircle, Check, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import './styles.css'

const demoLists = [
  { id: 'julia', name: 'Список желаний.', person: 'Юлия', description: 'То, чему я буду рада', icon: Heart, tone: 'rose', access: 'Открыт по ссылке' },
  { id: 'sergey', name: 'Список желаний.', person: 'Сергей', description: 'То, чему я буду рад', icon: Gift, tone: 'blue', access: 'Приватный' },
  { id: 'shared', name: 'Наши общие хотелки', description: 'То, что хотим вместе', icon: Users, tone: 'violet', access: 'Приватный' },
]

const demoCategories = {
  julia: ['Хочу', 'Подарки', 'Для дома', 'Путешествия'],
  sergey: ['Хочу', 'Техника', 'Для дома'],
  shared: ['Путешествия', 'Для дома', 'Большие покупки', 'Планы', 'Куда сходить'],
}

function App() {
  const [selected, setSelected] = useState(() => window.location.pathname.endsWith('/julia') ? demoLists[0] : null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    setConnected(Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY))
  }, [])

  const openList = (list) => {
    setSelected(list)
    if (list.id === 'julia') window.history.pushState({}, '', `${import.meta.env.BASE_URL}julia`)
  }

  const goHome = () => {
    setSelected(null)
    window.history.pushState({}, '', import.meta.env.BASE_URL)
  }

  if (selected) return <WishlistScreen list={selected} onBack={goHome} />

  return (
    <main className="page home-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <section className="hero home-hero">
        <div>
          <p className="eyebrow">Юлия <span>+</span> Сергей</p>
          <h1>Наши <em>желания</em></h1>
          <p className="subtitle">Место, где желания превращаются в подарки и планы.</p>
        </div>
        <button className="icon-button" aria-label="Добавить список"><Plus size={21} /></button>
      </section>

      <section className="lists">
        {demoLists.map((list) => {
          const Icon = list.icon
          return (
            <button className={`list-card ${list.tone}`} key={list.id} onClick={() => openList(list)}>
              <span className="list-icon"><Icon size={21} strokeWidth={1.8} /></span>
              <span className="list-copy">
                <strong>{list.name} <span className="person-name">{list.person}</span></strong>
                <span>{list.description}</span>
                <small>{list.access}</small>
              </span>
              <span className="card-arrow"><ChevronRight size={18} /></span>
            </button>
          )
        })}
      </section>

      <div className="footer-note"><Sparkles size={13} /> Сделано для желаний, которые хочется осуществить</div>
      <div className="status"><span className={connected ? 'dot ok' : 'dot'} />{connected ? 'Supabase подключён' : 'Подключаем Supabase'}</div>
    </main>
  )
}

function WishlistScreen({ list, onBack }) {
  const isPublic = list.id === 'julia'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(isPublic)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState(demoCategories[list.id] || [])
  const [adding, setAdding] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  useEffect(() => {
    if (!isPublic) return
    let alive = true
    const load = async () => {
      setLoading(true)
      setError('')
      const { data: result, error: rpcError } = await supabase.rpc('get_public_wishlist', { p_slug: 'julia' })
      if (!alive) return
      if (rpcError) setError(rpcError.message)
      else if (!result) setError('Вишлист не найден')
      else {
        setData(result)
        setCategories(result.categories || [])
      }
      setLoading(false)
    }
    load()
    return () => { alive = false }
  }, [isPublic])

  const addCategory = () => {
    const name = newCategory.trim()
    if (!name || categories.some((c) => (typeof c === 'string' ? c : c.name) === name)) return
    setCategories([...categories, name])
    setNewCategory('')
    setAdding(false)
  }

  const displayCategories = isPublic ? categories : categories.map((name) => ({ name, wishes: [] }))
  const title = data?.name || `${list.name} ${list.person || ''}`
  const description = data?.description || list.description

  return (
    <main className="page wishlist-page">
      <div className="ambient ambient-one" />
      <button className="back" onClick={onBack}>← Все списки</button>
      <section className="hero compact">
        <div>
          <p className="eyebrow">Список желаний</p>
          <h1>{title}</h1>
          <p className="subtitle">{description}</p>
        </div>
        {!isPublic && <button className="primary"><Plus size={18} /> Добавить</button>}
      </section>

      {loading ? (
        <div className="loading"><LoaderCircle size={22} className="spin" /> Загружаю желания…</div>
      ) : error ? (
        <div className="error-box">Не удалось загрузить вишлист.<br /><small>{error}</small></div>
      ) : (
        <div className="categories">
          {displayCategories.map((category, i) => (
            <CategoryCard key={category.id || category.name || category} category={category} index={i} publicList={isPublic} />
          ))}
        </div>
      )}

      {!isPublic && (adding ? (
        <div className="add-category">
          <input autoFocus value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCategory()} placeholder="Название рубрики" />
          <button className="primary" onClick={addCategory}>Добавить</button>
          <button className="cancel" onClick={() => setAdding(false)}>Отмена</button>
        </div>
      ) : (
        <button className="add-category-trigger" onClick={() => setAdding(true)}><Plus size={17} /> Добавить рубрику</button>
      ))}
    </main>
  )
}

function CategoryCard({ category, index, publicList }) {
  const wishes = category.wishes || []
  return (
    <section className={`category category-${index % 3}`}>
      <div className="category-head">
        <div>
          <span className="category-index">{String(index + 1).padStart(2, '0')}</span>
          <h2>{category.name}</h2>
        </div>
        <span>{wishes.length} {wishWord(wishes.length)}</span>
      </div>
      {wishes.length ? (
        <div className="wishes">
          {wishes.map((wish) => <WishCard key={wish.id} wish={wish} publicList={publicList} />)}
        </div>
      ) : (
        <div className="empty">Пока здесь пусто.<br />Добавь первое желание.</div>
      )}
    </section>
  )
}

function WishCard({ wish, publicList }) {
  const tokenKey = `wishlist-reservation:${wish.id}`
  const [busy, setBusy] = useState(false)
  const [reserved, setReserved] = useState(Boolean(wish.reserved))
  const [mine, setMine] = useState(() => Boolean(localStorage.getItem(tokenKey)))
  const [message, setMessage] = useState('')

  const reserve = async () => {
    setBusy(true)
    setMessage('')
    const { data, error } = await supabase.rpc('reserve_gift', { p_wish_id: wish.id })
    if (error) {
      setMessage(error.message.includes('already reserved') ? 'Этот подарок уже забрали' : 'Не получилось забронировать')
      setReserved(true)
    } else {
      localStorage.setItem(tokenKey, data)
      setMine(true)
      setReserved(true)
      setMessage('Подарок забронирован')
    }
    setBusy(false)
  }

  const cancel = async () => {
    const token = localStorage.getItem(tokenKey)
    if (!token) return
    setBusy(true)
    const { data, error } = await supabase.rpc('cancel_gift_reservation', { p_token: token })
    if (error || !data) setMessage('Не удалось отменить бронь')
    else {
      localStorage.removeItem(tokenKey)
      setMine(false)
      setReserved(false)
      setMessage('Бронь отменена')
    }
    setBusy(false)
  }

  return (
    <article className={`wish-card ${reserved ? 'is-reserved' : ''}`}>
      {wish.image_url ? <img src={wish.image_url} alt="" className="wish-image" /> : <div className="wish-image placeholder"><Gift size={22} /></div>}
      <div className="wish-body">
        <div className="wish-top">
          <h3>{wish.title}</h3>
          <span className={`priority ${wish.priority}`}>{wish.priority === 'high' ? '⭐' : wish.priority === 'medium' ? '❤️' : '🙂'}</span>
        </div>
        {wish.description && <p>{wish.description}</p>}
        {wish.approximate_price != null && <strong className="price">≈ {Number(wish.approximate_price).toLocaleString('ru-RU')} {wish.currency || 'RUB'}</strong>}
        <div className="wish-actions">
          {wish.url && <a href={wish.url} target="_blank" rel="noreferrer" className="link-button">Открыть <ExternalLink size={14} /></a>}
          {publicList && (mine ? (
            <button className="reserve-button mine" onClick={cancel} disabled={busy}><X size={15} /> Отменить бронь</button>
          ) : (
            <button className="reserve-button" onClick={reserve} disabled={busy || reserved}>{busy ? <LoaderCircle size={15} className="spin" /> : reserved ? <Check size={15} /> : <Gift size={15} />} {reserved ? 'Забронировано' : 'Забронировать'}</button>
          ))}
        </div>
        {message && <small className="wish-message">{message}</small>}
      </div>
    </article>
  )
}

function wishWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) return 'желание'
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'желания'
  return 'желаний'
}

createRoot(document.getElementById('root')).render(<App />)
