import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Heart, Plus, ChevronRight, Gift, Users, Sparkles, ExternalLink, LoaderCircle, Check, X, Pencil, Trash2, LogIn, LogOut } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [session, setSession] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [claimOpen, setClaimOpen] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategory, setNewCategory] = useState('')
  const [wishEditor, setWishEditor] = useState(null)

  const load = async () => {
    setLoading(true)
    setError('')
    if (isPublic) {
      const { data: result, error: rpcError } = await supabase.rpc('get_public_wishlist', { p_slug: 'julia' })
      if (rpcError) setError(rpcError.message)
      else setData(result)
      setLoading(false)
      return
    }

    const { data: authData } = await supabase.auth.getSession()
    setSession(authData.session)
    if (!authData.session) {
      setData({ name: `${list.name} ${list.person || ''}`, description: list.description, categories: demoCategories[list.id].map((name) => ({ name, wishes: [] })) })
      setLoading(false)
      return
    }

    const { data: p, error: profileError } = await supabase.from('profiles').select('*').eq('auth_user_id', authData.session.user.id).maybeSingle()
    if (profileError) setError(profileError.message)
    setProfile(p)

    const { data: wishlist, error: wishlistError } = await supabase.from('wishlists').select('id,name,description,visibility').eq('name', list.id === 'sergey' ? 'Вишлист Сергея' : 'Наши общие хотелки').maybeSingle()
    if (wishlistError || !wishlist) {
      setError(wishlistError?.message || 'Вишлист не найден')
      setLoading(false)
      return
    }

    const [{ data: cats, error: catError }, { data: wishes, error: wishError }] = await Promise.all([
      supabase.from('categories').select('*').eq('wishlist_id', wishlist.id).order('position'),
      supabase.from('wishes').select('*').eq('wishlist_id', wishlist.id).eq('status', 'active').order('position'),
    ])
    if (catError || wishError) setError(catError?.message || wishError?.message || 'Не удалось загрузить желания')
    const categories = (cats || []).map((cat) => ({ ...cat, wishes: (wishes || []).filter((wish) => wish.category_id === cat.id) }))
    setData({ ...wishlist, categories })
    setLoading(false)
  }

  useEffect(() => {
    load()
    if (!isPublic) {
      const { data: listener } = supabase.auth.onAuthStateChange(() => load())
      return () => listener.subscription.unsubscribe()
    }
  }, [list.id])

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    await load()
  }

  const addCategory = async () => {
    const name = newCategory.trim()
    if (!name || !data?.id || !profile) return
    const position = (data.categories || []).length
    const { error: insertError } = await supabase.from('categories').insert({ wishlist_id: data.id, name, position })
    if (insertError) return setError(insertError.message)
    setNewCategory('')
    setAddingCategory(false)
    await load()
  }

  const editWish = (wish) => setWishEditor(wish)
  const newWish = (category) => setWishEditor({ category_id: category.id, priority: 'medium', currency: 'RUB', status: 'active' })

  const deleteWish = async (wish) => {
    if (!profile || !window.confirm(`Удалить «${wish.title}»?`)) return
    const { error: deleteError } = await supabase.from('wishes').update({ status: 'archived' }).eq('id', wish.id)
    if (deleteError) setError(deleteError.message)
    else await load()
  }

  const categories = data?.categories || []
  const canEdit = !isPublic && Boolean(profile)

  return (
    <main className="page wishlist-page">
      <div className="ambient ambient-one" />
      <button className="back" onClick={onBack}>← Все списки</button>
      <section className="hero compact">
        <div>
          <p className="eyebrow">Список желаний</p>
          <h1>{data?.name || `${list.name} ${list.person || ''}`}</h1>
          <p className="subtitle">{data?.description || list.description}</p>
        </div>
        {!isPublic && (
          <div className="hero-actions">
            {session ? <button className="secondary" onClick={signOut}><LogOut size={16} /> Выйти</button> : <button className="primary" onClick={() => setAuthOpen(true)}><LogIn size={17} /> Войти</button>}
            {canEdit && <button className="primary" onClick={() => newWish(categories[0])} disabled={!categories.length}><Plus size={18} /> Добавить</button>}
          </div>
        )}
      </section>

      {!isPublic && session && !profile && (
        <div className="setup-box">
          <strong>Остался один шаг</strong>
          <span>Выбери, чей профиль привязать к этому аккаунту.</span>
          <button className="primary" onClick={() => setClaimOpen(true)}>Настроить профиль</button>
        </div>
      )}

      {loading ? <div className="loading"><LoaderCircle size={22} className="spin" /> Загружаю желания…</div> : error ? <div className="error-box">Не удалось загрузить вишлист.<br /><small>{error}</small></div> : (
        <div className="categories">
          {categories.map((category, i) => <CategoryCard key={category.id || category.name} category={category} index={i} publicList={isPublic} canEdit={canEdit} onAddWish={newWish} onEditWish={editWish} onDeleteWish={deleteWish} />)}
        </div>
      )}

      {!isPublic && canEdit && (addingCategory ? (
        <div className="add-category">
          <input autoFocus value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCategory()} placeholder="Название рубрики" />
          <button className="primary" onClick={addCategory}>Добавить</button>
          <button className="cancel" onClick={() => setAddingCategory(false)}>Отмена</button>
        </div>
      ) : <button className="add-category-trigger" onClick={() => setAddingCategory(true)}><Plus size={17} /> Добавить рубрику</button>)}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      {claimOpen && <ClaimModal onClose={() => setClaimOpen(false)} onClaim={async (id) => { const { error: claimError } = await supabase.rpc('claim_profile', { p_profile_id: id }); if (claimError) { setError(claimError.message); return } setClaimOpen(false); await load() }} />}
      {wishEditor && <WishModal wish={wishEditor} wishlistId={data?.id} profileId={profile?.id} categories={categories} onClose={() => setWishEditor(null)} onSaved={async () => { setWishEditor(null); await load() }} />}
    </main>
  )
}

function CategoryCard({ category, index, publicList, canEdit, onAddWish, onEditWish, onDeleteWish }) {
  const wishes = category.wishes || []
  return (
    <section className={`category category-${index % 3}`}>
      <div className="category-head">
        <div><span className="category-index">{String(index + 1).padStart(2, '0')}</span><h2>{category.name}</h2></div>
        <div className="category-tools">
          <span>{wishes.length} {wishWord(wishes.length)}</span>
          {canEdit && <button className="mini-button" onClick={() => onAddWish(category)}><Plus size={14} /></button>}
        </div>
      </div>
      {wishes.length ? <div className="wishes">{wishes.map((wish) => <WishCard key={wish.id} wish={wish} publicList={publicList} canEdit={canEdit} onEdit={() => onEditWish(wish)} onDelete={() => onDeleteWish(wish)} />)}</div> : <div className="empty">Пока здесь пусто.<br />{canEdit ? 'Добавь первое желание.' : 'Здесь появятся желания.'}</div>}
    </section>
  )
}

function WishCard({ wish, publicList, canEdit, onEdit, onDelete }) {
  const tokenKey = `wishlist-reservation:${wish.id}`
  const [busy, setBusy] = useState(false)
  const [reserved, setReserved] = useState(Boolean(wish.reserved))
  const [mine, setMine] = useState(() => Boolean(localStorage.getItem(tokenKey)))
  const [message, setMessage] = useState('')

  const reserve = async () => {
    setBusy(true); setMessage('')
    const { data, error } = await supabase.rpc('reserve_gift', { p_wish_id: wish.id })
    if (error) { setMessage(error.message.includes('already reserved') ? 'Этот подарок уже забрали' : 'Не получилось забронировать'); setReserved(true) }
    else { localStorage.setItem(tokenKey, data); setMine(true); setReserved(true); setMessage('Подарок забронирован') }
    setBusy(false)
  }
  const cancel = async () => {
    const token = localStorage.getItem(tokenKey); if (!token) return
    setBusy(true)
    const { data, error } = await supabase.rpc('cancel_gift_reservation', { p_token: token })
    if (error || !data) setMessage('Не удалось отменить бронь')
    else { localStorage.removeItem(tokenKey); setMine(false); setReserved(false); setMessage('Бронь отменена') }
    setBusy(false)
  }

  return <article className={`wish-card ${reserved ? 'is-reserved' : ''}`}>
    {wish.image_url ? <img src={wish.image_url} alt="" className="wish-image" /> : <div className="wish-image placeholder"><Gift size={22} /></div>}
    <div className="wish-body">
      <div className="wish-top"><h3>{wish.title}</h3><span className={`priority ${wish.priority}`}>{wish.priority === 'high' ? '⭐' : wish.priority === 'medium' ? '❤️' : '🙂'}</span></div>
      {wish.description && <p>{wish.description}</p>}
      {wish.approximate_price != null && <strong className="price">≈ {Number(wish.approximate_price).toLocaleString('ru-RU')} {wish.currency || 'RUB'}</strong>}
      <div className="wish-actions">
        {wish.url && <a href={wish.url} target="_blank" rel="noreferrer" className="link-button">Открыть <ExternalLink size={14} /></a>}
        {publicList && (mine ? <button className="reserve-button mine" onClick={cancel} disabled={busy}><X size={15} /> Отменить бронь</button> : <button className="reserve-button" onClick={reserve} disabled={busy || reserved}>{busy ? <LoaderCircle size={15} className="spin" /> : reserved ? <Check size={15} /> : <Gift size={15} />} {reserved ? 'Забронировано' : 'Забронировать'}</button>)}
        {canEdit && <><button className="icon-mini" onClick={onEdit} title="Редактировать"><Pencil size={14} /></button><button className="icon-mini danger" onClick={onDelete} title="Удалить"><Trash2 size={14} /></button></>}
      </div>
      {message && <small className="wish-message">{message}</small>}
    </div>
  </article>
}

function WishModal({ wish, wishlistId, profileId, categories, onClose, onSaved }) {
  const [form, setForm] = useState({ title: '', description: '', url: '', image_url: '', approximate_price: '', currency: 'RUB', priority: 'medium', category_id: categories[0]?.id || '', ...wish })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const save = async (e) => {
    e.preventDefault(); setBusy(true); setError('')
    const payload = { wishlist_id: wishlistId, category_id: form.category_id, created_by: profileId, title: form.title.trim(), description: form.description.trim() || null, url: form.url.trim() || null, image_url: form.image_url.trim() || null, approximate_price: form.approximate_price === '' ? null : Number(form.approximate_price), currency: form.currency || 'RUB', priority: form.priority, status: 'active', position: wish.position ?? 0 }
    if (!payload.title) { setError('Напиши название желания'); setBusy(false); return }
    const query = form.id ? supabase.from('wishes').update(payload).eq('id', form.id) : supabase.from('wishes').insert(payload)
    const { error: saveError } = await query
    if (saveError) setError(saveError.message)
    else await onSaved()
    setBusy(false)
  }

  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><form className="modal" onSubmit={save}>
    <div className="modal-head"><div><p className="eyebrow">Желание</p><h2>{wish.id ? 'Редактировать' : 'Добавить желание'}</h2></div><button type="button" className="close-button" onClick={onClose}><X size={18} /></button></div>
    <label>Название<input value={form.title || ''} onChange={(e) => update('title', e.target.value)} placeholder="Например, новые наушники" autoFocus /></label>
    <div className="form-grid"><label>Цена<input type="number" min="0" step="1" value={form.approximate_price ?? ''} onChange={(e) => update('approximate_price', e.target.value)} placeholder="15000" /></label><label>Валюта<select value={form.currency || 'RUB'} onChange={(e) => update('currency', e.target.value)}><option>RUB</option><option>EUR</option><option>USD</option></select></label></div>
    <label>Категория<select value={form.category_id || ''} onChange={(e) => update('category_id', e.target.value)}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label>Ссылка<input type="url" value={form.url || ''} onChange={(e) => update('url', e.target.value)} placeholder="https://..." /></label>
    <label>Фото, ссылка на изображение<input type="url" value={form.image_url || ''} onChange={(e) => update('image_url', e.target.value)} placeholder="https://.../image.jpg" /></label>
    <label>Описание<textarea rows="3" value={form.description || ''} onChange={(e) => update('description', e.target.value)} placeholder="Что именно нравится и почему" /></label>
    <div><span className="field-title">Приоритет</span><div className="priority-picker">{[['high','⭐ Очень хочу'],['medium','❤️ Хочу'],['low','🙂 Было бы приятно']].map(([value, label]) => <button type="button" key={value} className={form.priority === value ? 'selected' : ''} onClick={() => update('priority', value)}>{label}</button>)}</div></div>
    {error && <div className="form-error">{error}</div>}
    <div className="modal-actions"><button type="button" className="cancel" onClick={onClose}>Отмена</button><button className="primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} Сохранить</button></div>
  </form></div>
}

function AuthModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => { e.preventDefault(); setBusy(true); setError(''); const { error: authError } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.href } }); if (authError) setError(authError.message); else setSent(true); setBusy(false) }
  return <div className="modal-backdrop"><form className="modal small-modal" onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">Доступ владельца</p><h2>Войти</h2></div><button type="button" className="close-button" onClick={onClose}><X size={18} /></button></div>{sent ? <div className="success-note">Письмо отправлено на <strong>{email}</strong>.<br />Открой ссылку в письме, и вернись сюда.</div> : <><p className="modal-text">Вход нужен только для добавления и редактирования желаний.</p><label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="cancel" onClick={onClose}>Отмена</button><button className="primary" disabled={busy}>{busy ? 'Отправляю…' : 'Получить ссылку'}</button></div></>}</form></div>
}

function ClaimModal({ onClose, onClaim }) {
  const profiles = [{ id: 'd4f2e2f7-4b7c-4a18-9f11-8e4b3f6e7a10', name: 'Юлия' }, { id: '9c6b7a5d-2f31-4c82-a8e9-1d6f4b3c2a90', name: 'Сергей' }]
  return <div className="modal-backdrop"><div className="modal small-modal"><div className="modal-head"><div><p className="eyebrow">Первый вход</p><h2>Кто вы?</h2></div><button className="close-button" onClick={onClose}><X size={18} /></button></div><p className="modal-text">Выбери свой профиль один раз. После этого сайт запомнит доступ.</p><div className="claim-buttons">{profiles.map((p) => <button key={p.id} className="claim-button" onClick={() => onClaim(p.id)}>{p.name}<ChevronRight size={16} /></button>)}</div></div></div>
}

function wishWord(count) {
  if (count % 10 === 1 && count % 100 !== 11) return 'желание'
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'желания'
  return 'желаний'
}

createRoot(document.getElementById('root')).render(<App />)
