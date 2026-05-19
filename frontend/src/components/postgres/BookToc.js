import { BookOpen, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const BookToc = ({
  tier,
  commandIndex,
  onSelectCommand,
  colors,
  isLight,
  panelStyle
}) => {
  const TierIcon = tier.icon;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="rounded-[28px] border p-5 sm:p-6 dagon-compact-card book-toc"
      style={panelStyle}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p
            className="text-xs font-black uppercase tracking-[0.28em]"
            style={{ color: colors.primary }}
          >
            Libro PostgreSQL
          </p>

          <h2
            className="mt-2 font-display text-2xl font-black"
            style={{ color: colors.text }}
          >
            Ruta {tier.label.toLowerCase()}
          </h2>
        </div>

        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl border"
          style={{
            borderColor: `${colors.primary}33`,
            backgroundColor: isLight
              ? 'rgba(255,255,255,0.72)'
              : 'rgba(255,255,255,0.06)'
          }}
        >
          <TierIcon className="h-6 w-6" style={{ color: colors.primary }} />
        </div>
      </div>

      <div className="book-toc-cover">
        <BookOpen className="h-5 w-5" style={{ color: colors.primary }} />

        <div>
          <p className="book-toc-cover-title" style={{ color: colors.text }}>
            Índice del libro
          </p>

          <p className="book-toc-cover-text" style={{ color: colors.textMuted }}>
            Cada comando es un capítulo.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {tier.commands.map((item, index) => {
          const active = index === commandIndex;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => onSelectCommand(index)}
              className="book-toc-item"
              style={{
                borderColor: active ? colors.primary : colors.border,
                backgroundColor: active
                  ? (isLight ? `${colors.primary}18` : `${colors.primary}1f`)
                  : (isLight ? 'rgba(255,255,255,0.64)' : 'rgba(15,23,42,0.52)'),
                color: colors.text
              }}
            >
              <div>
                <span className="book-toc-chapter">
                  Capítulo {index + 1}
                </span>

                <p className="book-toc-command">
                  {item.name}
                </p>

                <p className="book-toc-purpose" style={{ color: colors.textMuted }}>
                  {item.purpose}
                </p>
              </div>

              <ChevronRight
                className="h-4 w-4 shrink-0"
                style={{ color: active ? colors.primary : colors.textMuted }}
              />
            </button>
          );
        })}
      </div>
    </motion.aside>
  );
};