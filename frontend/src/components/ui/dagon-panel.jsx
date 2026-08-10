import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function PanelShell({ title, description, icon: Icon, action, children, className, style, colors = {} }) {
  const headingColor = colors.heading || "#f8fafc"
  const mutedColor = colors.muted || "#94a3b8"
  const accent = colors.accent || "#22d3ee"

  return (
    <section className={cn("rounded-3xl border p-5", className)} style={style}>
      {(title || description || Icon || action) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl" style={{ backgroundColor: `${accent}20`, color: accent }}>
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>{title}</h3>}
              {description && <p className="mt-1 text-sm leading-relaxed" style={{ color: mutedColor }}>{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function MetricCard({ icon: Icon, label, value, accent, style, colors = {} }) {
  const headingColor = colors.heading || "#f8fafc"
  const mutedColor = colors.muted || "#94a3b8"
  const tone = accent || colors.accent || "#22d3ee"

  return (
    <div className="rounded-3xl border p-5" style={style}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>
        {Icon && <Icon className="h-4 w-4" style={{ color: tone }} />}
        {label}
      </div>
      <p className="mt-2 font-display text-4xl font-black leading-none" style={{ color: headingColor }}>{value}</p>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, style, colors = {} }) {
  const headingColor = colors.heading || "#f8fafc"
  const mutedColor = colors.muted || "#94a3b8"
  const accent = colors.accent || "#22d3ee"

  return (
    <div className="rounded-2xl border p-6 text-center" style={style}>
      {Icon && (
        <span className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl" style={{ backgroundColor: `${accent}18`, color: accent }}>
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-display text-base font-black" style={{ color: headingColor }}>{title}</p>
      {description && <p className="mt-1 text-sm leading-relaxed" style={{ color: mutedColor }}>{description}</p>}
    </div>
  )
}

export function LoadingBlock({ label = "Cargando datos" }) {
  return (
    <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-white/10">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  )
}
