import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Code, Zap, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { DagonMascot } from './DagonMascot';

const didacticTopics = [
  {
    id: 'sql-basics',
    icon: Code,
    title: 'SQL: Tu Voz en la Base de Datos',
    shortDesc: 'El lenguaje universal para comunicarte con datos',
    fullExplanation: 'SQL (Structured Query Language) es como dar instrucciones en español a una biblioteca mágica. Con SELECT pides información, con INSERT agregas nuevos libros, y con UPDATE modificas existentes. Es el estándar global usado por todas las empresas.',
    example: 'SELECT nombre, nivel FROM aventureros WHERE clase = \'Guerrero\';',
    color: 'from-blue-600 to-cyan-700',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/5'
  },
  {
    id: 'postgres-why',
    icon: Database,
    title: '¿Por qué PostgreSQL?',
    shortDesc: 'El motor más robusto, confiable y gratuito del mundo',
    fullExplanation: 'PostgreSQL es el motor de base de datos open-source más avanzado. Lo usan empresas como Uber, Netflix, Instagram y Apple. Soporta JSON, procesamiento geoespacial, y es increíblemente estable. ¡Es la mejor opción para aprender SQL real!',
    example: '-- Conectando a PostgreSQL\npsql -h localhost -U usuario -d dagon_db',
    color: 'from-green-600 to-emerald-700',
    borderColor: 'border-green-500/30',
    bgColor: 'bg-green-500/5'
  },
  {
    id: 'dagon-mission',
    icon: Zap,
    title: 'Nuestra Misión con Dagon',
    shortDesc: 'Revolucionar el aprendizaje de SQL gamificándolo',
    fullExplanation: 'Dagon nació porque creemos que aprender SQL no debe ser aburrido. Nuestra misión es que domines bases de datos jugando, sin clases magistrales aburridas. Queremos que cada consulta SQL se sienta como una victoria en tu aventura por el Abismo de los Datos.',
    example: '¡Compite, gana XP, sube de nivel y diviértete!',
    color: 'from-fuchsia-600 to-purple-700',
    borderColor: 'border-fuchsia-500/30',
    bgColor: 'bg-fuchsia-500/5'
  }
];

export const DidacticCard = ({ onExplore }) => {
  const [expandedTopic, setExpandedTopic] = useState(null);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="glass-card-apple rounded-3xl p-6 lg:p-8 border border-white/10 mb-8 relative overflow-hidden"
    >
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-cyan-300" />
        </div>
        <div>
          <p className="text-cyan-300 text-xs font-bold tracking-[0.4em] uppercase">Aprende</p>
          <h2 className="font-display text-2xl font-black text-white">Conceptos Clave</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {didacticTopics.map((topic, index) => {
          const Icon = topic.icon;
          const isExpanded = expandedTopic === topic.id;
          
          return (
            <motion.div
              key={topic.id}
              layout
              className={`rounded-2xl border transition-all cursor-pointer ${
                isExpanded 
                  ? `${topic.borderColor} ${topic.bgColor}` 
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
              onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-black text-white text-sm leading-tight">
                      {topic.title}
                    </h4>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </motion.div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {topic.shortDesc}
                </p>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 border-t border-white/10">
                      <div className="pt-4 flex gap-4">
                        <div className="flex-shrink-0">
                          <DagonMascot size="small" mood="happy" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-300 leading-relaxed mb-3">
                            {topic.fullExplanation}
                          </p>
                          <div className="bg-black/30 rounded-xl p-3 font-mono text-xs text-green-300 mb-3 overflow-x-auto">
                            <pre>{topic.example}</pre>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onExplore) onExplore(topic.id);
                            }}
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white text-xs"
                          >
                            Explorar más
                            <ChevronRight className="w-3 h-3 ml-1" />
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
      
      <div className="mt-4 text-center relative z-10">
        <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-yellow-300" />
          Haz clic en cada tarjeta para aprender más detalles
        </p>
      </div>
    </motion.div>
  );
};
