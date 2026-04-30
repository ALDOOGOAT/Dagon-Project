import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Code, Zap, BookOpen, ChevronRight, Sparkles, Bot } from 'lucide-react';
import { Button } from './ui/button';
import { DagonMascot } from './DagonMascot';
import { useTheme } from '../contexts/ThemeContext';

const didacticTopics = [
  {
    id: 'sql-basics',
    icon: Code,
    title: 'SQL: Tu Voz en la Base de Datos',
    shortDesc: 'El lenguaje universal para comunicarte con datos',
    fullExplanation: 'SQL (Structured Query Language) es como dar instrucciones en español a una biblioteca mágica. Con SELECT pides información, con INSERT agregas nuevos libros, y con UPDATE modificas existentes. Es el estándar global usado por todas las empresas.',
    example: "SELECT nombre, nivel \nFROM aventureros \nWHERE clase = 'Guerrero';",
    color: 'from-blue-600 to-cyan-700',
    borderColor: 'border-blue-400/50',
    bgColor: 'bg-blue-500/10',
    aiGlow: 'shadow-[0_0_20px_rgba(59,130,246,0.2)]'
  },
  {
    id: 'postgres-why',
    icon: Database,
    title: '¿Por qué PostgreSQL?',
    shortDesc: 'El motor más robusto, confiable y gratuito del mundo',
    fullExplanation: 'PostgreSQL es el motor de base de datos open-source más avanzado. Lo usan empresas como Uber, Netflix, Instagram y Apple. Soporta JSON, procesamiento geoespacial, y es increíblemente estable. ¡Es la mejor opción para aprender SQL real!',
    example: '-- Conectando a PostgreSQL\npsql -h localhost -U usuario -d dagon_db',
    color: 'from-green-600 to-emerald-700',
    borderColor: 'border-green-400/50',
    bgColor: 'bg-green-500/10',
    aiGlow: 'shadow-[0_0_20px_rgba(16,185,129,0.2)]'
  },
  {
    id: 'dagon-mission',
    icon: Zap,
    title: 'Nuestra Misión con Dagon',
    shortDesc: 'Revolucionar el aprendizaje de SQL gamificándolo',
    fullExplanation: 'Dagon nació porque creemos que aprender SQL no debe ser aburrido. Nuestra misión es que domines bases de datos jugando, sin clases magistrales aburridas. Queremos que cada consulta SQL se sienta como una victoria en tu aventura por el Abismo de los Datos.',
    example: '¡Compite, gana XP, sube de nivel y diviértete!',
    color: 'from-fuchsia-600 to-purple-700',
    borderColor: 'border-fuchsia-400/50',
    bgColor: 'bg-fuchsia-500/10',
    aiGlow: 'shadow-[0_0_20px_rgba(217,70,239,0.2)]'
  }
];

export const DidacticCard = ({ onExplore }) => {
  const [expandedTopic, setExpandedTopic] = useState(null);
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;
  
  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="glass-card-apple rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border mb-6 sm:mb-8 relative overflow-hidden backdrop-blur-xl"
      style={{ borderColor: colors.border, backgroundColor: isLight ? 'rgba(255,250,240,0.78)' : 'rgba(0,0,0,0.40)' }}
    >
      {/* Luces de fondo estilo IA */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: isLight ? 'rgba(251,146,60,0.12)' : 'rgba(192,38,211,0.10)' }} />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: isLight ? 'rgba(250,204,21,0.10)' : 'rgba(8,145,178,0.10)' }} />
      
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `linear-gradient(135deg, ${colors.primary}22, ${colors.accent}22)`, border: `1px solid ${colors.border}` }}>
          <Bot className="w-6 h-6" style={{ color: colors.primary }} />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-1 flex items-center gap-2" style={{ color: colors.accent }}>
            <Sparkles className="w-3 h-3" /> Base de Conocimiento
          </p>
          {/* Título con gradiente tipo IA */}
          <h2 className="font-display text-xl sm:text-2xl font-black bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            Análisis de Conceptos Clave
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
        {didacticTopics.map((topic) => {
          const Icon = topic.icon;
          const isExpanded = expandedTopic === topic.id;
          
          return (
            <motion.div
              key={topic.id}
              layout
              className={`rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
                isExpanded 
                  ? `${topic.borderColor} ${topic.bgColor} ${topic.aiGlow}` 
                  : ''
              }`}
              style={!isExpanded ? {
                borderColor: isLight ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.10)',
                backgroundColor: isLight ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.05)'
              } : undefined}
              onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
              whileHover={{ scale: isExpanded ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-5">
                <div className="flex items-start gap-4 mb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${topic.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1 pt-1">
                    <h4 className="font-display font-bold text-base leading-tight mb-1 break-words" style={{ color: headingColor }}>
                      {topic.title}
                    </h4>
                    <p className="text-xs leading-snug break-words" style={{ color: mutedColor }}>
                      {topic.shortDesc}
                    </p>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.3, ease: "backOut" }}
                    className="pt-2"
                  >
                    <ChevronRight className="w-5 h-5" style={{ color: isExpanded ? colors.primary : mutedColor }} />
                  </motion.div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t" style={{ borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.10)', backgroundColor: isLight ? 'rgba(255,248,235,0.52)' : 'rgba(0,0,0,0.20)' }}>
                      <div className="pt-5 flex flex-col sm:flex-row gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <DagonMascot size="small" mood="excited" />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Control estricto de desbordamiento en el párrafo */}
                          <p className="text-sm leading-relaxed mb-4 break-words" style={{ color: headingColor }}>
                            {topic.fullExplanation}
                          </p>
                          
                          {/* Caja de código con estilo terminal y control de desbordamiento */}
                          <div className="border rounded-xl p-4 mb-4 w-full shadow-inner relative group" style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.78)' : '#0D1117', borderColor: isLight ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)' }}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <code className="block font-mono text-xs whitespace-pre-wrap break-words leading-relaxed" style={{ color: isLight ? '#b45309' : '#6ee7b7' }}>
                              {topic.example}
                            </code>
                          </div>

                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onExplore) onExplore(topic.id);
                            }}
                            size="sm"
                            className="w-full text-xs border transition-all"
                            style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.62)' : 'rgba(255,255,255,0.10)', color: headingColor, borderColor: isLight ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.05)' }}
                          >
                            Profundizar en este tema
                            <ChevronRight className="w-3 h-3 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
      
      <div className="mt-6 text-center relative z-10">
        <p className="text-xs flex items-center justify-center gap-2" style={{ color: mutedColor }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.primary }} />
          Haz clic en cualquier panel para inicializar el módulo de aprendizaje
        </p>
      </div>
    </motion.div>
  );
};
