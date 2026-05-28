import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Volume2,
  VolumeX
} from 'lucide-react';

import { Button } from '../ui/button';
import { sounds } from '../../lib/SoundEngine';
import { buildBookPagesFromCommand } from '../../data/postgresAcademyContent';
import { BookPage } from './BookPage';

export const AcademyBook = ({
  tierKey,
  command,
  pageIndex,
  setPageIndex,
  onNextCommand,
  onPrevCommand,
  colors,
  isLight,
  panelStyle,
  codeStyle,
  isNarrating = false,
  onNarrationStart,
  onNarrationStop
}) => {
  const [direction, setDirection] = useState(1);
  const isNarratingRef = useRef(isNarrating);
  const onNarrationStopRef = useRef(onNarrationStop);

  const [singlePageMode, setSinglePageMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(max-width: 1024px)').matches ?? false;
  });

  useEffect(() => {
    const query = window.matchMedia?.('(max-width: 1024px)');
    if (!query) return undefined;
    const syncMode = () => setSinglePageMode(query.matches);
    syncMode();
    query.addEventListener?.('change', syncMode);
    query.addListener?.(syncMode);
    return () => {
      query.removeEventListener?.('change', syncMode);
      query.removeListener?.(syncMode);
    };
  }, []);

  const pages = useMemo(() => {
    return buildBookPagesFromCommand(command);
  }, [command]);

  const pageStep = singlePageMode ? 1 : 2;
  const leftPage = pages[pageIndex] || pages[0];
  const rightPage = singlePageMode ? null : pages[pageIndex + 1] || null;

  const currentSpread = singlePageMode ? pageIndex + 1 : Math.floor(pageIndex / 2) + 1;
  const totalSpreads = singlePageMode ? Math.max(1, pages.length) : Math.max(1, Math.ceil(pages.length / 2));

  const canGoPreviousPage = pageIndex > 0;
  const canGoNextPage = pageIndex + pageStep < pages.length;

  const narration = [leftPage?.narration, rightPage?.narration]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    isNarratingRef.current = isNarrating;
    onNarrationStopRef.current = onNarrationStop;
  }, [isNarrating, onNarrationStop]);

  useEffect(() => {
    if (pageIndex >= pages.length) {
      setPageIndex(Math.max(0, pages.length - 1));
    }
  }, [pageIndex, pages.length, setPageIndex]);

  useEffect(() => {
    sounds.stopSpeech();
    if (isNarratingRef.current) {
      onNarrationStopRef.current?.();
    }
  }, [tierKey, command?.name, pageIndex]);

  const goPrevious = () => {
    setDirection(-1);
    sounds.playClick();

    if (canGoPreviousPage) {
      setPageIndex(Math.max(0, pageIndex - pageStep));
      return;
    }

    onPrevCommand?.();
  };

  const goNext = () => {
    setDirection(1);
    sounds.playClick();

    if (canGoNextPage) {
      setPageIndex(pageIndex + pageStep);
      return;
    }

    onNextCommand?.();
  };

  const speakCurrentSpread = () => {
    if (!narration) return;

    if (!sounds.isEnabled()) {
      sounds.setEnabled(true, { restart: false });
      sounds.init();
    }

    onNarrationStart?.();
    sounds.speakTTS(narration);
  };

  const stopCurrentSpread = () => {
    sounds.stopSpeech();
    onNarrationStop?.();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="rounded-[28px] border p-4 sm:p-5 dagon-compact-card book-shell"
      style={panelStyle}
    >
      <div className="book-toolbar">
        <div className="book-toolbar-title">
          <div
            className="book-toolbar-icon"
            style={{
              borderColor: `${colors.primary}33`,
              background: `linear-gradient(135deg, ${colors.primary}22, ${colors.secondary}16)`
            }}
          >
            <BookOpen className="h-5 w-5" style={{ color: colors.primary }} />
          </div>

          <div>
            <p style={{ color: colors.accent }}>
              {command?.name}
            </p>

            <h3 style={{ color: colors.text }}>
              Libro de comandos
            </h3>
          </div>
        </div>

        <div className="book-toolbar-actions">
          <Button
            onClick={isNarrating ? stopCurrentSpread : speakCurrentSpread}
            variant="ghost"
            className="rounded-2xl"
            style={{ color: colors.textMuted }}
          >
            {!isNarrating ? (
              <Volume2 className="mr-2 h-4 w-4" />
            ) : (
              <VolumeX className="mr-2 h-4 w-4" />
            )}

            {!isNarrating ? 'Narrar páginas' : 'Silenciar páginas'}
          </Button>
        </div>
      </div>

      <div className="book-progress-row">


        <div className="book-progress-track">
          <div
            className="book-progress-fill"
            style={{
              width: `${(currentSpread / totalSpreads) * 100}%`,
              background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
            }}
          />
        </div>
      </div>

      <div className="book-spread-wrap">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${tierKey}-${command?.name}-${pageIndex}`}
            custom={direction}
            initial={{
              opacity: 0,
              rotateY: direction > 0 ? -9 : 9,
              x: direction > 0 ? 28 : -28
            }}
            animate={{
              opacity: 1,
              rotateY: 0,
              x: 0
            }}
            exit={{
              opacity: 0,
              rotateY: direction > 0 ? 9 : -9,
              x: direction > 0 ? -28 : 28
            }}
            transition={{
              duration: 0.36,
              ease: 'easeInOut'
            }}
            className={`book-spread ${singlePageMode ? 'book-spread--single' : ''}`}
            style={{
              '--book-page-bg': isLight
                ? 'linear-gradient(145deg, rgba(255,251,244,0.98), rgba(255,244,226,0.94))'
                : 'linear-gradient(145deg, rgba(15,23,42,0.98), rgba(2,6,23,0.96))',
              '--book-page-text': colors.text,
              '--book-page-muted': colors.textMuted,
              '--book-accent': colors.primary,
              '--book-border': colors.border
            }}
          >
            <BookPage
              page={leftPage}
              pageNumber={pageIndex + 1}
              side="left"
              colors={colors}
              isLight={isLight}
              codeStyle={codeStyle}
            />

            {!singlePageMode && (
              <BookPage
                page={rightPage}
                pageNumber={pageIndex + 2}
                side="right"
                colors={colors}
                isLight={isLight}
                codeStyle={codeStyle}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="book-nav">
        <Button
          onClick={goPrevious}
          className="rounded-2xl border"
          style={{
            backgroundColor: isLight
              ? 'rgba(255,255,255,0.72)'
              : colors.surface,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {singlePageMode ? 'Página anterior' : 'Hoja anterior'}
        </Button>

        <Button
          onClick={goNext}
          className="rounded-2xl text-white"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          }}
        >
          {singlePageMode ? 'Siguiente página' : 'Siguiente hoja'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.section>
  );
};
