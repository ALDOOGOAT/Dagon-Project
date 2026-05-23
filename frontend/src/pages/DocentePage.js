import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { DagonSelect } from '../components/ui/dagon-select';
import { EmptyState, LoadingBlock, MetricCard } from '../components/ui/dagon-panel';
import apiClient, { cachedGet, invalidateApiCache } from '../services/apiClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, AlertTriangle, Clock, TrendingDown, Download,
  Search, Eye, X, ChevronDown, ChevronUp, Printer, BarChart3,
  BookOpen, Target, CheckCircle, XCircle, FileText, RefreshCw, Plus,
  KeyRound, UserPlus, Clipboard, Save, Layers, ShieldCheck, HelpCircle,
  GraduationCap, ClipboardCheck, ListChecks, Sparkles, Award, Compass
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const formatMs = (ms) => {
  if (!ms || ms <= 0) return '0 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
};

export const DocentePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const isLight = colors.mode === 'light';
  const headingColor = colors.text;
  const mutedColor = colors.textMuted;
  const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const surfaceColor = isLight ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.5)';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [ordenAlumnos, setOrdenAlumnos] = useState({ campo: 'xp', asc: false });
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [intentos, setIntentos] = useState([]);
  const [cargandoIntentos, setCargandoIntentos] = useState(false);

  // Filtros
  const [filtroCurso, setFiltroCurso] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const [vistaActiva, setVistaActiva] = useState('inicio');
  const [showDocenteTutorial, setShowDocenteTutorial] = useState(() => localStorage.getItem('dagon_docente_tutorial_pending') === 'true');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [alumnosGrupo, setAlumnosGrupo] = useState([]);
  const [emailAlumno, setEmailAlumno] = useState('');
  const [nuevoGrupo, setNuevoGrupo] = useState({ nombreGrupo: '', descripcion: '' });
  const [ejerciciosDocente, setEjerciciosDocente] = useState([]);
  const [calificaciones, setCalificaciones] = useState(null);
  const [calificacionesPage, setCalificacionesPage] = useState({ items: [], page: 0, size: 50, total: 0 });
  const [loadingCalificaciones, setLoadingCalificaciones] = useState(false);
  const [loadingCalificacionesDetalle, setLoadingCalificacionesDetalle] = useState(false);
  const [guardandoGrupo, setGuardandoGrupo] = useState(false);
  const [guardandoAlumno, setGuardandoAlumno] = useState(false);
  const [guardandoEjercicio, setGuardandoEjercicio] = useState(false);
  const [nuevoEjercicio, setNuevoEjercicio] = useState({
    idModulo: '',
    titulo: '',
    enunciado: '',
    queryMaestra: '',
    dificultad: 2,
    formato: 'editor',
    visibilidad: 'GRUPO',
    idGrupo: '',
    tipoMision: 'DOCENTE'
  });

  const cargarDatos = useCallback(async ({ signal, force = false } = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCurso) params.set('idCurso', filtroCurso);
      if (filtroModulo) params.set('idModulo', filtroModulo);
      if (filtroDesde) params.set('desde', filtroDesde);
      if (filtroHasta) params.set('hasta', filtroHasta);

      const query = params.toString();
      let res;
      try {
        res = await cachedGet(`/api/docente/tablero${query ? `?${query}` : ''}`, { signal }, { ttl: 8_000, force });
      } catch (endpointError) {
        if (endpointError.name === 'CanceledError' || endpointError.code === 'ERR_CANCELED') {
          throw endpointError;
        }
        res = await cachedGet(`/api/docente/resumen${query ? `?${query}` : ''}`, { signal }, { ttl: 8_000, force });
      }
      setData(res.data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      if (err.response?.status === 403) {
        toast.error('No tienes permisos para acceder al panel docente');
        navigate('/dashboard');
      } else {
        toast.error('Error al cargar datos del panel docente');
      }
    } finally {
      setLoading(false);
    }
  }, [filtroCurso, filtroModulo, filtroDesde, filtroHasta, navigate]);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      cargarDatos({ signal: controller.signal });
    }, 220);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [token, cargarDatos]);


  const cargarEjerciciosDocente = useCallback(async () => {
    try {
      const res = await cachedGet('/api/docente/ejercicios', {}, { ttl: 8_000 });
      setEjerciciosDocente(res.data || []);
    } catch {
      setEjerciciosDocente([]);
    }
  }, []);

  useEffect(() => {
    if (token) cargarEjerciciosDocente();
  }, [token, cargarEjerciciosDocente]);

  const cargarCalificaciones = useCallback(async ({ page = 0, force = false } = {}) => {
    setLoadingCalificaciones(true);
    setLoadingCalificacionesDetalle(true);
    try {
      const params = new URLSearchParams();
      if (filtroCurso) params.set('idCurso', filtroCurso);
      if (filtroModulo) params.set('idModulo', filtroModulo);
      const query = params.toString();
      const detailParams = new URLSearchParams(params);
      detailParams.set('page', String(page));
      detailParams.set('size', '50');

      let resumenData;
      let detalle;
      try {
        const [resumenRes, detalleRes] = await Promise.all([
          cachedGet(`/api/docente/calificaciones/resumen${query ? `?${query}` : ''}`, {}, { ttl: 8_000, force }),
          cachedGet(`/api/docente/calificaciones/ejercicios?${detailParams.toString()}`, {}, { ttl: 8_000, force })
        ]);
        resumenData = resumenRes.data || {};
        detalle = detalleRes.data || { items: [], page, size: 50, total: 0 };
      } catch (endpointError) {
        const legacyRes = await cachedGet(`/api/docente/calificaciones${query ? `?${query}` : ''}`, {}, { ttl: 8_000, force });
        const legacyData = legacyRes.data || {};
        const legacyEjercicios = legacyData.ejercicios || [];
        const pageSize = 50;
        const start = page * pageSize;
        resumenData = {
          escala: legacyData.escala,
          criterio: legacyData.criterio,
          cursos: legacyData.cursos || [],
          modulos: legacyData.modulos || []
        };
        detalle = {
          items: legacyEjercicios.slice(start, start + pageSize),
          page,
          size: pageSize,
          total: legacyEjercicios.length
        };
      }

      setCalificaciones({
        ...resumenData,
        ejercicios: detalle.items || []
      });
      setCalificacionesPage({
        items: detalle.items || [],
        page: Number(detalle.page || 0),
        size: Number(detalle.size || 50),
        total: Number(detalle.total || 0)
      });
    } catch {
      setCalificaciones(null);
      setCalificacionesPage({ items: [], page: 0, size: 50, total: 0 });
      toast.error('No se pudieron cargar calificaciones');
    } finally {
      setLoadingCalificaciones(false);
      setLoadingCalificacionesDetalle(false);
    }
  }, [filtroCurso, filtroModulo]);

  useEffect(() => {
    if (token && vistaActiva === 'calificaciones') {
      cargarCalificaciones({ page: 0 });
    }
  }, [token, vistaActiva, cargarCalificaciones]);

  const cerrarTutorialDocente = () => {
    localStorage.removeItem('dagon_docente_tutorial_pending');
    setShowDocenteTutorial(false);
  };

  const verIntentosAlumno = async (alumno) => {
    setAlumnoSeleccionado(alumno);
    setCargandoIntentos(true);
    try {
      const res = await apiClient.get(`/api/docente/intentos/${alumno.idUsuario}`);
      setIntentos(res.data);
    } catch {
      toast.error('Error al cargar intentos');
      setIntentos([]);
    } finally {
      setCargandoIntentos(false);
    }
  };

  const exportarCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (filtroCurso) params.set('idCurso', filtroCurso);
      if (filtroModulo) params.set('idModulo', filtroModulo);
      if (filtroDesde) params.set('desde', filtroDesde);
      if (filtroHasta) params.set('hasta', filtroHasta);

      const res = await apiClient.get(`/api/docente/exportar/csv?${params.toString()}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'progreso_dagon.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('CSV descargado');
    } catch {
      toast.error('Error al exportar CSV');
    }
  };


  const crearGrupo = async (event) => {
    event.preventDefault();
    if (!nuevoGrupo.nombreGrupo.trim()) {
      toast.error('El nombre del grupo es obligatorio');
      return;
    }

    setGuardandoGrupo(true);
    try {
      const res = await apiClient.post('/api/docente/grupos', {
        nombreGrupo: nuevoGrupo.nombreGrupo.trim(),
        descripcion: nuevoGrupo.descripcion.trim() || null
      });
      setNuevoGrupo({ nombreGrupo: '', descripcion: '' });
      setGrupoSeleccionado(res.data);
      setAlumnosGrupo([]);
      invalidateApiCache('/api/docente');
      await cargarDatos({ force: true });
      toast.success('Grupo creado con código de acceso');
    } catch (err) {
      toast.error(err.response?.data || 'No se pudo crear el grupo');
    } finally {
      setGuardandoGrupo(false);
    }
  };

  const seleccionarGrupo = async (grupo) => {
    setGrupoSeleccionado(grupo);
    setNuevoEjercicio(prev => ({ ...prev, idGrupo: grupo?.idGrupo ? String(grupo.idGrupo) : prev.idGrupo }));
    if (!grupo?.idGrupo) {
      setAlumnosGrupo([]);
      return;
    }

    try {
      const res = await apiClient.get(`/api/docente/grupos/${grupo.idGrupo}/alumnos`);
      setAlumnosGrupo(res.data || []);
    } catch {
      setAlumnosGrupo([]);
      toast.error('No se pudieron cargar alumnos del grupo');
    }
  };

  const agregarAlumno = async (event) => {
    event.preventDefault();
    if (!grupoSeleccionado?.idGrupo) {
      toast.error('Selecciona un grupo');
      return;
    }
    if (!emailAlumno.trim()) {
      toast.error('Escribe el correo del alumno');
      return;
    }

    setGuardandoAlumno(true);
    try {
      await apiClient.post(`/api/docente/grupos/${grupoSeleccionado.idGrupo}/alumnos`, {
        emailAlumno: emailAlumno.trim()
      });
      setEmailAlumno('');
      await seleccionarGrupo(grupoSeleccionado);
      invalidateApiCache('/api/docente');
      await cargarDatos({ force: true });
      toast.success('Alumno agregado al grupo');
    } catch (err) {
      toast.error(err.response?.data || 'No se pudo agregar al alumno');
    } finally {
      setGuardandoAlumno(false);
    }
  };

  const crearEjercicio = async (event) => {
    event.preventDefault();
    if (!nuevoEjercicio.idModulo || !nuevoEjercicio.titulo.trim() || !nuevoEjercicio.enunciado.trim() || !nuevoEjercicio.queryMaestra.trim()) {
      toast.error('Completa módulo, título, enunciado y query esperada');
      return;
    }
    if (nuevoEjercicio.visibilidad === 'GRUPO' && !nuevoEjercicio.idGrupo) {
      toast.error('Selecciona el grupo que recibirá el ejercicio');
      return;
    }

    setGuardandoEjercicio(true);
    try {
      await apiClient.post('/api/docente/ejercicios', {
        idModulo: Number(nuevoEjercicio.idModulo),
        titulo: nuevoEjercicio.titulo.trim(),
        enunciado: nuevoEjercicio.enunciado.trim(),
        queryMaestra: nuevoEjercicio.queryMaestra.trim(),
        dificultad: Number(nuevoEjercicio.dificultad),
        formato: nuevoEjercicio.formato,
        visibilidad: nuevoEjercicio.visibilidad,
        idGrupo: nuevoEjercicio.visibilidad === 'GRUPO' ? Number(nuevoEjercicio.idGrupo) : null,
        tipoMision: nuevoEjercicio.tipoMision || 'DOCENTE'
      });
      setNuevoEjercicio(prev => ({
        ...prev,
        titulo: '',
        enunciado: '',
        queryMaestra: '',
        dificultad: 2
      }));
      invalidateApiCache('/api/docente');
      await cargarEjerciciosDocente();
      if (vistaActiva === 'calificaciones') {
        await cargarCalificaciones({ page: 0, force: true });
      }
      toast.success('Ejercicio docente publicado');
    } catch (err) {
      toast.error(err.response?.data || 'No se pudo crear el ejercicio');
    } finally {
      setGuardandoEjercicio(false);
    }
  };

  const copiarCodigoGrupo = (codigo) => {
    if (!codigo) return;
    navigator.clipboard?.writeText(codigo);
    toast.success('Código de grupo copiado');
  };

  const alumnosFiltrados = useMemo(() => {
    if (!data?.alumnos) return [];
    let lista = [...data.alumnos];
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(a =>
        a.nombre.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
      );
    }
    lista.sort((a, b) => {
      const valA = a[ordenAlumnos.campo] ?? 0;
      const valB = b[ordenAlumnos.campo] ?? 0;
      return ordenAlumnos.asc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
    return lista;
  }, [data?.alumnos, busqueda, ordenAlumnos]);

  const modulosFiltro = useMemo(() => {
    if (!data?.modulos) return [];
    if (!filtroCurso) return data.modulos;
    return data.modulos.filter(m => String(m.id_curso) === filtroCurso);
  }, [data?.modulos, filtroCurso]);

  const resumenCalificaciones = useMemo(() => {
    const cursos = calificaciones?.cursos || [];
    if (cursos.length === 0) return { promedio: 0, alumnos: 0, cursosPendientes: 0 };
    const promedio = cursos.reduce((acc, item) => acc + Number(item.calificacion || 0), 0) / cursos.length;
    const alumnos = new Set(cursos.map(item => item.idAlumno)).size;
    const cursosPendientes = cursos.filter(item => Number(item.calificacion || 0) < 6).length;
    return {
      promedio: Math.round(promedio * 10) / 10,
      alumnos,
      cursosPendientes
    };
  }, [calificaciones]);

  const formatGrade = (grade) => Number(grade || 0).toFixed(1);

  const toggleOrden = (campo) => {
    setOrdenAlumnos(prev =>
      prev.campo === campo ? { campo, asc: !prev.asc } : { campo, asc: false }
    );
  };

  const SortIcon = ({ campo }) => {
    if (ordenAlumnos.campo !== campo) return null;
    return ordenAlumnos.asc
      ? <ChevronUp className="w-3 h-3 inline ml-1" />
      : <ChevronDown className="w-3 h-3 inline ml-1" />;
  };

  const chartColors = [
    colors.primary,
    colors.accent,
    isLight ? '#dc2626' : '#f87171',
    isLight ? '#2563eb' : '#60a5fa',
    isLight ? '#059669' : '#34d399',
    isLight ? '#d97706' : '#fbbf24',
    isLight ? '#7c3aed' : '#a78bfa',
    isLight ? '#db2777' : '#f472b6',
  ];

  const panelSurface = isLight ? 'rgba(255,255,255,0.74)' : 'rgba(2,6,23,0.42)';
  const elevatedSurface = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.78)';
  const selectSurface = isLight ? 'rgba(255,255,255,0.96)' : 'rgba(15,23,42,0.96)';
  const selectStyle = {
    borderColor,
    color: headingColor,
    backgroundColor: selectSurface,
    colorScheme: isLight ? 'light' : 'dark',
  };
  const selectContentClass = isLight
    ? 'border-amber-200 bg-white text-slate-950'
    : 'border-slate-700 bg-slate-950 text-slate-50';
  const selectContentStyle = {
    boxShadow: isLight ? '0 22px 55px -34px rgba(15,23,42,0.42)' : '0 22px 55px -34px rgba(0,0,0,0.8)',
  };
  const cursoOptions = (data?.cursos || []).map(c => ({ value: c.id_curso, label: c.titulo }));
  const moduloOptions = modulosFiltro.map(m => ({ value: m.id_modulo, label: m.titulo }));
  const grupoOptions = (data?.grupos || []).map(g => ({ value: g.idGrupo, label: g.nombreGrupo }));
  const allModuloOptions = (data?.modulos || []).map(m => ({ value: m.id_modulo, label: m.titulo }));
  const docenteHeroBackground = isLight
    ? `linear-gradient(135deg, rgba(255,255,255,0.95), ${colors.primary}18 46%, rgba(14,165,233,0.16))`
    : `linear-gradient(135deg, rgba(2,6,23,0.94), ${colors.primary}26 48%, rgba(20,184,166,0.18))`;
  const promedioOficialLabel = calificaciones
    ? `${formatGrade(resumenCalificaciones.promedio)}/10`
    : 'Bajo demanda';
  const docenteHeroMetrics = [
    [Users, 'Alumnos visibles', data?.total_alumnos ?? 0, isLight ? '#2563eb' : '#60a5fa'],
    [Layers, 'Ejercicios propios', ejerciciosDocente.length, colors.primary],
    [GraduationCap, 'Promedio oficial', promedioOficialLabel, isLight ? '#059669' : '#34d399'],
  ];
  const docenteTabs = [
    ['inicio', Compass, 'Inicio', 'Ruta de trabajo'],
    ['aula', Users, 'Grupos', 'Aulas y alumnos'],
    ['ejercicios', Layers, 'Ejercicios', 'Material propio'],
    ['calificaciones', GraduationCap, 'Notas', 'Evaluación oficial'],
  ];
  const flujoDocente = [
    ['1', 'Crea o elige un grupo', 'Usa Grupos para abrir un aula y compartir su código de acceso.', Users],
    ['2', 'Agrega alumnos', 'Invítalos por código o agrégalos por correo institucional.', UserPlus],
    ['3', 'Publica ejercicios', 'Define teoría, enunciado, formato y query esperada para tu grupo.', Save],
    ['4', 'Revisa notas', 'Consulta calificación por ejercicio, módulo y curso. Las prácticas relámpago no cuentan.', Award],
  ];
  const resumenRapido = [
    ['Grupos activos', data?.grupos?.length || 0, Users],
    ['Alumnos visibles', data?.total_alumnos ?? 0, ShieldCheck],
    ['Ejercicios propios', ejerciciosDocente.length, FileText],
    ['Promedio oficial', promedioOficialLabel, GraduationCap],
  ];

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ color: headingColor }}>
        <div className="w-full max-w-md">
          <LoadingBlock label="Preparando panel docente" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dagon-page-shell dagon-page-shell--wide print:p-2 print:max-w-none">
      <AnimatePresence>
        {showDocenteTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"
            style={{ backgroundColor: 'rgba(2,6,23,0.72)' }}
            onClick={cerrarTutorialDocente}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="glass-card-apple w-full max-w-3xl rounded-3xl border p-5 sm:p-6"
              style={{ borderColor, backgroundColor: isLight ? '#fff' : '#0f172a' }}
              onClick={event => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: colors.primary }}>Modo docente</p>
                  <h2 className="mt-2 font-display text-2xl font-black" style={{ color: headingColor }}>
                    Tu panel docente ya está listo
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>
                    Esta vista está pensada para impartir clase: ves tus grupos, publicas ejercicios propios y revisas calificaciones sin mezclar alumnos externos.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={cerrarTutorialDocente}
                  className="rounded-xl"
                  style={{ color: mutedColor }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  [ShieldCheck, 'Módulos desbloqueados', 'Puedes recorrer el contenido completo para preparar clase sin avanzar como alumno común.'],
                  [BookOpen, 'Query esperada visible', 'En cada misión docente aparece la solución de referencia para explicar el razonamiento.'],
                  [KeyRound, 'Grupos controlados', 'Cada aula tiene un código. Solo los alumnos inscritos ahí entran en tus métricas.'],
                  [GraduationCap, 'Evaluación 0-10', 'El panel resume notas por ejercicio, módulo y curso; las prácticas relámpago no entran en la nota oficial.'],
                ].map(([Icon, title, desc]) => (
                  <div key={title} className="rounded-2xl border p-4" style={{ borderColor, backgroundColor: surfaceColor }}>
                    <Icon className="mb-3 h-5 w-5" style={{ color: colors.primary }} />
                    <p className="font-display text-base font-black" style={{ color: headingColor }}>{title}</p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>{desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <Button
                  type="button"
                  onClick={cerrarTutorialDocente}
                  className="rounded-xl font-display font-black"
                  style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, color: isLight ? '#111827' : '#fff' }}
                >
                  Entendido
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6 overflow-hidden rounded-[2rem] border p-5 sm:p-6"
        style={{ borderColor, background: docenteHeroBackground, boxShadow: isLight ? '0 24px 60px -42px rgba(15,23,42,0.42)' : '0 24px 70px -46px rgba(0,0,0,0.72)' }}
      >
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.accent}, ${colors.secondary})` }} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.52fr)] lg:items-end">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mb-5 rounded-xl print:hidden"
              style={{ borderColor, color: headingColor, backgroundColor: panelSurface }}
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver
            </Button>
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-display font-black uppercase tracking-[0.24em]" style={{ borderColor, color: colors.primary, backgroundColor: panelSurface }}>
              <Sparkles className="h-3.5 w-3.5" /> Modo docente
            </div>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-tight sm:text-5xl" style={{ color: headingColor }}>
              Aula, práctica y evaluación en un solo lugar
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed sm:text-lg" style={{ color: mutedColor }}>
              Gestiona grupos, crea ejercicios propios y revisa notas oficiales sin incluir prácticas relámpago ni alumnos fuera de tu aula.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDocenteTutorial(true)}
                className="rounded-xl font-display font-black"
                style={{ borderColor, color: headingColor, backgroundColor: panelSurface }}
              >
                <HelpCircle className="w-4 h-4 mr-1" /> Guía docente
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportarCSV}
                className="rounded-xl font-display font-black"
                style={{ borderColor, color: headingColor, backgroundColor: panelSurface }}
              >
                <Download className="w-4 h-4 mr-1" /> CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="rounded-xl font-display font-black"
                style={{ borderColor, color: headingColor, backgroundColor: panelSurface }}
              >
                <Printer className="w-4 h-4 mr-1" /> PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cargarDatos}
                disabled={loading}
                className="rounded-xl font-display font-black"
                style={{ borderColor, color: headingColor, backgroundColor: panelSurface }}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
              </Button>
            </div>
          </div>
          <div className="grid gap-3">
            {docenteHeroMetrics.map(([Icon, label, value, accent]) => (
              <div key={label} className="rounded-2xl border p-4" style={{ borderColor, backgroundColor: elevatedSurface }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: mutedColor }}>{label}</p>
                    <p className="mt-1 font-display text-3xl font-black" style={{ color: headingColor }}>{value}</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}22`, color: accent }}>
                    <Icon className="h-6 w-6" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card-apple dagon-compact-card rounded-3xl p-4 border mb-6 print:hidden"
        style={{ borderColor, backgroundColor: panelSurface }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Search className="h-4 w-4" style={{ color: colors.primary }} />
          <p className="font-display text-sm font-black uppercase tracking-[0.22em]" style={{ color: mutedColor }}>Filtros de aula</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DagonSelect
            value={filtroCurso}
            onChange={value => { setFiltroCurso(value); setFiltroModulo(''); }}
            placeholder="Todos los cursos"
            options={cursoOptions}
            triggerStyle={selectStyle}
            contentClassName={selectContentClass}
            contentStyle={selectContentStyle}
          />
          <DagonSelect
            value={filtroModulo}
            onChange={setFiltroModulo}
            placeholder="Todos los módulos"
            options={moduloOptions}
            triggerStyle={selectStyle}
            contentClassName={selectContentClass}
            contentStyle={selectContentStyle}
          />
          <input
            type="date"
            value={filtroDesde}
            onChange={e => setFiltroDesde(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm border"
            style={selectStyle}
            placeholder="Desde"
          />
          <input
            type="date"
            value={filtroHasta}
            onChange={e => setFiltroHasta(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm border"
            style={selectStyle}
            placeholder="Hasta"
          />
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card-apple dagon-compact-card rounded-[2rem] border mb-6 overflow-hidden print:hidden"
        style={{ borderColor, backgroundColor: panelSurface }}
      >
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between" style={{ borderBottom: `1px solid ${borderColor}` }}>
          <div>
            <p className="text-xs font-display font-black uppercase tracking-[0.28em]" style={{ color: colors.primary }}>Centro docente</p>
            <h2 className="font-display text-2xl font-black mt-1 leading-tight" style={{ color: headingColor }}>Gestiona tu clase en pasos claros</h2>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 rounded-3xl border p-2 lg:max-w-2xl lg:grid-cols-4" style={{ borderColor, backgroundColor: elevatedSurface }}>
            {docenteTabs.map(([key, Icon, label, helper]) => (
              <button
                key={key}
                type="button"
                onClick={() => setVistaActiva(key)}
                className="group flex min-h-16 items-center gap-3 rounded-2xl px-3 py-2 text-left transition-all"
                style={{
                  backgroundColor: vistaActiva === key ? `${colors.primary}22` : 'transparent',
                  color: vistaActiva === key ? colors.primary : mutedColor
                }}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: vistaActiva === key ? `${colors.primary}22` : surfaceColor }}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-black" style={{ color: vistaActiva === key ? colors.primary : headingColor }}>{label}</span>
                  <span className="block truncate text-[11px] font-medium" style={{ color: mutedColor }}>{helper}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {vistaActiva === 'inicio' && (
          <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(300px,0.58fr)]">
            <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" style={{ color: colors.primary }} />
                <div>
                  <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Flujo recomendado</h3>
                  <p className="text-sm" style={{ color: mutedColor }}>Una ruta corta para preparar clase, publicar material y revisar avance real.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {flujoDocente.map(([step, title, desc, Icon], index) => (
                  <div key={step} className="rounded-3xl border p-4 transition-all hover:-translate-y-0.5" style={{ borderColor, backgroundColor: panelSurface }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl font-display text-sm font-black" style={{ backgroundColor: `${chartColors[index % chartColors.length]}22`, color: chartColors[index % chartColors.length] }}>
                        {step}
                      </span>
                      <Icon className="h-5 w-5" style={{ color: chartColors[index % chartColors.length] }} />
                    </div>
                    <p className="mt-4 font-display text-lg font-black leading-snug" style={{ color: headingColor }}>{title}</p>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5" style={{ color: colors.primary }} />
                <div>
                  <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Resumen rápido</h3>
                  <p className="text-sm" style={{ color: mutedColor }}>Lectura inmediata del aula.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {resumenRapido.map(([label, value, Icon], index) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-2xl border p-3" style={{ borderColor, backgroundColor: panelSurface }}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${chartColors[index % chartColors.length]}20`, color: chartColors[index % chartColors.length] }}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-sm font-semibold" style={{ color: mutedColor }}>{label}</span>
                    </div>
                    <span className="font-display text-2xl font-black" style={{ color: headingColor }}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={() => setVistaActiva('aula')} className="rounded-xl font-display font-black" style={{ borderColor, color: headingColor, backgroundColor: panelSurface }}>
                  <Users className="h-4 w-4 mr-2" /> Grupos
                </Button>
                <Button type="button" variant="outline" onClick={() => setVistaActiva('calificaciones')} className="rounded-xl font-display font-black" style={{ borderColor, color: headingColor, backgroundColor: panelSurface }}>
                  <GraduationCap className="h-4 w-4 mr-2" /> Notas
                </Button>
              </div>
            </div>
          </div>
        )}

        {vistaActiva === 'aula' && (
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.15fr)]">
            <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-5 w-5" style={{ color: colors.primary }} />
                <div>
                  <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Crear grupo</h3>
                  <p className="text-sm" style={{ color: mutedColor }}>Abre un aula y comparte su código institucional.</p>
                </div>
              </div>
              <form onSubmit={crearGrupo} className="grid gap-3">
                <input
                  value={nuevoGrupo.nombreGrupo}
                  onChange={e => setNuevoGrupo(prev => ({ ...prev, nombreGrupo: e.target.value }))}
                  placeholder="Base de Datos 5A"
                  className="rounded-xl border bg-transparent px-3 py-2 text-sm"
                  style={{ borderColor, color: headingColor }}
                />
                <textarea
                  value={nuevoGrupo.descripcion}
                  onChange={e => setNuevoGrupo(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Contexto, semestre o laboratorio"
                  rows={3}
                  className="rounded-xl border bg-transparent px-3 py-2 text-sm resize-none"
                  style={{ borderColor, color: headingColor }}
                />
                <Button type="submit" disabled={guardandoGrupo} className="rounded-xl font-display font-black" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, color: isLight ? '#111827' : '#fff' }}>
                  {guardandoGrupo ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Crear aula
                </Button>
              </form>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
              <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Mis grupos</h3>
                  <span className="rounded-full px-3 py-1 text-xs font-display font-black" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>{data?.grupos?.length || 0}</span>
                </div>
                <div className="grid gap-2 max-h-72 overflow-y-auto scroll-fancy pr-1">
                  {(data?.grupos || []).map(grupo => (
                    <button
                      key={grupo.idGrupo}
                      type="button"
                      onClick={() => seleccionarGrupo(grupo)}
                      className="rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5"
                      style={{
                        borderColor: grupoSeleccionado?.idGrupo === grupo.idGrupo ? colors.primary : borderColor,
                        backgroundColor: grupoSeleccionado?.idGrupo === grupo.idGrupo ? `${colors.primary}18` : panelSurface
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-display text-sm font-black truncate" style={{ color: headingColor }}>{grupo.nombreGrupo}</p>
                          <p className="text-xs mt-1" style={{ color: mutedColor }}>{grupo.totalAlumnos || 0} alumnos</p>
                        </div>
                        <span className="rounded-lg border px-2 py-1 font-mono text-[10px]" style={{ borderColor, color: colors.primary }}>{grupo.codigoAcceso}</span>
                      </div>
                    </button>
                  ))}
                  {(!data?.grupos || data.grupos.length === 0) && (
                    <p className="rounded-xl border p-4 text-sm" style={{ borderColor, color: mutedColor }}>Aún no tienes grupos.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div>
                    <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>{grupoSeleccionado?.nombreGrupo || 'Selecciona un grupo'}</h3>
                    <p className="text-sm" style={{ color: mutedColor }}>Solo verás alumnos inscritos en tus grupos.</p>
                  </div>
                  {grupoSeleccionado?.codigoAcceso && (
                    <Button type="button" variant="outline" size="sm" onClick={() => copiarCodigoGrupo(grupoSeleccionado.codigoAcceso)} className="rounded-xl" style={{ borderColor, color: headingColor }}>
                      <Clipboard className="h-4 w-4 mr-2" /> {grupoSeleccionado.codigoAcceso}
                    </Button>
                  )}
                </div>

                <form onSubmit={agregarAlumno} className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    type="email"
                    value={emailAlumno}
                    onChange={e => setEmailAlumno(e.target.value)}
                    placeholder="correo@alumno.unach.mx"
                    disabled={!grupoSeleccionado}
                    className="rounded-xl border bg-transparent px-3 py-2 text-sm disabled:opacity-50"
                    style={{ borderColor, color: headingColor }}
                  />
                  <Button type="submit" disabled={!grupoSeleccionado || guardandoAlumno} className="rounded-xl font-display font-black" style={{ backgroundColor: colors.primary, color: isLight ? '#111827' : '#fff' }}>
                    {guardandoAlumno ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />} Agregar
                  </Button>
                </form>

                <div className="max-h-72 overflow-y-auto scroll-fancy rounded-xl border" style={{ borderColor }}>
                  {alumnosGrupo.map(alumno => (
                    <div key={alumno.idUsuario} className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0" style={{ borderColor }}>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: headingColor }}>{alumno.nombre}</p>
                        <p className="text-xs truncate" style={{ color: mutedColor }}>{alumno.email}</p>
                      </div>
                      <span className="font-mono text-xs" style={{ color: colors.primary }}>{alumno.xp || 0} XP</span>
                    </div>
                  ))}
                  {grupoSeleccionado && alumnosGrupo.length === 0 && (
                    <p className="p-4 text-center text-sm" style={{ color: mutedColor }}>Este grupo todavía no tiene alumnos.</p>
                  )}
                  {!grupoSeleccionado && (
                    <p className="p-4 text-center text-sm" style={{ color: mutedColor }}>Elige un grupo para ver su lista.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {vistaActiva === 'ejercicios' && (
          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
            <form onSubmit={crearEjercicio} className="rounded-3xl border p-5 grid gap-3" style={{ borderColor, backgroundColor: elevatedSurface }}>
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5" style={{ color: colors.primary }} />
                <div>
                  <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Nuevo ejercicio</h3>
                  <p className="text-sm" style={{ color: mutedColor }}>Diseña una práctica con solución esperada y destino claro.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <DagonSelect
                  value={nuevoEjercicio.idModulo}
                  onChange={value => setNuevoEjercicio(prev => ({ ...prev, idModulo: value }))}
                  placeholder="Módulo"
                  options={allModuloOptions}
                  triggerStyle={selectStyle}
                  contentClassName={selectContentClass}
                  contentStyle={selectContentStyle}
                />
                <DagonSelect
                  value={nuevoEjercicio.formato}
                  onChange={value => setNuevoEjercicio(prev => ({ ...prev, formato: value }))}
                  placeholder="Formato"
                  options={[
                    { value: 'editor', label: 'Editor SQL' },
                    { value: 'drag_drop', label: 'Bloques' },
                    { value: 'diagram', label: 'Diagrama' },
                  ]}
                  triggerStyle={selectStyle}
                  contentClassName={selectContentClass}
                  contentStyle={selectContentStyle}
                />
                <DagonSelect
                  value={nuevoEjercicio.visibilidad}
                  onChange={value => setNuevoEjercicio(prev => ({ ...prev, visibilidad: value || 'DOCENTE' }))}
                  placeholder="Visibilidad"
                  options={[
                    { value: 'GRUPO', label: 'Para un grupo' },
                    { value: 'DOCENTE', label: 'Banco privado' },
                  ]}
                  triggerStyle={selectStyle}
                  contentClassName={selectContentClass}
                  contentStyle={selectContentStyle}
                />
                <DagonSelect
                  value={nuevoEjercicio.idGrupo}
                  onChange={value => setNuevoEjercicio(prev => ({ ...prev, idGrupo: value }))}
                  disabled={nuevoEjercicio.visibilidad !== 'GRUPO'}
                  placeholder="Grupo destino"
                  options={grupoOptions}
                  triggerStyle={selectStyle}
                  contentClassName={selectContentClass}
                  contentStyle={selectContentStyle}
                  className="disabled:opacity-50"
                />
              </div>
              <input value={nuevoEjercicio.titulo} onChange={e => setNuevoEjercicio(prev => ({ ...prev, titulo: e.target.value }))} placeholder="Título del ejercicio" className="rounded-xl border px-3 py-2 text-sm" style={selectStyle} />
              <textarea value={nuevoEjercicio.enunciado} onChange={e => setNuevoEjercicio(prev => ({ ...prev, enunciado: e.target.value }))} rows={4} placeholder="Qué debe practicar el alumno" className="rounded-xl border bg-transparent px-3 py-2 text-sm resize-none" style={{ borderColor, color: headingColor }} />
              <textarea value={nuevoEjercicio.queryMaestra} onChange={e => setNuevoEjercicio(prev => ({ ...prev, queryMaestra: e.target.value }))} rows={5} placeholder="Query esperada" className="rounded-xl border bg-transparent px-3 py-2 font-mono text-xs resize-none" style={{ borderColor, color: headingColor }} />
              <label className="grid gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: mutedColor }}>
                Dificultad {nuevoEjercicio.dificultad}
                <input type="range" min="1" max="5" value={nuevoEjercicio.dificultad} onChange={e => setNuevoEjercicio(prev => ({ ...prev, dificultad: e.target.value }))} />
              </label>
              <Button type="submit" disabled={guardandoEjercicio} className="rounded-xl font-display font-black" style={{ background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`, color: isLight ? '#111827' : '#fff' }}>
                {guardandoEjercicio ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />} Publicar ejercicio
              </Button>
            </form>

            <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5" style={{ color: colors.primary }} />
                <div>
                  <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Ejercicios publicados</h3>
                  <p className="text-sm" style={{ color: mutedColor }}>Banco propio y material asignado a tus grupos.</p>
                </div>
              </div>
              <div className="grid gap-3 max-h-[36rem] overflow-y-auto scroll-fancy pr-1">
                {ejerciciosDocente.map(ej => (
                  <div key={ej.idEjercicio} className="rounded-3xl border p-4" style={{ borderColor, backgroundColor: panelSurface }}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-display text-lg font-black leading-snug" style={{ color: headingColor }}>{ej.titulo}</p>
                        <p className="text-xs mt-1" style={{ color: mutedColor }}>Módulo {ej.idModulo} · {ej.formato} · {ej.nombreGrupo || ej.visibilidad}</p>
                      </div>
                      <span className="rounded-xl border px-2 py-1 text-[10px] font-bold uppercase" style={{ borderColor, color: colors.primary }}>{ej.visibilidad}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{ej.enunciado}</p>
                    <pre className="mt-3 max-h-28 overflow-auto rounded-xl border p-3 font-mono text-xs" style={{ borderColor, color: isLight ? '#312e81' : '#e0e7ff', backgroundColor: isLight ? 'rgba(255,255,255,0.74)' : 'rgba(2,6,23,0.58)' }}>{ej.queryMaestra}</pre>
                  </div>
                ))}
                {ejerciciosDocente.length === 0 && (
                  <EmptyState
                    icon={FileText}
                    title="Aún no has creado ejercicios docentes"
                    description="Publica tu primera práctica para que aparezca en este banco."
                    colors={{ heading: headingColor, muted: mutedColor, accent: colors.primary }}
                    style={{ borderColor, backgroundColor: panelSurface }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {vistaActiva === 'calificaciones' && (
          <div className="grid gap-5 p-5">
            <div className="rounded-3xl border p-5" style={{ borderColor, background: isLight ? 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(240,253,250,0.72))' : 'linear-gradient(135deg, rgba(15,23,42,0.88), rgba(20,83,45,0.20))' }}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-display text-xs font-black uppercase tracking-[0.26em]" style={{ color: colors.primary }}>Evaluación oficial</p>
                  <h3 className="mt-1 font-display text-3xl font-black leading-tight" style={{ color: headingColor }}>Notas sin prácticas relámpago</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: mutedColor }}>
                    La escala usa únicamente ejercicios de historia y ejercicios creados por docentes. Las prácticas relámpago siguen sirviendo para entrenar, XP y racha, pero no alteran la calificación.
                  </p>
                </div>
                {loadingCalificaciones && <RefreshCw className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                [GraduationCap, 'Promedio general', `${formatGrade(resumenCalificaciones.promedio)}/10`],
                [Users, 'Alumnos evaluados', resumenCalificaciones.alumnos],
                [AlertTriangle, 'Cursos bajo 6', resumenCalificaciones.cursosPendientes],
              ].map(([Icon, label, value]) => (
                <MetricCard
                  key={label}
                  icon={Icon}
                  label={label}
                  value={value}
                  accent={colors.primary}
                  colors={{ heading: headingColor, muted: mutedColor, accent: colors.primary }}
                  style={{ borderColor, backgroundColor: elevatedSurface }}
                />
              ))}
            </div>

            <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Calificación por curso</h3>
                  <p className="text-sm" style={{ color: mutedColor }}>{calificaciones?.criterio || 'Escala 0-10 por ejercicios resueltos correctamente.'}</p>
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: mutedColor }}>
                      <th className="py-2 px-3 text-left font-bold">Alumno</th>
                      <th className="py-2 px-3 text-left font-bold">Curso</th>
                      <th className="py-2 px-3 text-right font-bold">Avance</th>
                      <th className="py-2 px-3 text-right font-bold">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(calificaciones?.cursos || []).map((item, index) => (
                      <tr key={`${item.idAlumno}-${item.idCurso}-${index}`} className="border-t" style={{ borderColor }}>
                        <td className="py-2 px-3">
                          <div className="font-medium" style={{ color: headingColor }}>{item.nombreAlumno}</div>
                          <div className="text-xs" style={{ color: mutedColor }}>{item.emailAlumno}</div>
                        </td>
                        <td className="py-2 px-3" style={{ color: headingColor }}>{item.curso}</td>
                        <td className="py-2 px-3 text-right" style={{ color: mutedColor }}>{item.ejerciciosResueltos}/{item.ejerciciosTotales}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: Number(item.calificacion) >= 6 ? colors.primary : (isLight ? '#dc2626' : '#f87171') }}>
                          {formatGrade(item.calificacion)}
                        </td>
                      </tr>
                    ))}
                    {(!calificaciones?.cursos || calificaciones.cursos.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center" style={{ color: mutedColor }}>No hay calificaciones para los filtros actuales.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
                <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Por módulo</h3>
                <div className="mt-3 max-h-96 overflow-y-auto scroll-fancy">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: mutedColor }}>
                        <th className="py-2 px-2 text-left font-bold">Alumno</th>
                        <th className="py-2 px-2 text-left font-bold">Módulo</th>
                        <th className="py-2 px-2 text-right font-bold">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(calificaciones?.modulos || []).map((item, index) => (
                        <tr key={`${item.idAlumno}-${item.idModulo}-${index}`} className="border-t" style={{ borderColor }}>
                          <td className="py-2 px-2" style={{ color: headingColor }}>{item.nombreAlumno}</td>
                          <td className="py-2 px-2" style={{ color: mutedColor }}>{item.modulo}</td>
                          <td className="py-2 px-2 text-right font-mono font-bold" style={{ color: Number(item.calificacion) >= 6 ? colors.primary : (isLight ? '#dc2626' : '#f87171') }}>
                            {formatGrade(item.calificacion)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-3xl border p-5" style={{ borderColor, backgroundColor: elevatedSurface }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-display text-2xl font-black leading-tight" style={{ color: headingColor }}>Por ejercicio</h3>
                    <p className="text-sm" style={{ color: mutedColor }}>
                      {calificacionesPage.total.toLocaleString('es-MX')} registros oficiales, paginados para no saturar el panel.
                    </p>
                  </div>
                  {loadingCalificacionesDetalle && (
                    <RefreshCw className="h-5 w-5 animate-spin" style={{ color: colors.primary }} />
                  )}
                </div>
                <div className="mt-3 max-h-96 overflow-y-auto scroll-fancy">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: mutedColor }}>
                        <th className="py-2 px-2 text-left font-bold">Alumno</th>
                        <th className="py-2 px-2 text-left font-bold">Ejercicio</th>
                        <th className="py-2 px-2 text-right font-bold">Nota</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(calificacionesPage.items || []).map((item, index) => (
                        <tr key={`${item.idAlumno}-${item.idEjercicio}-${index}`} className="border-t" style={{ borderColor }}>
                          <td className="py-2 px-2" style={{ color: headingColor }}>{item.nombreAlumno}</td>
                          <td className="py-2 px-2" style={{ color: mutedColor }}>
                            <span className="block max-w-[18rem] truncate" title={item.ejercicio}>{item.ejercicio}</span>
                          </td>
                          <td className="py-2 px-2 text-right font-mono font-bold" style={{ color: item.resuelto ? colors.primary : mutedColor }}>
                            {formatGrade(item.calificacion)}
                          </td>
                        </tr>
                      ))}
                      {(!calificacionesPage.items || calificacionesPage.items.length === 0) && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center" style={{ color: mutedColor }}>No hay detalle por ejercicio para los filtros actuales.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {calificacionesPage.total > calificacionesPage.size && (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs" style={{ color: mutedColor }}>
                      Página {calificacionesPage.page + 1} de {Math.max(1, Math.ceil(calificacionesPage.total / calificacionesPage.size))}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={calificacionesPage.page <= 0 || loadingCalificacionesDetalle}
                        onClick={() => cargarCalificaciones({ page: Math.max(0, calificacionesPage.page - 1) })}
                        className="rounded-xl"
                        style={{ borderColor, color: headingColor }}
                      >
                        Anterior
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={(calificacionesPage.page + 1) * calificacionesPage.size >= calificacionesPage.total || loadingCalificacionesDetalle}
                        onClick={() => cargarCalificaciones({ page: calificacionesPage.page + 1 })}
                        className="rounded-xl"
                        style={{ borderColor, color: headingColor }}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.section>

      {vistaActiva === 'calificaciones' && (
        <>
      {/* Metricas globales */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: 'Total alumnos', value: data?.total_alumnos ?? 0, icon: Users, accent: colors.primary },
          { label: 'Total intentos', value: data?.total_intentos ?? 0, icon: Target, accent: colors.accent },
          { label: 'Intentos correctos', value: data?.intentos_correctos ?? 0, icon: CheckCircle, accent: isLight ? '#059669' : '#34d399' },
          { label: 'Tasa de acierto', value: `${data?.tasa_acierto_global ?? 0}%`, icon: BarChart3, accent: isLight ? '#2563eb' : '#60a5fa' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="glass-card-apple dagon-compact-card rounded-2xl p-4 border"
              style={{ borderColor }}
            >
              <div className="flex items-center gap-2 text-xs font-bold uppercase mb-2" style={{ color: mutedColor }}>
                <Icon className="w-4 h-4" style={{ color: m.accent }} />
                {m.label}
              </div>
              <p className="font-display text-2xl font-black" style={{ color: headingColor }}>
                {typeof m.value === 'number' ? m.value.toLocaleString('es-MX') : m.value}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Ejercicios mas fallados - Grafica */}
      {data?.ejercicios_fallados?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card-apple dagon-compact-card rounded-2xl p-5 border mb-6"
          style={{ borderColor }}
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5" style={{ color: isLight ? '#dc2626' : '#f87171' }} />
            <h2 className="font-display text-lg font-black" style={{ color: headingColor }}>
              Ejercicios mas fallados
            </h2>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.ejercicios_fallados.slice(0, 10).map(e => ({
                  name: e.titulo?.length > 25 ? e.titulo.slice(0, 22) + '...' : e.titulo,
                  tasaError: e.tasaError,
                  intentos: e.intentosTotales
                }))}
                layout="vertical"
                margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: mutedColor, fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={160}
                  tick={{ fill: mutedColor, fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#fff' : '#1e293b',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 12,
                    color: headingColor
                  }}
                  formatter={(val, name) => [
                    name === 'tasaError' ? `${val}%` : val,
                    name === 'tasaError' ? 'Tasa error' : 'Intentos'
                  ]}
                />
                <Bar dataKey="tasaError" radius={[0, 6, 6, 0]}>
                  {data.ejercicios_fallados.slice(0, 10).map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Abandono por modulo - Grafica */}
      {data?.abandono_modulos?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card-apple dagon-compact-card rounded-2xl p-5 border mb-6"
          style={{ borderColor }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5" style={{ color: isLight ? '#d97706' : '#fbbf24' }} />
            <h2 className="font-display text-lg font-black" style={{ color: headingColor }}>
              Abandono por modulo
            </h2>
          </div>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.abandono_modulos.map(m => ({
                  name: m.titulo?.length > 20 ? m.titulo.slice(0, 17) + '...' : m.titulo,
                  abandono: m.tasaAbandono,
                  iniciaron: m.alumnosQueIniciaron,
                  completaron: m.alumnosQueCompletaron
                }))}
                margin={{ left: 5, right: 20, top: 5, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: mutedColor, fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis domain={[0, 100]} tick={{ fill: mutedColor, fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#fff' : '#1e293b',
                    border: `1px solid ${borderColor}`,
                    borderRadius: 12,
                    color: headingColor
                  }}
                  formatter={(val, name) => {
                    if (name === 'abandono') return [`${val}%`, 'Tasa abandono'];
                    if (name === 'iniciaron') return [val, 'Iniciaron'];
                    return [val, 'Completaron'];
                  }}
                />
                <Bar dataKey="abandono" fill={isLight ? '#d97706' : '#fbbf24'} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Tiempo promedio por modulo */}
      {data?.tiempo_promedio?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card-apple dagon-compact-card rounded-2xl p-5 border mb-6"
          style={{ borderColor }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5" style={{ color: colors.primary }} />
            <h2 className="font-display text-lg font-black" style={{ color: headingColor }}>
              Tiempo promedio por modulo
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ color: mutedColor }}>
                  <th className="text-left py-2 px-3 font-bold">Modulo</th>
                  <th className="text-right py-2 px-3 font-bold">Tiempo promedio</th>
                  <th className="text-right py-2 px-3 font-bold">Intentos</th>
                </tr>
              </thead>
              <tbody>
                {data.tiempo_promedio.map(t => (
                  <tr key={t.idModulo} className="border-t" style={{ borderColor }}>
                    <td className="py-2 px-3" style={{ color: headingColor }}>{t.titulo}</td>
                    <td className="py-2 px-3 text-right font-mono" style={{ color: headingColor }}>
                      {formatMs(t.tiempoPromedioMs)}
                    </td>
                    <td className="py-2 px-3 text-right" style={{ color: mutedColor }}>
                      {t.intentosTotales.toLocaleString('es-MX')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Tabla de alumnos */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card-apple dagon-compact-card rounded-2xl p-5 border mb-6"
        style={{ borderColor }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: colors.primary }} />
            <h2 className="font-display text-lg font-black" style={{ color: headingColor }}>
              Progreso por alumno
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: surfaceColor, color: mutedColor }}>
              {alumnosFiltrados.length}
            </span>
          </div>
          <div className="relative print:hidden">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: mutedColor }} />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar alumno..."
              className="rounded-xl pl-9 pr-3 py-2 text-sm border bg-transparent w-full sm:w-64"
              style={{ borderColor, color: headingColor }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: mutedColor }}>
                <th className="text-left py-2 px-3 font-bold">Alumno</th>
                <th
                  className="text-right py-2 px-3 font-bold cursor-pointer select-none"
                  onClick={() => toggleOrden('xp')}
                >
                  XP <SortIcon campo="xp" />
                </th>
                <th
                  className="text-right py-2 px-3 font-bold cursor-pointer select-none"
                  onClick={() => toggleOrden('ejerciciosCompletados')}
                >
                  Ejercicios <SortIcon campo="ejerciciosCompletados" />
                </th>
                <th
                  className="text-right py-2 px-3 font-bold cursor-pointer select-none"
                  onClick={() => toggleOrden('totalIntentos')}
                >
                  Intentos <SortIcon campo="totalIntentos" />
                </th>
                <th
                  className="text-right py-2 px-3 font-bold cursor-pointer select-none"
                  onClick={() => toggleOrden('racha')}
                >
                  Racha <SortIcon campo="racha" />
                </th>
                <th className="text-center py-2 px-3 font-bold print:hidden">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {alumnosFiltrados.map(a => (
                <tr key={a.idUsuario} className="border-t hover:bg-white/5 transition-colors" style={{ borderColor }}>
                  <td className="py-2 px-3">
                    <div style={{ color: headingColor }} className="font-medium">{a.nombre}</div>
                    <div className="text-xs" style={{ color: mutedColor }}>{a.email}</div>
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold" style={{ color: colors.primary }}>
                    {a.xp.toLocaleString('es-MX')}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: headingColor }}>
                    {a.ejerciciosCompletados}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: headingColor }}>
                    {a.totalIntentos.toLocaleString('es-MX')}
                  </td>
                  <td className="py-2 px-3 text-right" style={{ color: headingColor }}>
                    {a.racha > 0 ? `${a.racha} dias` : '-'}
                  </td>
                  <td className="py-2 px-3 text-center print:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => verIntentosAlumno(a)}
                      className="rounded-lg"
                      style={{ color: colors.primary }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {alumnosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center" style={{ color: mutedColor }}>
                    No se encontraron alumnos
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
        </>
      )}

      {/* Modal de intentos */}
      <AnimatePresence>
        {alumnoSeleccionado && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setAlumnoSeleccionado(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card-apple rounded-3xl p-6 border w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
              style={{ borderColor, backgroundColor: isLight ? '#fff' : '#0f172a' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg font-black" style={{ color: headingColor }}>
                    Intentos de {alumnoSeleccionado.nombre}
                  </h3>
                  <p className="text-xs" style={{ color: mutedColor }}>{alumnoSeleccionado.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAlumnoSeleccionado(null)}
                  className="rounded-xl"
                  style={{ color: mutedColor }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="overflow-y-auto flex-1">
                {cargandoIntentos ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-6 h-6 animate-spin" style={{ color: colors.primary }} />
                  </div>
                ) : intentos.length === 0 ? (
                  <p className="text-center py-12" style={{ color: mutedColor }}>
                    Este alumno no tiene intentos registrados
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: mutedColor }}>
                        <th className="text-left py-2 px-2 font-bold">Ejercicio</th>
                        <th className="text-left py-2 px-2 font-bold">Query</th>
                        <th className="text-center py-2 px-2 font-bold">Resultado</th>
                        <th className="text-right py-2 px-2 font-bold">Tiempo</th>
                        <th className="text-right py-2 px-2 font-bold">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {intentos.map(intento => (
                        <tr key={intento.idIntento} className="border-t" style={{ borderColor }}>
                          <td className="py-2 px-2 max-w-[140px] truncate" style={{ color: headingColor }}>
                            {intento.tituloEjercicio}
                          </td>
                          <td className="py-2 px-2">
                            <code
                              className="text-xs block max-w-[200px] truncate font-mono"
                              style={{ color: mutedColor }}
                              title={intento.queryEnviada}
                            >
                              {intento.queryEnviada}
                            </code>
                          </td>
                          <td className="py-2 px-2 text-center">
                            {intento.esCorrecto
                              ? <CheckCircle className="w-4 h-4 inline" style={{ color: isLight ? '#059669' : '#34d399' }} />
                              : <XCircle className="w-4 h-4 inline" style={{ color: isLight ? '#dc2626' : '#f87171' }} />
                            }
                          </td>
                          <td className="py-2 px-2 text-right font-mono text-xs" style={{ color: mutedColor }}>
                            {intento.tiempoMs ? formatMs(intento.tiempoMs) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right text-xs" style={{ color: mutedColor }}>
                            {new Date(intento.fechaIntento).toLocaleString('es-MX', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
