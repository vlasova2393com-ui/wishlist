import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Heart, Plus, ChevronRight, Gift, Users, Lock, Sparkles } from 'lucide-react'
import './styles.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

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
  const [selected, setSelected] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    setConnected(Boolean(SUPABASE_URL && SUPABASE_KEY))
  }, [])

  if (selected) return <WishlistScreen list={selected} onBack={() => setSelected(null)} />

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
            <button className={`list-card ${list.tone}`} key={list.id} onClick={() => setSelected(list)}>
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
      <div className="status"><span className={connected ? 'dot ok' : 'dot'} />{connected ? 'Supabase подключён' : 'Готово к подключению Supabase'}</div>
    </main>
  )
}

function WishlistScreen({ list, onBack }) {
  const [categories, setCategories] = useState(demoCategories[list.id] || [])
  const [adding, setAdding] = useState(false)
  const [newCategory, setNewCategory] = useState('')

  const addCategory = () => {
    const name = newCategory.trim()
    if (!name || categories.includes(name)) return
    setCategories([...categories, name])
    setNewCategory('')
    setAdding(false)
  }

  return (
    <main className="page wishlist-page">
      <div className="ambient ambient-one" />
      <button className="back" onClick={onBack}>← Все списки</button>
      <section className="hero compact">
        <div>
          <p className="eyebrow">Список желаний</p>
          <h1>{list.name} {list.person && <span className="name-accent">{list.person}</span>}</h1>
          <p className="subtitle">{list.description}</p>
        </div>
        <button className="primary"><Plus size={18} /> Добавить</button>
      </section>

      <div className="categories">
        {categories.map((category, i) => (
          <section className={`category category-${i % 3}`} key={category}>
            <div className="category-head">
              <div>
                <span className="category-index">{String(i + 1).padStart(2, '0')}</span>
                <h2>{category}</h2>
              </div>
              <span>{i === 0 ? '0 желаний' : ''}</span>
            </div>
            {i === 0 ? <div className="empty">Пока здесь пусто.<br />Добавь первое желание.</div> : null}
          </section>
        ))}
      </div>

      {adding ? (
        <div className="add-category">
          <input autoFocus value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCategory()} placeholder="Название рубрики" />
          <button className="primary" onClick={addCategory}>Добавить</button>
          <button className="cancel" onClick={() => setAdding(false)}>Отмена</button>
        </div>
      ) : (
        <button className="add-category-trigger" onClick={() => setAdding(true)}><Plus size={17} /> Добавить рубрику</button>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
