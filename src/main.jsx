import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Heart, Plus, ChevronRight, Gift, Users, Lock } from 'lucide-react'
import './styles.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const demoLists = [
  { id: 'julia', name: 'Мой вишлист Юлии', description: 'То, чему я буду рада', icon: Heart, tone: 'rose', access: 'Открыт по ссылке' },
  { id: 'sergey', name: 'Вишлист Сергея', description: 'Личные желания Сергея', icon: Gift, tone: 'blue', access: 'Приватный' },
  { id: 'shared', name: 'Наши общие хотелки', description: 'То, что хотим вместе', icon: Users, tone: 'violet', access: 'Приватный' },
]

function App() {
  const [selected, setSelected] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    setConnected(Boolean(SUPABASE_URL && SUPABASE_KEY))
  }, [])

  if (selected) return <WishlistScreen list={selected} onBack={() => setSelected(null)} />

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Юлия + Сергей</p>
          <h1>Наши желания</h1>
          <p className="subtitle">Место, где желания превращаются в подарки и планы.</p>
        </div>
        <button className="icon-button" aria-label="Добавить вишлист"><Plus size={21} /></button>
      </section>

      <section className="lists">
        {demoLists.map((list) => {
          const Icon = list.icon
          return (
            <button className="list-card" key={list.id} onClick={() => setSelected(list)}>
              <span className={`list-icon ${list.tone}`}><Icon size={22} /></span>
              <span className="list-copy">
                <strong>{list.name}</strong>
                <span>{list.description}</span>
                <small>{list.access}</small>
              </span>
              <ChevronRight size={20} className="arrow" />
            </button>
          )
        })}
      </section>

      <div className="status"><span className={connected ? 'dot ok' : 'dot'} />{connected ? 'Supabase подключён' : 'Готово к подключению Supabase'}</div>
    </main>
  )
}

function WishlistScreen({ list, onBack }) {
  return (
    <main className="page">
      <button className="back" onClick={onBack}>← Все вишлисты</button>
      <section className="hero compact">
        <div>
          <p className="eyebrow">Вишлист</p>
          <h1>{list.name}</h1>
          <p className="subtitle">{list.description}</p>
        </div>
        <button className="primary"><Plus size={19} /> Добавить</button>
      </section>
      <div className="categories">
        {['Хочу', 'Подарки', 'Для дома', 'Путешествия'].map((category, i) => (
          <section className="category" key={category}>
            <div className="category-head"><h2>{category}</h2><span>{i === 0 ? '0 желаний' : ''}</span></div>
            {i === 0 ? <div className="empty">Пока здесь пусто.<br />Добавь первое желание.</div> : null}
          </section>
        ))}
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)
