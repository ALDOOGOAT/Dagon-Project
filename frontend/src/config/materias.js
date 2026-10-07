import { Database, Sigma, ChartNetwork, Swords, Hammer } from 'lucide-react';

// Textos e iconos que cambian según la materia activa. 'sql' conserva al pie de la letra
// los textos que antes estaban escritos a mano en Dashboard, Clawbot y el certificado.
export const MATERIAS = {
  sql: {
    slug: 'sql',
    nombre: 'Bases de Datos SQL',
    corto: 'SQL',
    icono: Database,
    hudTexto: 'Avanza por SQL como un flujo de decisiones: aprende, valida y desbloquea la siguiente zona.',
    cursoPorDefecto: 'Senda SQL',
    // La senda se resuelve por id_curso (1 = Guerrero), como siempre.
    sendas: [
      { nombre: 'Senda del Guerrero', icono: Swords },
      { nombre: 'Senda del Arquitecto', icono: Hammer },
    ],
    missionFocuses: [
      'Leer datos con calma antes de escribir SQL completo.',
      'Filtrar informacion con condiciones simples y verificables.',
      'Conectar tablas para responder preguntas reales.',
      'Modificar datos con seguridad y entender sus consecuencias.',
      'Modelar reglas para proteger la informacion.',
    ],
    titulos: [
      { min: 0, name: 'Novato del SELECT', tier: 'bronze' },
      { min: 100, name: 'Explorador de Tablas', tier: 'bronze' },
      { min: 300, name: 'Guerrero de los JOINs', tier: 'silver' },
      { min: 600, name: 'Caballero de Datos', tier: 'silver' },
      { min: 1000, name: 'Maestro Arquitecto SQL', tier: 'gold' },
      { min: 2000, name: 'Señor del Abismo', tier: 'abyss' },
    ],
    tutor: {
      nombre: 'Tutor de SQL',
      placeholder: 'Preguntame sobre SQL...',
      saludo: '¡Hola! Soy Dagonbot, tu tutor interactivo de SQL 🌟\n\nEstoy aqui para ayudarte a:\n🔍 Resolver dudas sobre consultas\n💡 Entender errores y darte pistas\n📋 Ver ejemplos de codigo SQL\n🎯 Dominar PostgreSQL\n\n¿Sobre que quieres aprender hoy?',
    },
    certificado: {
      escuela: 'Escuela de Sql',
      pie: 'La Academia del Guerrero SQL',
      rol: (esGuerrero) => `${esGuerrero ? 'GUERRERO' : 'ARQUITECTO'} SQL`,
      escuelaLarga: 'La Escuela del Guerrero SQL',
    },
  },
  io: {
    slug: 'io',
    nombre: 'Investigación de Operaciones',
    corto: 'IO',
    icono: Sigma,
    hudTexto: 'Avanza por la Investigación de Operaciones: modela el problema, resuélvelo paso a paso y desbloquea la siguiente zona.',
    cursoPorDefecto: 'Senda IO',
    // La senda se resuelve por posición del curso dentro de la materia.
    sendas: [
      { nombre: 'Senda del Modelador', icono: Sigma },
      { nombre: 'Senda del Estratega', icono: ChartNetwork },
    ],
    missionFocuses: [
      'Traducir el problema a variables, función objetivo y restricciones.',
      'Resolver con orden: tabla, pivote y verificación del resultado.',
      'Interpretar la solución: qué recurso sobra, cuál limita y por qué.',
      'Comparar alternativas con costos, tiempos y probabilidades.',
      'Usar la calculadora para tantear, y razonar el resultado a mano.',
    ],
    titulos: [
      { min: 0, name: 'Aprendiz de Modelos', tier: 'bronze' },
      { min: 100, name: 'Formulador de Restricciones', tier: 'bronze' },
      { min: 300, name: 'Pivoteador Simplex', tier: 'silver' },
      { min: 600, name: 'Analista de Redes', tier: 'silver' },
      { min: 1000, name: 'Estratega Óptimo', tier: 'gold' },
      { min: 2000, name: 'Señor del Óptimo', tier: 'abyss' },
    ],
    tutor: {
      nombre: 'Tutor de IO',
      placeholder: 'Preguntame sobre Investigación de Operaciones...',
      saludo: '¡Hola! Soy Dagonbot, tu tutor de Investigación de Operaciones.\n\nEstoy aqui para ayudarte a:\n- Plantear modelos de programación lineal\n- Entender cada paso del simplex, el transporte o las redes\n- Revisar por que un resultado no cuadra\n- Interpretar la solución óptima\n\n¿Con que problema quieres empezar?',
    },
    certificado: {
      escuela: 'Escuela de Investigación de Operaciones',
      pie: 'La Academia del Estratega',
      rol: () => 'INVESTIGACIÓN DE OPERACIONES',
      escuelaLarga: 'La Escuela del Estratega IO',
    },
  },
};

export const getMateria = (slug) => MATERIAS[slug] || MATERIAS.sql;

// Datos de senda (nombre + icono) para un curso. En 'sql' decide el id_curso; en el resto, la posición.
export const getSenda = (materia, idCurso, indice) => {
  const sendas = getMateria(materia).sendas;
  const pos = materia === 'sql' || !MATERIAS[materia]
    ? (Number(idCurso) === 1 ? 0 : 1)
    : Math.min(Math.max(indice, 0), sendas.length - 1);
  return sendas[pos];
};
