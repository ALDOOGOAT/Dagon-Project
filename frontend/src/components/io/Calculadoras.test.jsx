import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { TabPL } from './TabPL';
import { TabTransporte } from './TabTransporte';
import { TabAsignacion } from './TabAsignacion';
import { TabInventarios } from './TabInventarios';
import { TabRedes } from './TabRedes';
import { TabModelos } from './TabModelos';
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
let host, root;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
test.each([['PL', TabPL, {}, 'Resolver', '36'], ['Transporte', TabTransporte, {}, 'Resolver', null], ['Asignación', TabAsignacion, {}, 'Resolver', null], ['Inventarios', TabInventarios, {}, 'Calcular', '894'], ['CPM', TabRedes, {}, 'Resolver', '13'], ['Colas', TabModelos, {
  tipo: 'colas'
}, 'Resolver', '0.6667'], ['Markov', TabModelos, {
  tipo: 'markov'
}, 'Resolver', '0.6'], ['No lineal', TabModelos, {
  tipo: 'noLineal'
}, 'Resolver', '2']])('%s resuelve el ejemplo inicial sin romper su vista', async (nombre, Componente, props, texto, esperado) => {
  await act(async () => root.render(<Componente {...props} />));
  const boton = Array.from(host.querySelectorAll('button')).find(b => b.textContent.includes(texto) && !b.textContent.includes('Ejemplo'));
  expect(boton).toBeDefined();
  await act(async () => boton.dispatchEvent(new MouseEvent('click', {
    bubbles: true
  })));
  expect(host.querySelector('[role="alert"]')).toBeNull();
  expect(host.querySelector('table') || host.querySelector('dl')).not.toBeNull();
  if (esperado) expect(host.textContent).toContain(esperado);
});
test('Gran M, PERT y variantes de inventarios renderizan procedimientos', async () => {
  const casos = [[TabPL, 'Ejemplo min (Gran M)', 'Resolver'], [TabRedes, 'PERT', 'Resolver'], [TabInventarios, 'EOQ con faltantes', 'Calcular'], [TabInventarios, 'Lote de producción (EPQ)', 'Calcular'], [TabInventarios, 'Descuentos por cantidad', 'Calcular'], [TabInventarios, 'Punto de reorden', 'Calcular'], [TabInventarios, 'Revisión periódica', 'Calcular']];
  for (const [Componente, elegir, resolver] of casos) {
    await act(async () => root.render(<Componente key={elegir} />));
    const botones = () => Array.from(host.querySelectorAll('button'));
    const metodo = botones().find(b => b.textContent.includes(elegir));
    expect(metodo).toBeDefined();
    await act(async () => metodo.dispatchEvent(new MouseEvent('click', {
      bubbles: true
    })));
    await act(async () => botones().find(b => b.textContent === resolver).dispatchEvent(new MouseEvent('click', {
      bubbles: true
    })));
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.querySelector('dl')).not.toBeNull();
  }
});
test('Newton y Lagrange muestran el punto estacionario con su alcance', async () => {
  await act(async () => root.render(<TabModelos tipo="noLineal" />));
  const select = host.querySelector('select');
  for (const metodo of ['newton', 'lagrange']) {
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, metodo);
      select.dispatchEvent(new Event('change', {
        bubbles: true
      }));
    });
    await act(async () => Array.from(host.querySelectorAll('button')).find(b => b.textContent === 'Resolver').dispatchEvent(new MouseEvent('click', {
      bubbles: true
    })));
    expect(host.querySelector('[role="alert"]')).toBeNull();
    expect(host.textContent).toContain(metodo === 'newton' ? 'local' : 'No garantiza óptimo global');
  }
});
