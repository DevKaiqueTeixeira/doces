import { useState } from 'react'

const items = [
  {
    title: 'Componentes isolados',
    description: 'Use React para widgets especificos sem abrir um segundo app.',
  },
  {
    title: 'TypeScript compartilhado',
    description: 'O mesmo projeto pode tipar Vue, React e backend com uma base consistente.',
  },
  {
    title: 'Integracao gradual',
    description: 'Da para migrar ou testar React aos poucos, sem abandonar o restante do stack.',
  },
]

export function ReactWidget() {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectedItem = items[selectedIndex]

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div>
        <small style={{ color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.16em' }}>
          React embutido
        </small>
        <h3 style={{ margin: '8px 0 12px', color: '#f8fafc' }}>Widget React dentro do app Vue</h3>
        <p style={{ margin: 0, color: '#cbd5e1' }}>
          Esta area eh renderizada com React, enquanto o restante da tela usa Vue, Quasar e Pinia.
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            onClick={() => setSelectedIndex(index)}
            style={{
              border: index === selectedIndex ? '1px solid #f97316' : '1px solid rgba(148, 163, 184, 0.2)',
              background: index === selectedIndex ? 'rgba(249, 115, 22, 0.12)' : 'rgba(15, 23, 42, 0.4)',
              color: '#f8fafc',
              borderRadius: '999px',
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div
        style={{
          borderRadius: '18px',
          padding: '18px',
          background: 'rgba(2, 6, 23, 0.45)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
        }}
      >
        <strong style={{ display: 'block', marginBottom: '8px', color: '#f8fafc' }}>
          {selectedItem.title}
        </strong>
        <p style={{ margin: 0, color: '#cbd5e1' }}>{selectedItem.description}</p>
      </div>
    </div>
  )
}
