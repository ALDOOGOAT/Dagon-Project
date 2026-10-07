import { useEffect, useRef, useState } from 'react';
import { FileText, Sparkles, RefreshCw, ArrowRight, SearchCheck, AlertTriangle } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { resolverModeloInterpretado } from '../../lib/io/desdeEnunciado';
import { Boton, Panel, ErrorIO, Etiqueta } from './ui';
import { EditorModelo } from './EditorModelo';
import { ResultadoModelo } from './ResultadoModelo';
export const EJEMPLOS_ENUNCIADO = [{
  nombre: 'Producción óptima',
  texto: 'Una fábrica produce mesas y sillas. Cada mesa aporta una ganancia de 3 euros y cada silla de 5 euros. Se pueden fabricar como máximo 4 mesas y 6 sillas. Cada mesa consume 3 horas de acabado y cada silla 2 horas; hay 18 horas de acabado disponibles. ¿Cuántas mesas y sillas debe producir para maximizar la ganancia? Las cantidades son continuas y no negativas.'
}, {
  nombre: 'Lote económico',
  texto: 'La demanda anual es de 1200 unidades, el costo por pedido es de 50 pesos y el costo de mantener una unidad al año es de 2 pesos. Calcular el lote económico.'
}, {
  nombre: 'Línea de espera',
  texto: 'Llegan 10 clientes por hora y se atienden 15 clientes por hora en un servidor.'
}];
export const TabEnunciado = ({
  onManual
}) => {
  const [texto, setTexto] = useState(''),
    [interpretacion, setInterpretacion] = useState(null),
    [modelo, setModelo] = useState(null),
    [solucion, setSolucion] = useState(null),
    [error, setError] = useState(null),
    [ocupado, setOcupado] = useState(false),
    [cambiado, setCambiado] = useState(false);
  const solicitud = useRef(0),
    controller = useRef(null),
    enunciadoRef = useRef(null),
    modeloRef = useRef(null),
    resultadosRef = useRef(null);
  useEffect(() => () => {
    solicitud.current++;
    controller.current?.abort();
  }, []);
  const cambiarTexto = valor => {
    solicitud.current++;
    controller.current?.abort();
    setTexto(valor);
    setInterpretacion(null);
    setModelo(null);
    setSolucion(null);
    setError(null);
    setOcupado(false);
    setCambiado(false);
  };
  const cancelarAnalisis = () => {
    solicitud.current++;
    controller.current?.abort();
    setOcupado(false);
  };
  const irA = referencia => {
    referencia.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    referencia.current?.focus({ preventScroll: true });
  };
  const analizar = async e => {
    e.preventDefault();
    if (ocupado) return;
    const enunciado = texto.trim();
    if (enunciado.length < 20) {
      setError('Describe el problema con al menos 20 caracteres.');
      return;
    }
    const id = ++solicitud.current;
    controller.current?.abort();
    const peticion = new AbortController();
    controller.current = peticion;
    setOcupado(true);
    setError(null);
    setModelo(null);
    setSolucion(null);
    setInterpretacion(null);
    setCambiado(false);
    try {
      const {
        data
      } = await apiClient.post('/api/io/interpretar', {
        enunciado
      }, {
        signal: peticion.signal,
        timeout: 60000
      });
      if (id !== solicitud.current) return;
      if (!data || !['listo', 'incompleto', 'no_soportado'].includes(data.estado)) throw new Error('El servicio no devolvió un modelo válido. Intenta con una descripción más precisa.');
      setInterpretacion(data);
      if (data.estado === 'listo') {
        if (!data.modelo) throw new Error('La interpretación no contiene un modelo.');
        setModelo(data.modelo);
        setSolucion(resolverModeloInterpretado(data.modelo));
      }
    } catch (err) {
      if (id !== solicitud.current || peticion.signal.aborted) return;
      setError(err.response?.data?.message || (err.isAxiosError || err.message === 'Network Error' ? 'No se pudo conectar con el servicio de interpretación. Intenta de nuevo o usa un método manual.' : err.message) || 'No se pudo interpretar el enunciado. Usa un método manual o intenta de nuevo.');
    } finally {
      if (id === solicitud.current) setOcupado(false);
    }
  };
  const editarModelo = nuevo => {
    setModelo(nuevo);
    setSolucion(null);
    setError(null);
    setCambiado(true);
  };
  const recalcular = () => {
    setSolucion(null);
    setError(null);
    try {
      setSolucion(resolverModeloInterpretado(modelo));
      setCambiado(false);
    } catch (err) {
      setError(err.message || 'Revisa los datos del modelo.');
    }
  };
  const lista = (titulo, items) => items?.length > 0 && <div className="io-revision-bloque">
  <h4>
    {titulo}
  </h4>
  <ul className="io-revision-lista">
    {items.map((t, i) => <li key={i}>
      {t}
    </li>)}
  </ul>
</div>;
  return <div className="space-y-5 io-enunciado">
  <nav className="io-flujo" aria-label="Pasos del laboratorio">
    <button type="button" className="is-activo" onClick={() => irA(enunciadoRef)}>1 · Planteamiento</button>
    <ArrowRight className="h-4 w-4" />
    <button type="button" disabled={!modelo} className={modelo ? 'is-activo' : ''} onClick={() => irA(modeloRef)}>2 · Modelo</button>
    <ArrowRight className="h-4 w-4" />
    <button type="button" disabled={!solucion} className={solucion ? 'is-activo' : ''} onClick={() => irA(resultadosRef)}>3 · Solución</button>
  </nav>
  <Panel titulo="Describe tu problema" icono={FileText}>
    <p className="mb-4 max-w-3xl text-sm leading-relaxed opacity-80">Pega el enunciado tal como lo recibiste. Incluye cantidades, restricciones y unidades: el laboratorio organizará los datos y calculará el procedimiento.</p>
    <form onSubmit={analizar}>
      <Etiqueta htmlFor="io-enunciado">Enunciado completo</Etiqueta>
      <textarea ref={enunciadoRef} id="io-enunciado" className="io-input io-enunciado-area" rows={7} maxLength={12000} value={texto} onChange={e => cambiarTexto(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.nativeEvent.isComposing) {
          e.preventDefault();
          e.currentTarget.form.requestSubmit();
        }
      }} placeholder="Una empresa produce dos artículos… ¿qué decisión permite maximizar la utilidad con los recursos disponibles?" />
      <div className="io-enunciado-acciones">
        <span className="text-xs opacity-65">{texto.length.toLocaleString('es-MX')} / 12 000 caracteres <span className="hidden sm:inline">· Ctrl / ⌘ + Enter para analizar</span></span>
        {ocupado && <Boton variante="suave" onClick={cancelarAnalisis}>Cancelar análisis</Boton>}
        <button type="submit" disabled={ocupado || !texto.trim()} className="io-btn io-btn--primario">
          <Sparkles className="h-4 w-4" />
          {ocupado ? 'Analizando el problema…' : 'Analizar y resolver'}
        </button>
      </div>
    </form>
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider opacity-65">Probar con</span>
      {EJEMPLOS_ENUNCIADO.map(e => <Boton key={e.nombre} variante="suave" onClick={() => cambiarTexto(e.texto)}>
        {e.nombre}
      </Boton>)}
    </div>
  </Panel>
  {solucion && <div className="io-resolucion-lista" role="status">
    <p>El cálculo está listo. Puedes revisar el modelo o ir directamente al resultado.</p>
    <div className="flex flex-wrap gap-2">
      <Boton variante="suave" onClick={() => irA(modeloRef)}>Revisar modelo</Boton>
      <Boton icono={ArrowRight} onClick={() => irA(resultadosRef)}>Ver solución</Boton>
    </div>
  </div>}
  {ocupado && <p className="io-estado" role="status">Identificando variables, recursos y restricciones… Puedes editar el enunciado para cancelar este análisis.</p>}
  <ErrorIO mensaje={error} />
  {error && <div className="flex flex-wrap items-center gap-3">
    <p className="text-sm opacity-80">También puedes introducir los datos directamente en los métodos del laboratorio.</p>
    <Boton variante="suave" onClick={() => onManual?.('pl')}>Abrir métodos manuales</Boton>
  </div>}
  {interpretacion && <Panel titulo={interpretacion.estado === 'listo' ? 'Datos detectados' : 'El modelo necesita más información'} icono={interpretacion.estado === 'listo' ? SearchCheck : AlertTriangle}>
    <p className="mb-4 leading-relaxed">
      {interpretacion.resumen}
    </p>
    {lista('Preguntas para completar el modelo', interpretacion.preguntas)}
    {lista('Supuestos del modelo', interpretacion.supuestos)}
    {lista('Revisa antes de interpretar el resultado', interpretacion.advertencias)}
    {interpretacion.estado !== 'listo' && <p className="mt-4 text-sm">Agrega las respuestas al enunciado de arriba y vuelve a analizar. Los datos faltantes son necesarios para calcular.</p>}
    {interpretacion.modelo?.evidencias?.length > 0 && <details className="io-detalle">
      <summary>Ver de dónde salen los datos</summary>
      <dl className="io-evidencias">
        {interpretacion.modelo.evidencias.map((v, i) => <div key={i}>
          <dt>
            {v.campo}
          </dt>
          <dd>“{v.texto}”</dd>
        </div>)}
      </dl>
    </details>}
  </Panel>}
  {modelo && <div ref={modeloRef} tabIndex={-1} role="region" aria-label="Modelo del problema" className="io-navegable"><Panel titulo="Revisa o ajusta tu modelo" icono={SearchCheck}>
    <EditorModelo modelo={modelo} onChange={editarModelo} />
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <Boton icono={RefreshCw} onClick={recalcular}>Recalcular modelo</Boton>
      {cambiado && <span className="text-sm text-amber-300" role="status">Datos editados. Recalcula para ver una solución actualizada.</span>}
    </div>
  </Panel></div>}
  {solucion && <div ref={resultadosRef} tabIndex={-1} role="region" aria-label="Solución calculada" className="io-navegable">
    <ResultadoModelo solucion={solucion} />
  </div>}
</div>;
};
