import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { TabEnunciado } from './TabEnunciado';
import apiClient from '../../services/apiClient';
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  }
}));
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#f59e0b',
      secondary: '#8b5cf6',
      accent: '#38bdf8',
      text: '#fff',
      textMuted: '#aaa',
      surface: '#111',
      border: '#333'
    }
  })
}));
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}));
jest.mock('./GraficoPL', () => ({
  GraficoPL: ({
    grafico
  }) => <div role="img" aria-label="Región factible y óptimo">Óptimo {grafico.optimo.z}</div>
}));
jest.mock('./RedProyecto', () => ({
  RedProyecto: () => null
}));
jest.mock('recharts', () => {
  const React = require('react');
  const Element = ({
    children
  }) => React.createElement('div', null, children);
  return Object.fromEntries(['LineChart', 'Line', 'XAxis', 'YAxis', 'Tooltip', 'CartesianGrid', 'ResponsiveContainer', 'Legend', 'ReferenceLine', 'ReferenceDot', 'BarChart', 'Bar', 'Cell', 'ComposedChart', 'Area', 'Scatter'].map(k => [k, Element]));
});
const modelo = {
  tipo: 'pl',
  metodo: 'simplex',
  variables: [{
    simbolo: 'x1',
    nombre: 'Mesas',
    unidad: 'unidades'
  }, {
    simbolo: 'x2',
    nombre: 'Sillas',
    unidad: 'unidades'
  }],
  datos: {
    objetivo: 'max z=3x1+5x2',
    restricciones: ['x1<=4', 'x2<=6', '3x1+2x2<=18', 'x1,x2>=0']
  },
  evidencias: [{
    campo: 'objetivo',
    texto: 'Cada mesa deja 3 pesos y cada silla 5 pesos.'
  }]
};
const listo = {
  estado: 'listo',
  fuente: 'local',
  resumen: 'Producción de mesas y sillas',
  modelo,
  preguntas: [],
  advertencias: [],
  supuestos: ['Las cantidades son continuas.']
};
const texto = 'Una empresa produce mesas y sillas para maximizar su utilidad con capacidades limitadas.';
let host, root;
const escribir = async (selector, valor) => {
  const input = host.querySelector(selector);
  await act(async () => {
    Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set.call(input, valor);
    input.dispatchEvent(new Event('input', {
      bubbles: true
    }));
    input.dispatchEvent(new Event('change', {
      bubbles: true
    }));
  });
};
const enviar = async () => act(async () => host.querySelector('form').dispatchEvent(new Event('submit', {
  bubbles: true,
  cancelable: true
})));
beforeEach(() => {
  jest.clearAllMocks();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
test('enunciado listo calcula Z=36, dibuja gráfico y permite editar y recalcular', async () => {
  apiClient.post.mockResolvedValue({
    data: listo
  });
  await act(async () => root.render(<TabEnunciado />));
  await escribir('textarea', texto);
  await enviar();
  expect(host.textContent).toContain('36');
  expect(host.querySelector('[role="img"]')).not.toBeNull();
  expect(host.textContent).toContain('Mesas');
  expect(host.textContent).toContain('Cada mesa deja');
  await escribir('#modelo-objetivo', 'max z=3x1+4x2');
  expect(host.querySelector('[data-testid="solucion-enunciado"]')).toBeNull();
  await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Recalcular modelo').dispatchEvent(new MouseEvent('click', {
    bubbles: true
  })));
  expect(host.querySelector('[data-testid="solucion-enunciado"]').textContent).toContain('30');
  expect(apiClient.post).toHaveBeenCalledTimes(1);
});
test('incompleto conserva el enunciado, presenta preguntas y no ejecuta solver', async () => {
  apiClient.post.mockResolvedValue({
    data: {
      estado: 'incompleto',
      modelo: null,
      resumen: 'Falta capacidad',
      preguntas: ['¿Cuántas horas de acabado hay disponibles?'],
      advertencias: [],
      supuestos: []
    }
  });
  await act(async () => root.render(<TabEnunciado />));
  await escribir('textarea', texto);
  await enviar();
  expect(host.textContent).toContain('¿Cuántas horas');
  expect(host.querySelector('textarea').value).toBe(texto);
  expect(host.querySelector('[data-testid="solucion-enunciado"]')).toBeNull();
});
test('API caída presenta acceso a métodos manuales sin fingir extracción', async () => {
  const manual = jest.fn();
  apiClient.post.mockRejectedValue(new Error('Network Error'));
  await act(async () => root.render(<TabEnunciado onManual={manual} />));
  await escribir('textarea', texto);
  await enviar();
  expect(host.querySelector('[role="alert"]').textContent).toContain('No se pudo conectar');
  expect(host.querySelector('#modelo-objetivo')).toBeNull();
  await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Abrir métodos manuales').dispatchEvent(new MouseEvent('click', {
    bubbles: true
  })));
  expect(manual).toHaveBeenCalledWith('pl');
});
test('editar el texto cancela e ignora una respuesta tardía', async () => {
  let resolver;
  apiClient.post.mockReturnValue(new Promise(r => {
    resolver = r;
  }));
  await act(async () => root.render(<TabEnunciado />));
  await escribir('textarea', texto);
  await act(async () => {
    host.querySelector('form').dispatchEvent(new Event('submit', {
      bubbles: true,
      cancelable: true
    }));
  });
  const signal = apiClient.post.mock.calls[0][2].signal;
  await escribir('textarea', texto + ' Datos corregidos.');
  expect(signal.aborted).toBe(true);
  await act(async () => resolver({
    data: listo
  }));
  expect(host.querySelector('#modelo-objetivo')).toBeNull();
  expect(host.querySelector('[data-testid="solucion-enunciado"]')).toBeNull();
  expect(host.textContent).not.toContain('Analizando el problema…');
});
test('cancelar análisis conserva texto y descarta la respuesta que llega después', async () => {
  let resolver;
  apiClient.post.mockReturnValue(new Promise(r => { resolver = r; }));
  await act(async () => root.render(<TabEnunciado />));
  await escribir('textarea', texto);
  await act(async () => host.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  const signal = apiClient.post.mock.calls[0][2].signal;
  await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Cancelar análisis').click());
  expect(signal.aborted).toBe(true);
  expect(host.querySelector('textarea').value).toBe(texto);
  await act(async () => resolver({ data: listo }));
  expect(host.querySelector('[data-testid="solucion-enunciado"]')).toBeNull();
  expect(host.textContent).not.toContain('Analizando el problema…');
});
test('los accesos al modelo y la solución desplazan y enfocan su región', async () => {
  const desplazamiento = jest.fn();
  const anterior = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = desplazamiento;
  try {
    apiClient.post.mockResolvedValue({ data: listo });
    await act(async () => root.render(<TabEnunciado />));
    await escribir('textarea', texto);
    await enviar();
    await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Ver solución').click());
    expect(document.activeElement.getAttribute('aria-label')).toBe('Solución calculada');
    await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Revisar modelo').click());
    expect(document.activeElement.getAttribute('aria-label')).toBe('Modelo del problema');
    expect(desplazamiento).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' });
  } finally {
    HTMLElement.prototype.scrollIntoView = anterior;
  }
});
test('un modelo editado inválido muestra error y admite corregir números sin resultados viejos', async () => {
  const inventario = {
    tipo: 'inventarios',
    metodo: 'eoq',
    variables: [{
      simbolo: 'Q',
      nombre: 'Unidades por pedido'
    }],
    datos: {
      D: 1200,
      S: 50,
      H: 2
    },
    evidencias: []
  };
  apiClient.post.mockResolvedValue({
    data: {
      ...listo,
      modelo: inventario
    }
  });
  await act(async () => root.render(<TabEnunciado />));
  await escribir('textarea', texto);
  await enviar();
  expect(host.querySelector('[data-testid="solucion-enunciado"]')).not.toBeNull();
  await escribir('#modelo-H', '');
  await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Recalcular modelo').dispatchEvent(new MouseEvent('click', {
    bubbles: true
  })));
  expect(host.querySelector('[role="alert"]')).not.toBeNull();
  expect(host.querySelector('[data-testid="solucion-enunciado"]')).toBeNull();
  await escribir('#modelo-H', '4');
  await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Recalcular modelo').dispatchEvent(new MouseEvent('click', {
    bubbles: true
  })));
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.querySelector('[data-testid="solucion-enunciado"]').textContent).toContain('173.205');
  await escribir('textarea', texto + ' Cambié los costos.');
  expect(host.querySelector('[data-testid="solucion-enunciado"]')).toBeNull();
  expect(host.querySelector('#modelo-H')).toBeNull();
});
