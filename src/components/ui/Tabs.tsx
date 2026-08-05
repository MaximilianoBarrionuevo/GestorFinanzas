import type { LucideIcon } from "lucide-react"

export type TabItem = {
  id: string
  label: string
  icon: LucideIcon
}

type Props = {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
}

export default function Tabs({ tabs, active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Secciones del dashboard"
      className="flex gap-1 rounded-2xl border border-emerald-100 bg-white/90 backdrop-blur-sm shadow-sm p-1.5 overflow-x-auto"
    >
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = tab.id === active
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-xl text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
              isActive
                ? "bg-[#2E6F40] text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}