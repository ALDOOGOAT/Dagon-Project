import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { ResultadoModelo } from './ResultadoModelo';
import { resolverModeloInterpretado } from '../../lib/io/desdeEnunciado';
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
jest.mock('recharts', () => {
  const React = require('react');
  const E = ({
    children
  }) => React.createElement('div', null, children);
  return Object.fromEntries(['LineChart', 'Line', 'XAxis', 'YAxis', 'Tooltip', 'CartesianGrid', 'ResponsiveContainer', 'Legend', 'ReferenceLine', 'ReferenceDot', 'BarChart', 'Bar', 'Cell', 'ComposedChart', 'Area', 'Scatter'].map(k => [k, E]));
});
test('tableau real muestra base, coeficientes, RHS, razones y pivote en fila/columna cero', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  const solucion = resolverModeloInterpretado({
    tipo: 'pl',
    metodo: 'simplex',
    variables: [{
      simbolo: 'x1',
      nombre: 'Mesas'
    }, {
      simbolo: 'x2',
      nombre: 'Sillas'
    }],
    datos: {
      objetivo: 'max z=3x1+5x2',
      restricciones: ['x1<=4', 'x2<=6', '3x1+2x2<=18', 'x1,x2>=0']
    }
  });
  const primera = solucion.resultado.tablas.find(t => t.pivote);
  expect(primera.pivote).toMatchObject({
    fila: 0,
    col: 0
  });
  try {
    await act(async () => root.render(<ResultadoModelo solucion={{
      ...solucion,
      grafico: null,
      pasos: [{
        texto: 'Primera iteración',
        tabla: primera
      }],
      resultado: {}
    }} />));
    const tabla = host.querySelector('table');
    expect(tabla).not.toBeNull();
    expect(Array.from(tabla.querySelectorAll('thead th')).map(t => t.textContent)).toEqual(['Base', ...primera.encabezados, 'Solución', 'Razón']);
    const filas = tabla.querySelectorAll('tbody tr');
    expect(filas[0].classList.contains('io-fila-pivote')).toBe(true);
    expect(filas[0].querySelector('th').textContent).toBe(primera.filas[0].base);
    expect(filas[0].querySelector('td.io-pivote').textContent).toBe(String(primera.filas[0].valores[0]));
    expect(filas[0].lastElementChild.textContent).toBe(String(primera.razones[0]));
    expect(tabla.querySelector('.io-fila-z').textContent).toContain('Z');
    expect(host.textContent).toContain('Entra x1');
    expect(host.textContent).toContain('sale s_1');
    expect(host.textContent).not.toContain('encabezados');
    expect(host.textContent).not.toContain('rhs');
  } finally {
    await act(async () => root.unmount());
    host.remove();
  }
});
