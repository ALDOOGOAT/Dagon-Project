import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import apiClient from '../services/apiClient';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Users, AlertTriangle, Clock, TrendingDown, Download,
  Search, Eye, X, ChevronDown, ChevronUp, Printer, BarChart3,
  BookOpen, Target, CheckCircle, XCircle, FileText, RefreshCw
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

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCurso) params.set('idCurso', filtroCurso);
      if (filtroModulo) params.set('idModulo', filtroModulo);
      if (filtroDesde) params.set('desde', filtroDesde);
      if (filtroHasta) params.set('hasta', filtroHasta);

      const res = await apiClient.get(`/api/docente/resumen?${params.toString()}`);
      setData(res.data);
    } catch (err) {
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
    cargarDatos();
  }, [cargarDatos]);

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

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen dagon-page-shell dagon-page-shell--wide print:p-2 print:max-w-none">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl print:hidden"
            style={{ borderColor, color: headingColor }}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black" style={{ color: headingColor }}>
              Panel Docente
            </h1>
            <p className="text-sm" style={{ color: mutedColor }}>
              Analitica educativa de Dagon
            </p>
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={exportarCSV}
            className="rounded-xl"
            style={{ borderColor, color: headingColor }}
          >
            <Download className="w-4 h-4 mr-1" /> CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl"
            style={{ borderColor, color: headingColor }}
          >
            <Printer className="w-4 h-4 mr-1" /> PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={cargarDatos}
            disabled={loading}
            className="rounded-xl"
            style={{ borderColor, color: headingColor }}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-card-apple dagon-compact-card rounded-2xl p-4 border mb-6 print:hidden"
        style={{ borderColor }}
      >
        <p className="text-xs font-bold uppercase mb-3" style={{ color: mutedColor }}>Filtros</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select
            value={filtroCurso}
            onChange={e => { setFiltroCurso(e.target.value); setFiltroModulo(''); }}
            className="rounded-xl px-3 py-2 text-sm border bg-transparent"
            style={{ borderColor, color: headingColor }}
          >
            <option value="">Todos los cursos</option>
            {(data?.cursos || []).map(c => (
              <option key={c.id_curso} value={c.id_curso}>{c.titulo}</option>
            ))}
          </select>
          <select
            value={filtroModulo}
            onChange={e => setFiltroModulo(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm border bg-transparent"
            style={{ borderColor, color: headingColor }}
          >
            <option value="">Todos los modulos</option>
            {modulosFiltro.map(m => (
              <option key={m.id_modulo} value={m.id_modulo}>{m.titulo}</option>
            ))}
          </select>
          <input
            type="date"
            value={filtroDesde}
            onChange={e => setFiltroDesde(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm border bg-transparent"
            style={{ borderColor, color: headingColor }}
            placeholder="Desde"
          />
          <input
            type="date"
            value={filtroHasta}
            onChange={e => setFiltroHasta(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm border bg-transparent"
            style={{ borderColor, color: headingColor }}
            placeholder="Hasta"
          />
        </div>
      </motion.div>

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
