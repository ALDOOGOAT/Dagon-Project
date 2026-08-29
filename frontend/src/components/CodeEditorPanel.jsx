import { lazy, Suspense, useRef } from 'react';
import { sounds } from '../lib/SoundEngine';

// Monaco pesa bastante: se carga solo cuando el alumno realmente entra a escribir SQL.
const Editor = lazy(() => import('@monaco-editor/react'));

const EditorFallback = () => (
  <div className="h-full w-full flex items-center justify-center text-sm text-slate-400">
    Cargando editor...
  </div>
);

/**
 * Editor de código SQL del ejercicio (Monaco). Aislado de ExercisePage para que
 * el bundle de Monaco solo se descargue cuando este panel se monta.
 */
export const CodeEditorPanel = ({ value, onChange }) => {
  const lastTypingSoundRef = useRef(0);

  return (
    <div className="exercise-workbench-frame h-[420px] sm:h-[500px] xl:h-[640px] rounded-2xl overflow-hidden border border-white/10">
      <Suspense fallback={<EditorFallback />}>
        <Editor
          height="100%"
          defaultLanguage="sql"
          theme="vs-dark"
          value={value}
          onChange={(next) => {
            onChange(next || '');
            const now = Date.now();
            if (now - lastTypingSoundRef.current > 900) {
              lastTypingSoundRef.current = now;
              sounds.playClockTicking?.();
            }
          }}
          options={{
            minimap: { enabled: false },
            fontSize: 16,
            lineNumbers: 'on',
            padding: { top: 16 },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
          }}
        />
      </Suspense>
    </div>
  );
};
