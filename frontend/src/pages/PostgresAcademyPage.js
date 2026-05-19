import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  Sparkles,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { DagonMascot } from '../components/DagonMascot';
import { AcademyBook } from '../components/postgres/AcademyBook';
import { BookToc } from '../components/postgres/BookToc';
import { useTheme } from '../contexts/ThemeContext';
import { sounds } from '../lib/SoundEngine';
import {
  CHAPTERS,
  COMMAND_TIERS,
  USE_CASES,
  getTierKeys
} from '../data/postgresAcademyContent';

export const PostgresAcademyPage = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const [chapterIndex, setChapterIndex] = useState(0);
  const [tierKey, setTierKey] = useState('basico');
  const [commandIndex, setCommandIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [activeNarration, setActiveNarration] = useState(null);

  const chapter = CHAPTERS[chapterIndex] || CHAPTERS[0];
  const tier = COMMAND_TIERS[tierKey] || COMMAND_TIERS.basico;
  const command = tier.commands[commandIndex] || tier.commands[0];
  const ChapterIcon = chapter.icon;

  const panelStyle = useMemo(() => ({
    borderColor: colors.border,
    backgroundColor: isLight ? 'rgba(255, 250, 240, 0.84)' : 'rgba(15, 23, 42, 0.72)',
    color: colors.text,
    boxShadow: isLight
      ? `0 30px 90px -48px ${colors.primary}66`
      : '0 28px 80px -44px rgba(0,0,0,0.72)'
  }), [colors, isLight]);

  const softPanelStyle = useMemo(() => ({
    borderColor: isLight ? `${colors.primary}24` : 'rgba(255,255,255,0.08)',
    backgroundColor: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(2,6,23,0.42)'
  }), [colors, isLight]);

  const codeStyle = useMemo(() => ({
    borderColor: isLight ? `${colors.primary}33` : 'rgba(34,211,238,0.18)',
    backgroundColor: isLight ? '#2a2118' : '#020617',
    color: isLight ? '#ffe8bd' : '#a7f3d0'
  }), [colors, isLight]);

  useEffect(() => {
    sounds.init();
    return () => {
      sounds.stopSpeech();
    };
  }, []);

  useEffect(() => {
    const syncSoundState = (event) => {
      const enabled = event?.detail?.enabled ?? sounds.isEnabled();
      if (!enabled) {
        setActiveNarration(null);
        sounds.stopSpeech();
      }
    };

    window.addEventListener('dagon:soundchange', syncSoundState);
    syncSoundState();
    return () => window.removeEventListener('dagon:soundchange', syncSoundState);
  }, []);

  useEffect(() => {
    setCommandIndex(0);
    setPageIndex(0);
  }, [tierKey]);

  useEffect(() => {
    setPageIndex(0);
  }, [commandIndex]);

  useEffect(() => {
    if (activeNarration === 'chapter' && chapter?.narration) {
      sounds.speakTTS(chapter.narration);
    }
  }, [activeNarration, chapter]);

  const speak = () => {
    if (!chapter?.narration) return;
    if (!sounds.isEnabled()) {
      sounds.setEnabled(true, { restart: false });
      sounds.init();
    }
    setActiveNarration('chapter');
  };

  const stopVoice = () => {
    sounds.stopSpeech();
    setActiveNarration(null);
  };

  const goToChapter = (nextIndex) => {
    const normalized = (nextIndex + CHAPTERS.length) % CHAPTERS.length;
    setChapterIndex(normalized);
    sounds.stopSpeech();
    sounds.playStep();
  };

  const goToCommand = (nextIndex) => {
    const normalized = (nextIndex + tier.commands.length) % tier.commands.length;
    setCommandIndex(normalized);
    setPageIndex(0);
    sounds.playClick();
  };

  const selectTier = (nextTierKey) => {
    setTierKey(nextTierKey);
    sounds.playClick();
  };

  const startBookNarration = useCallback(() => {
    setActiveNarration('book');
  }, []);

  const stopNarration = useCallback(() => {
    setActiveNarration(null);
  }, []);

  return (
    <div className="min-h-screen" data-testid="postgres-academy-page">
      <div className="dagon-page-shell dagon-page-shell--wide">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="self-start"
            style={{ color: colors.textMuted }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {getTierKeys().map((key) => {
              const item = COMMAND_TIERS[key];
              const ItemIcon = item.icon;
              const active = key === tierKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectTier(key)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-display font-black transition-all"
                  style={{
                    borderColor: active ? colors.primary : colors.border,
                    color: active ? (isLight ? '#fffaf0' : '#ffffff') : colors.text,
                    background: active
                      ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                      : (isLight ? 'rgba(255,255,255,0.72)' : 'rgba(15,23,42,0.72)'),
                    boxShadow: active ? `0 18px 44px -28px ${colors.primary}` : undefined
                  }}
                >
                  <ItemIcon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[32px] border p-5 sm:p-7 lg:p-10 dagon-compact-card"
          style={panelStyle}
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary}, ${colors.accent})` }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-70"
            style={{
              background: isLight
                ? `linear-gradient(135deg, rgba(255,255,255,0.72), ${colors.surfaceAlt}55, transparent)`
                : `linear-gradient(135deg, ${colors.primary}16, transparent 48%, ${colors.secondary}12)`
            }}
          />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[0.82fr_1.18fr] xl:items-center">
            <div className="space-y-6">
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.28em]"
                style={{
                  color: colors.primary,
                  borderColor: `${colors.primary}33`,
                  backgroundColor: isLight ? 'rgba(255,255,255,0.74)' : 'rgba(255,255,255,0.05)'
                }}
              >
                <Database className="h-4 w-4" />
                Academia PostgreSQL
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 18 }}
                  transition={{ duration: 0.28 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border"
                      style={{
                        borderColor: `${colors.primary}33`,
                        background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}16)`
                      }}
                    >
                      <ChapterIcon className="h-7 w-7" style={{ color: colors.primary }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: colors.textMuted }}>
                        {chapter.accent}
                      </p>
                      <h1 className="mt-2 font-display text-3xl font-black leading-tight sm:text-4xl lg:text-5xl" style={{ color: colors.text }}>
                        {chapter.title}
                      </h1>
                    </div>
                  </div>

                  <p className="max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: colors.textMuted }}>
                    {chapter.narration}
                  </p>

                  <div className="grid gap-3">
                    {chapter.bullets.map((item) => (
                      <div key={item} className="flex items-start gap-3 rounded-2xl border p-3" style={softPanelStyle}>
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: colors.primary }} />
                        <span className="text-sm leading-relaxed" style={{ color: colors.text }}>
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={() => goToChapter(chapterIndex - 1)}
                  className="rounded-2xl border"
                  style={{ backgroundColor: isLight ? 'rgba(255,255,255,0.74)' : colors.surface, borderColor: colors.border, color: colors.text }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  onClick={() => goToChapter(chapterIndex + 1)}
                  className="rounded-2xl text-white"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                >
                  Siguiente escena
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={activeNarration !== 'chapter' ? speak : stopVoice}
                  variant="ghost"
                  className="rounded-2xl"
                  style={{ color: colors.textMuted }}
                >
                  {activeNarration !== 'chapter' ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4" />}
                  {activeNarration !== 'chapter' ? 'Narrar escena' : 'Silenciar escena'}
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[28px] border p-4 sm:p-5" style={softPanelStyle}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute -inset-4 rounded-full blur-2xl" style={{ backgroundColor: `${colors.primary}22` }} />
                      <div className="relative">
                        <DagonMascot size="medium" mood={chapter.mood} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.26em]" style={{ color: colors.primary }}>
                        Dagon explica
                      </p>
                      <p className="text-sm" style={{ color: colors.textMuted }}>
                        Escena {chapterIndex + 1} de {CHAPTERS.length}
                      </p>
                    </div>
                  </div>
                  <Sparkles className="h-5 w-5" style={{ color: colors.accent }} />
                </div>

                <div className="overflow-hidden rounded-2xl border" style={codeStyle}>
                  <div className="flex items-center gap-2 border-b px-4 py-2" style={{ borderColor: isLight ? 'rgba(255,232,189,0.14)' : 'rgba(255,255,255,0.08)' }}>
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-[10px] font-mono uppercase tracking-[0.22em]" style={{ color: isLight ? '#ffd28e' : '#94a3b8' }}>
                      {chapter.codeLabel}
                    </span>
                  </div>
                  <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
                    <code>{chapter.code}</code>
                  </pre>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {USE_CASES.map((item) => {
                  const ItemIcon = item.icon;

                  return (
                    <div key={item.label} className="rounded-2xl border p-3" style={softPanelStyle}>
                      <ItemIcon className="mb-2 h-5 w-5" style={{ color: colors.primary }} />
                      <p className="text-sm font-display font-black" style={{ color: colors.text }}>{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: colors.textMuted }}>{item.text}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(280px,0.68fr)_minmax(0,1.32fr)]">
          <BookToc
            tier={tier}
            commandIndex={commandIndex}
            onSelectCommand={goToCommand}
            colors={colors}
            isLight={isLight}
            panelStyle={panelStyle}
          />

          <div className="min-w-0">
            <div className="mb-4 rounded-[24px] border p-4" style={softPanelStyle}>
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border"
                  style={{ borderColor: `${colors.primary}33`, background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}16)` }}
                >
                  <BookOpen className="h-5 w-5" style={{ color: colors.primary }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: colors.accent }}>
                    Modo libro interactivo
                  </p>
                  <h2 className="mt-1 font-display text-xl font-black sm:text-2xl" style={{ color: colors.text }}>
                    {command.name}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
                    Lee el comando como capítulo: idea, teoría, analogía, sintaxis, ejemplo y práctica.
                  </p>
                </div>
              </div>
            </div>

            <AcademyBook
              tierKey={tierKey}
              command={command}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              onNextCommand={() => goToCommand(commandIndex + 1)}
              onPrevCommand={() => goToCommand(commandIndex - 1)}
              colors={colors}
              isLight={isLight}
              panelStyle={panelStyle}
              codeStyle={codeStyle}
              isNarrating={activeNarration === 'book'}
              onNarrationStart={startBookNarration}
              onNarrationStop={stopNarration}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
