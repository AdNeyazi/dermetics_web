import { useMemo, useState } from 'react'

interface HighlightItem {
  icon?: string
  label: string
}

function HighlightList({ items }: { items?: HighlightItem[] }) {
  const list = (items || []).filter((x) => x?.label)
  if (!list.length) return <p className="pdp-highlight-empty">No details yet.</p>
  return (
    <ul className="pdp-highlight-list">
      {list.map((item) => (
        <li key={item.label}>
          {item.icon ? <span className="pdp-chip-icon">{item.icon}</span> : null}
          {item.label}
        </li>
      ))}
    </ul>
  )
}

interface PdpHighlightTabsProps {
  formulatedFor?: HighlightItem[]
  freeFrom?: HighlightItem[]
  proTips?: HighlightItem[]
}

export function PdpHighlightTabs({ formulatedFor, freeFrom, proTips }: PdpHighlightTabsProps) {
  const tabs = useMemo(
    () => [
      { key: 'formulated', label: 'Formulated for', items: formulatedFor },
      { key: 'freeFrom', label: 'Free from', items: freeFrom },
      { key: 'longevity', label: 'Longevity tip', items: proTips },
    ].filter((t) => (t.items || []).some((x) => x?.label)),
    [formulatedFor, freeFrom, proTips],
  )

  const [active, setActive] = useState<string | undefined>(() => tabs[0]?.key)

  const currentKey = tabs.some((t) => t.key === active) ? active : tabs[0]?.key

  if (!tabs.length) return null

  return (
    <div className="pdp-highlight-tabs">
      <div className="pdp-highlight-tab-list" role="tablist" aria-label="Product highlights">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={`pdp-highlight-tab-${t.key}`}
            aria-selected={currentKey === t.key}
            aria-controls={`pdp-highlight-panel-${t.key}`}
            className={currentKey === t.key ? 'active' : ''}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.key}
          id={`pdp-highlight-panel-${t.key}`}
          role="tabpanel"
          aria-labelledby={`pdp-highlight-tab-${t.key}`}
          className={`pdp-highlight-panel ${currentKey === t.key ? 'is-active' : ''}`}
          hidden={currentKey !== t.key}
        >
          <HighlightList items={t.items} />
        </div>
      ))}
    </div>
  )
}
