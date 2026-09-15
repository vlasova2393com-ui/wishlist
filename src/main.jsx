import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Heart, Plus, ChevronRight, Gift, Users, Sparkles, ExternalLink, LoaderCircle, Check, X, Pencil, Trash2, LogIn, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import './styles.css'

const LISTS = [
  { id: 'julia', name: 'Список желаний.', person: 'Юлия', description: 'То, чему я буду рада', icon: Heart, tone: 'rose', access: 'Открыт по ссылке' },
  { id: 'sergey', name: 'Список желаний.', person: 'Сергей', description: 'То, чему я буду рад', icon: Gift, tone: 'blue', access: 'Приватный' },
  { id: 'shared', name: 'Наши общие хотелки', description: 'То, что хотим вместе', icon: Users, tone: 'violet', access: 'Приватный' },
]
const DEMO_CATEGORIES = { julia: ['Хочу', 'Подарки', 'Для дома', 'Путешествия'], sergey: ['Хочу', 'Техника', 'Для дома'], shared: ['Путешествия', 'Для дома', 'Большие покупки', 'Планы', 'Куда сходить'] }
const PROFILE_IDS = { julia: '033173b8-7ccb-4333-920c-d1cee29b071a', sergey: '0b1cd22c-21b3-4848-a3b4-8bad8f868c86' }

function App() {
  const [selected, setSelected] = useState(() => location.pathname.endsWith('/julia') ? LISTS[0] : null)
  const open = (list) => { setSelected(list); if (list.id === 'julia') history.pushState({}, '', `${import.meta.env.BASE_URL}julia`) }
  const home = () => { setSelected(null); history.pushState({}, '', import.meta.env.BASE_URL) }
  if (selected) return <WishlistScreen list={selected} onBack={home} />
  return <main className="page home-page"><div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <section className="hero home-hero"><div><p className="eyebrow">Юлия <span>+</span> Сергей</p><h1>Наши <em>желания</em></h1><p className="subtitle">Место, где желания превращаются в подарки и планы.</p></div><button className="icon-button"><Plus size={21} /></button></section>
    <section className="lists">{LISTS.map(list => { const Icon = list.icon; return <button className={`list-card ${list.tone}`} key={list.id} onClick={() => open(list)}><span className="list-icon"><Icon size={21} /></span><span className="list-copy"><strong>{list.name} <span className="person-name">{list.person}</span></strong><span>{list.description}</span><small>{list.access}</small></span><span className="card-arrow"><ChevronRight size={18} /></span></button> })}</section>
    <div className="footer-note"><Sparkles size={13} /> Сделано для желаний, которые хочется осуществить</div>
  </main>
}

function WishlistScreen({ list, onBack }) {
  const publicList = list.id === 'julia'
  const [data, setData] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('')
  const [session, setSession] = useState(null), [profile, setProfile] = useState(null)
  const [authOpen, setAuthOpen] = useState(false), [claimOpen, setClaimOpen] = useState(false), [editor, setEditor] = useState(null)
  const [newCategory, setNewCategory] = useState(false), [categoryName, setCategoryName] = useState('')

  const load = async () => {
    setLoading(true); setError('')
    if (publicList) {
      const { data: result, error: e } = await supabase.rpc('get_public_wishlist', { p_slug: 'julia' })
      if (e) setError(e.message); else setData(result)
      setLoading(false); return
    }
    const { data: auth } = await supabase.auth.getSession(); const current = auth.session
    setSession(current)
    if (!current) { setData({ name: `${list.name} ${list.person || ''}`, description: list.description, categories: DEMO_CATEGORIES[list.id].map(name => ({ name, wishes: [] })) }); setLoading(false); return }
    const { data: p } = await supabase.from('profiles').select('*').eq('auth_user_id', current.user.id).maybeSingle(); setProfile(p)
    const dbName = list.id === 'sergey' ? 'Вишлист Сергея' : 'Наши общие хотелки'
    const { data: wishlist, error: we } = await supabase.from('wishlists').select('*').eq('name', dbName).maybeSingle()
    if (we || !wishlist) { setError(we?.message || 'Вишлист не найден'); setLoading(false); return }
    const [{ data: cats, error: ce }, { data: wishes, error: xe }] = await Promise.all([
      supabase.from('categories').select('*').eq('wishlist_id', wishlist.id).order('position'),
      supabase.from('wishes').select('*').eq('wishlist_id', wishlist.id).eq('status', 'active').order('position')
    ])
    if (ce || xe) setError(ce?.message || xe?.message || 'Не удалось загрузить желания')
    setData({ ...wishlist, categories: (cats || []).map(c => ({ ...c, wishes: (wishes || []).filter(w => w.category_id === c.id) })) })
    setLoading(false)
  }

  useEffect(() => { load(); if (!publicList) { const { data: sub } = supabase.auth.onAuthStateChange(() => load()); return () => sub.subscription.unsubscribe() } }, [list.id])
  const categories = data?.categories || [], canEdit = !publicList && !!profile
  const addWish = category => setEditor({ category_id: category?.id || categories[0]?.id, priority: 'medium', currency: 'RUB', status: 'active' })
  const deleteWish = async wish => { if (!confirm(`Удалить «${wish.title}»?`)) return; const { error: e } = await supabase.from('wishes').update({ status: 'archived' }).eq('id', wish.id); if (e) setError(e.message); else load() }
  const addCategory = async () => { const name = categoryName.trim(); if (!name) return; const { error: e } = await supabase.from('categories').insert({ wishlist_id: data.id, name, position: categories.length }); if (e) setError(e.message); else { setCategoryName(''); setNewCategory(false); load() } }
  const logout = async () => { await supabase.auth.signOut(); setProfile(null); setSession(null); load() }

  return <main className="page wishlist-page"><div className="ambient ambient-one" /><button className="back" onClick={onBack}>← Все списки</button>
    <section className="hero compact"><div><p className="eyebrow">Список желаний</p><h1>{data?.name || `${list.name} ${list.person || ''}`}</h1><p className="subtitle">{data?.description || list.description}</p></div>{!publicList && <div className="hero-actions">{session ? <button className="secondary" onClick={logout}><LogOut size={16} /> Выйти</button> : <button className="primary" onClick={() => setAuthOpen(true)}><LogIn size={17} /> Войти</button>}{canEdit && <button className="primary" onClick={() => addWish(categories[0])}><Plus size={18} /> Добавить</button>}</div>}</section>
    {!publicList && session && !profile && <div className="setup-box"><strong>Настрой доступ</strong><span>Выбери свой профиль один раз.</span><button className="primary" onClick={() => setClaimOpen(true)}>Выбрать профиль</button></div>}
    {loading ? <div className="loading"><LoaderCircle size={22} className="spin" /> Загружаю желания…</div> : error ? <div className="error-box">Не удалось загрузить вишлист.<br /><small>{error}</small></div> : <div className="categories">{categories.map((c, i) => <CategoryCard key={c.id || c.name} category={c} index={i} publicList={publicList} canEdit={canEdit} onAdd={() => addWish(c)} onEdit={setEditor} onDelete={deleteWish} />)}</div>}
    {!publicList && canEdit && (newCategory ? <div className="add-category"><input autoFocus value={categoryName} onChange={e => setCategoryName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCategory()} placeholder="Название рубрики" /><button className="primary" onClick={addCategory}>Добавить</button><button className="cancel" onClick={() => setNewCategory(false)}>Отмена</button></div> : <button className="add-category-trigger" onClick={() => setNewCategory(true)}><Plus size={17} /> Добавить рубрику</button>)}
    {authOpen && <AuthModal close={() => setAuthOpen(false)} />}
    {claimOpen && <ClaimModal close={() => setClaimOpen(false)} claim={async id => { const { error: e } = await supabase.rpc('claim_profile', { p_profile_id: id }); if (e) setError(e.message); else { setClaimOpen(false); load() } }} />}
    {editor && <WishModal wish={editor} wishlistId={data?.id} profileId={profile?.id} categories={categories} close={() => setEditor(null)} saved={() => { setEditor(null); load() }} />}
  </main>
}

function CategoryCard({ category, index, publicList, canEdit, onAdd, onEdit, onDelete }) {
  const wishes = category.wishes || []
  return <section className={`category category-${index % 3}`}><div className="category-head"><div><span className="category-index">{String(index + 1).padStart(2, '0')}</span><h2>{category.name}</h2></div><div className="category-tools"><span>{wishes.length} {wishWord(wishes.length)}</span>{canEdit && <button className="mini-button" onClick={onAdd}><Plus size={14} /></button>}</div></div>{wishes.length ? <div className="wishes">{wishes.map(w => <WishCard key={w.id} wish={w} publicList={publicList} canEdit={canEdit} onEdit={() => onEdit(w)} onDelete={() => onDelete(w)} />)}</div> : <div className="empty">Пока здесь пусто.<br />{canEdit ? 'Добавь первое желание.' : 'Здесь появятся желания.'}</div>}</section>
}

function WishCard({ wish, publicList, canEdit, onEdit, onDelete }) {
  const key = `wishlist-reservation:${wish.id}`, [busy, setBusy] = useState(false), [reserved, setReserved] = useState(!!wish.reserved), [mine, setMine] = useState(() => !!localStorage.getItem(key)), [message, setMessage] = useState('')
  const reserve = async () => { setBusy(true); const { data, error: e } = await supabase.rpc('reserve_gift', { p_wish_id: wish.id }); if (e) { setMessage(e.message.includes('already reserved') ? 'Этот подарок уже забрали' : 'Не получилось забронировать') ; setReserved(true) } else { localStorage.setItem(key, data); setMine(true); setReserved(true); setMessage('Подарок забронирован') } setBusy(false) }
  const cancel = async () => { const token = localStorage.getItem(key); if (!token) return; setBusy(true); const { data, error: e } = await supabase.rpc('cancel_gift_reservation', { p_token: token }); if (e || !data) setMessage('Не удалось отменить бронь'); else { localStorage.removeItem(key); setMine(false); setReserved(false); setMessage('Бронь отменена') } setBusy(false) }
  return <article className={`wish-card ${reserved ? 'is-reserved' : ''}`}>{wish.image_url ? <img src={wish.image_url} className="wish-image" alt="" /> : <div className="wish-image placeholder"><Gift size={22} /></div>}<div className="wish-body"><div className="wish-top"><h3>{wish.title}</h3><span className="priority">{wish.priority === 'high' ? '⭐' : wish.priority === 'medium' ? '❤️' : '🙂'}</span></div>{wish.description && <p>{wish.description}</p>}{wish.approximate_price != null && <strong className="price">≈ {Number(wish.approximate_price).toLocaleString('ru-RU')} {wish.currency || 'RUB'}</strong>}<div className="wish-actions">{wish.url && <a href={wish.url} target="_blank" rel="noreferrer" className="link-button">Открыть <ExternalLink size={14} /></a>}{publicList && (mine ? <button className="reserve-button mine" onClick={cancel} disabled={busy}><X size={15} /> Отменить бронь</button> : <button className="reserve-button" onClick={reserve} disabled={busy || reserved}>{busy ? <LoaderCircle size={15} className="spin" /> : reserved ? <Check size={15} /> : <Gift size={15} />} {reserved ? 'Забронировано' : 'Забронировать'}</button>)}{canEdit && <><button className="icon-mini" onClick={onEdit}><Pencil size={14} /></button><button className="icon-mini danger" onClick={onDelete}><Trash2 size={14} /></button></>}</div>{message && <small className="wish-message">{message}</small>}</div></article>
}

function WishModal({ wish, wishlistId, profileId, categories, close, saved }) {
  const [form, setForm] = useState({ title: '', description: '', url: '', image_url: '', approximate_price: '', currency: 'RUB', priority: 'medium', category_id: categories[0]?.id || '', ...wish }), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const submit = async e => { e.preventDefault(); setBusy(true); setError(''); if (!form.title?.trim()) { setError('Напиши название желания'); setBusy(false); return } const payload = { wishlist_id: wishlistId, category_id: form.category_id, created_by: profileId, title: form.title.trim(), description: form.description?.trim() || null, url: form.url?.trim() || null, image_url: form.image_url?.trim() || null, approximate_price: form.approximate_price === '' ? null : Number(form.approximate_price), currency: form.currency || 'RUB', priority: form.priority, status: 'active', position: form.position || 0 }; const q = form.id ? supabase.from('wishes').update(payload).eq('id', form.id) : supabase.from('wishes').insert(payload); const { error: e2 } = await q; if (e2) setError(e2.message); else saved(); setBusy(false) }
  return <div className="modal-backdrop"><form className="modal" onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">Желание</p><h2>{wish.id ? 'Редактировать' : 'Добавить желание'}</h2></div><button type="button" className="close-button" onClick={close}><X size={18} /></button></div><label>Название<input autoFocus required value={form.title || ''} onChange={e => set('title', e.target.value)} placeholder="Например, новые наушники" /></label><div className="form-grid"><label>Цена<input type="number" min="0" value={form.approximate_price ?? ''} onChange={e => set('approximate_price', e.target.value)} placeholder="15000" /></label><label>Валюта<select value={form.currency || 'RUB'} onChange={e => set('currency', e.target.value)}><option>RUB</option><option>EUR</option><option>USD</option></select></label></div><label>Категория<select value={form.category_id || ''} onChange={e => set('category_id', e.target.value)}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Ссылка<input type="url" value={form.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://..." /></label><label>Фото, ссылка на изображение<input type="url" value={form.image_url || ''} onChange={e => set('image_url', e.target.value)} placeholder="https://.../image.jpg" /></label><label>Описание<textarea rows="3" value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Что именно нравится и почему" /></label><div><span className="field-title">Приоритет</span><div className="priority-picker">{[['high','⭐ Очень хочу'],['medium','❤️ Хочу'],['low','🙂 Было бы приятно']].map(([v,t]) => <button type="button" key={v} className={form.priority === v ? 'selected' : ''} onClick={() => set('priority', v)}>{t}</button>)}</div></div>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="cancel" onClick={close}>Отмена</button><button className="primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />} Сохранить</button></div></form></div>
}

function AuthModal({ close }) {
  const [email, setEmail] = useState(''), [sent, setSent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const submit = async e => { e.preventDefault(); setBusy(true); const { error: e2 } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: location.href } }); if (e2) setError(e2.message); else setSent(true); setBusy(false) }
  return <div className="modal-backdrop"><form className="modal small-modal" onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">Доступ владельца</p><h2>Войти</h2></div><button type="button" className="close-button" onClick={close}><X size={18} /></button></div>{sent ? <div className="success-note">Письмо отправлено на <strong>{email}</strong>.<br />Открой ссылку из письма.</div> : <><p className="modal-text">Вход нужен для добавления и редактирования желаний.</p><label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>{error && <div className="form-error">{error}</div>}<div className="modal-actions"><button type="button" className="cancel" onClick={close}>Отмена</button><button className="primary" disabled={busy}>{busy ? 'Отправляю…' : 'Получить ссылку'}</button></div></>}</form></div>
}

function ClaimModal({ close, claim }) { return <div className="modal-backdrop"><div className="modal small-modal"><div className="modal-head"><div><p className="eyebrow">Первый вход</p><h2>Кто вы?</h2></div><button className="close-button" onClick={close}><X size={18} /></button></div><p className="modal-text">Выбери свой профиль один раз. После этого сайт запомнит доступ.</p><div className="claim-buttons"><button className="claim-button" onClick={() => claim(PROFILE_IDS.julia)}>Юлия <ChevronRight size={16} /></button><button className="claim-button" onClick={() => claim(PROFILE_IDS.sergey)}>Сергей <ChevronRight size={16} /></button></div></div></div> }
function wishWord(n) { if (n % 10 === 1 && n % 100 !== 11) return 'желание'; if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'желания'; return 'желаний' }

createRoot(document.getElementById('root')).render(<App />)
