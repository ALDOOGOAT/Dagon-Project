import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Calculator, BookOpen, Film, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import apiClient, { cachedGet } from '../services/apiClient';
import { RewardAnimation } from '../components/RewardAnimation';
import { DagonMascot } from '../components/DagonMascot';
import { useClawbotSupport } from '../hooks/useClawbotSupport';
import { registrarIntentoIo } from '../services/ioProgress';
import { getIoTheory } from '../data/ioTheory';
import { getIoCinematica } from '../data/ioCinematics';
import { Formula } from '../components/io/Formula';
import { Boton, Panel, ErrorIO, Etiqueta } from '../components/io/ui';
const IoCalculadora = lazy(() => import('../components/io/IoCalculadora').then(m => ({
  default: m.IoCalculadora
})));
const ModuleCinematic = lazy(() => import('../components/ModuleCinematic').then(m => ({
  default: m.ModuleCinematic
})));
export const IoMisionPage = () => {
  const {
    moduloId
  } = useParams();
  const navigate = useNavigate();
  const {
    user,
    updateUserXP,
    updateUserStreak
  } = useAuth();
  const {
    setMateria
  } = useTheme();
  const [data, setData] = useState(null),
    [error, setError] = useState(null),
    [cargando, setCargando] = useState(true),
    [indice, setIndice] = useState(0),
    [respuestas, setRespuestas] = useState({}),
    [resultado, setResultado] = useState(null),
    [enviando, setEnviando] = useState(false),
    [teoria, setTeoria] = useState(true),
    [cinematicaVisible, setCinematicaVisible] = useState(true),
    [calculadora, setCalculadora] = useState(false),
    [premio, setPremio] = useState(null);
  const exercises = data?.exercises || [];
  const ejercicio = exercises[indice];
  const {
    clawbotThinking,
    clawbotMessage,
    setClawbotMessage,
    invokeClawbot
  } = useClawbotSupport(exercises, indice);
  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    setData(null);
    setIndice(0);
    setTeoria(true);
    setCinematicaVisible(true);
    setRespuestas({});
    setResultado(null);
    cachedGet('/api/exercises/' + moduloId).then(r => {
      if (activo) {
        setData(r.data);
        if (r.data.module?.materia_slug !== 'io' || !(r.data.exercises || []).every(e => e.type === 'numerico')) setError('Este módulo pertenece a SQL. Abre su misión desde el mapa de SQL.');else setMateria('io');
      }
    }).catch(() => {
      if (activo) setError('No se pudo cargar el módulo. Intenta de nuevo desde el mapa.');
    }).finally(() => {
      if (activo) setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [moduloId, setMateria]);
  const contenido = getIoTheory(data?.module?.nombre_curso || data?.module?.curso_slug, data?.module?.orden);
  const cinematica = getIoCinematica(data?.module?.nombre_curso || data?.module?.curso_slug, data?.module?.orden);
  const validar = async e => {
    e.preventDefault();
    if (enviando || resultado?.success) return;
    setEnviando(true);
    setResultado(null);
    setError(null);
    setClawbotMessage(null);
    try {
      const {
        data: r
      } = await apiClient.post('/api/exercises/' + ejercicio.id + '/validate', {
        query: JSON.stringify(respuestas)
      });
      setResultado(r);
      registrarIntentoIo(user?.idUsuario || 'local', moduloId, ejercicio, r);
      if (r.success) {
        const xp = Number(r.xp_gained) || 0;
        if (xp > 0) {
          updateUserXP((Number(user?.xp) || 0) + xp);
          setPremio(xp);
        }
        if (r.streak_activated_today) {
          updateUserStreak(r.new_streak);
          window.dispatchEvent(new CustomEvent('dagon_streak_activated', {
            detail: r.new_streak
          }));
        }
      } else invokeClawbot({
        materia: 'io',
        ejercicioId: ejercicio.id,
        nivelId: Number(moduloId),
        descripcion: ejercicio.description,
        queryAlumno: JSON.stringify(respuestas),
        errorDb: r.message || 'Revisa el procedimiento y los campos marcados.'
      });
    } catch (err) {
      setResultado({
        success: false,
        message: err.response?.data?.message || 'No se pudo validar. Tus respuestas siguen aquí.'
      });
    } finally {
      setEnviando(false);
    }
  };
  const siguiente = () => {
    if (indice === exercises.length - 1) navigate('/graduation/' + moduloId);else {
      setIndice(i => i + 1);
      setRespuestas({});
      setResultado(null);
      setClawbotMessage(null);
    }
  };
  return <main className="dagon-page-shell dagon-page-shell--wide">
  <div className="flex flex-wrap justify-between gap-3">
    <Boton variante="suave" icono={ArrowLeft} onClick={() => navigate('/dashboard')}>Volver al mapa</Boton>
    <Boton variante="suave" icono={Calculator} onClick={() => setCalculadora(v => !v)}>{calculadora ? 'Cerrar' : 'Abrir'} calculadora</Boton>
  </div>
  {cargando ? <p className="py-12" role="status">Cargando misión…</p> : <>
    <header className="my-6">
      <h1 className="text-3xl font-display font-black">
        {data?.module?.titulo || 'Misión de operaciones'}
      </h1>
      <p className="mt-2 opacity-75">
        {data?.module?.descripcion}
      </p>
    </header>
    <ErrorIO mensaje={error} />
    {!error && cinematica && cinematicaVisible && teoria && <Suspense fallback={<p role="status">Cargando cinemática…</p>}>
      <ModuleCinematic moduleId={moduloId} cinematica={cinematica} onComplete={() => setCinematicaVisible(false)} />
    </Suspense>}
    {!error && !(cinematica && cinematicaVisible && teoria) && <div className="grid min-w-0 gap-5">
      <div className="min-w-0">
        {teoria ? <Panel titulo={contenido?.titulo || 'Antes de comenzar'} icono={BookOpen}>
          <p className="mb-4">Lee el modelo, identifica sus supuestos y explica cada paso antes de calcular.</p>
          {contenido?.objetivos?.length > 0 && <>
            <h3 className="font-bold">Objetivos</h3>
            <ul className="my-3 list-disc pl-5">
              {contenido.objetivos.map((s, i) => <li key={i}>
                {s}
              </li>)}
            </ul>
          </>}
          {contenido?.contenido?.map((s, i) => <p className="my-3 leading-relaxed" key={i}>
            {typeof s === 'string' ? s : s.texto}
          </p>)}
          {contenido?.formulas?.map((f, i) => <Formula key={i} latex={typeof f === 'string' ? f : f.latex} bloque />)}
          {contenido?.erroresComunes?.length > 0 && <>
            <h3 className="font-bold">Errores comunes</h3>
            <ul className="my-3 list-disc pl-5">
              {contenido.erroresComunes.map((s, i) => <li key={i}>
                {s}
              </li>)}
            </ul>
          </>}
          <div className="flex flex-wrap gap-2">
            <Boton onClick={() => setTeoria(false)} disabled={!exercises.length}>Empezar misiones</Boton>
            {cinematica && <Boton variante="suave" icono={Film} onClick={() => setCinematicaVisible(true)}>Ver cinemática</Boton>}
          </div>
          {!exercises.length && <p className="mt-3">Este módulo todavía no tiene misiones disponibles.</p>}
        </Panel> : ejercicio && <Panel titulo={'Misión ' + (indice + 1) + ' de ' + exercises.length}>
          <h2 className="mb-3 font-display text-xl font-bold">
            {ejercicio.title}
          </h2>
          <p className="mb-5 whitespace-pre-wrap leading-relaxed">
            {ejercicio.description}
          </p>
          <form onSubmit={validar}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(ejercicio.campos || []).map(c => {
                  const estado = resultado?.campos?.[c.clave];
                  return <div key={c.clave}>
                <Etiqueta htmlFor={'respuesta-' + c.clave}>
                  {c.etiqueta}
                  {c.unidad ? ' (' + c.unidad + ')' : ''}
                </Etiqueta>
                {c.tipo === 'opcion' ? <select id={'respuesta-' + c.clave} required disabled={resultado?.success} className="io-input" value={respuestas[c.clave] || ''} onChange={e => setRespuestas(v => ({
                      ...v,
                      [c.clave]: e.target.value
                    }))}>
                  <option value="">Selecciona…</option>
                  {(c.opciones || []).map(o => {
                        const value = typeof o === 'object' ? o.valor : o;
                        return <option key={value} value={value}>
                    {typeof o === 'object' ? o.etiqueta || value : o}
                  </option>;
                      })}
                </select> : <input id={'respuesta-' + c.clave} required disabled={resultado?.success} className="io-input" inputMode="decimal" placeholder="Número, decimal o fracción" value={respuestas[c.clave] || ''} onChange={e => setRespuestas(v => ({
                      ...v,
                      [c.clave]: e.target.value
                    }))} />}
                {estado !== undefined && <p role="status" className="mt-1 text-sm" style={{
                      color: estado ? '#6ee7b7' : '#fca5a5'
                    }}>
                  {estado ? 'Correcto' : 'Revisa este campo'}
                </p>}
              </div>;
                })}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="submit" className="io-btn io-btn--primario" disabled={enviando || resultado?.success || !ejercicio.campos?.length}>
                <Send className="h-4 w-4" />
                {enviando ? 'Validando…' : 'Validar respuesta'}
              </button>
              <Boton variante="suave" onClick={() => setTeoria(true)}>Revisar teoría</Boton>
              {resultado?.success && <Boton icono={CheckCircle2} onClick={siguiente}>
                {indice === exercises.length - 1 ? 'Completar módulo' : 'Siguiente misión'}
              </Boton>}
            </div>
          </form>
          {resultado && <p className="my-4" role="status">
            {resultado.message}
          </p>}
          {ejercicio.hint && <details className="my-4">
            <summary>Pista</summary>
            <p className="mt-2">
              {ejercicio.hint}
            </p>
          </details>}
          {(clawbotThinking || clawbotMessage) && <aside className="mt-5 rounded-xl border p-4">
            <DagonMascot size="small" mood="thinking" />
            <h3 className="font-bold">Tutor de Investigación de Operaciones</h3>
            <p className="mt-2 whitespace-pre-wrap">
              {clawbotThinking ? 'Preparando una pista…' : clawbotMessage}
            </p>
          </aside>}
        </Panel>}
      </div>
      {calculadora && <Panel titulo="Laboratorio de apoyo">
        <Suspense fallback={<p role="status">Cargando herramientas…</p>}>
          <IoCalculadora />
        </Suspense>
      </Panel>}
    </div>}
  </>}
  {premio !== null && <RewardAnimation xpGained={premio} onComplete={() => setPremio(null)} />}
</main>;
};
