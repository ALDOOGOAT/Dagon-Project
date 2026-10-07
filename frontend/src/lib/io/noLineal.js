import { limpiarResultado } from './util';
import { expresion, evaluar, math } from './formulas';
import { exigir, limpiar, numero, resolverSistema } from './util';
function derivar(node, variable) {
  try { return math.derivative(node, variable); }
  catch (_) { throw new Error(`No se pudo derivar la fórmula respecto de ${variable}.`); }
}
function intervalo(datos) { exigir(datos && typeof datos === 'object', 'Indique una función y un intervalo.'); numero(datos.a, 'El límite inferior'); numero(datos.b, 'El límite superior'); exigir(datos.a < datos.b, 'El límite inferior debe ser menor que el superior.'); }
function seccionDoradaInterno(datos) {
  intervalo(datos); let { a, b } = datos; const { f, tol = 1e-4, objetivo } = datos;
  numero(tol, 'La tolerancia', 0, true); exigir(['min', 'max'].includes(objetivo), 'El objetivo debe ser min o max.');
  const node = expresion(f, ['x']), phi = (Math.sqrt(5) - 1) / 2, signo = objetivo === 'min' ? 1 : -1, iteraciones = [];
  let x1 = b - phi * (b - a), x2 = a + phi * (b - a), f1 = evaluar(node, { x: x1 }), f2 = evaluar(node, { x: x2 });
  while (b - a > tol) {
    exigir(iteraciones.length < 10000, 'La sección dorada no convergió con la tolerancia indicada.');
    iteraciones.push({ a, b, x1, x2, f1, f2 });
    if (signo * f1 <= signo * f2) { b = x2; x2 = x1; f2 = f1; x1 = b - phi * (b - a); f1 = evaluar(node, { x: x1 }); }
    else { a = x1; x1 = x2; f1 = f2; x2 = a + phi * (b - a); f2 = evaluar(node, { x: x2 }); }
  }
  if (!iteraciones.length) iteraciones.push({ a, b, x1, x2, f1, f2 });
  const x = limpiar((a + b) / 2); return { x, fx: limpiar(evaluar(node, { x })), iteraciones };
}
function newtonInterno(datos) {
  exigir(datos && typeof datos === 'object', 'Indique una función y un punto inicial.'); const { f, x0, tol = 1e-6, maxIter = 50 } = datos;
  numero(x0, 'El punto inicial'); numero(tol, 'La tolerancia', 0, true); exigir(Number.isInteger(maxIter) && maxIter > 0 && maxIter <= 10000, 'El máximo de iteraciones debe ser un entero entre 1 y 10000.');
  const node = expresion(f, ['x']), d1node = derivar(node, 'x'), d2node = derivar(d1node, 'x'), iteraciones = [];
  let x = x0, convergio = false;
  for (let k = 0; k < maxIter; k++) {
    const fx = evaluar(node, { x }), d1 = evaluar(d1node, { x }), d2 = evaluar(d2node, { x });
    iteraciones.push({ x: limpiar(x), fx: limpiar(fx), d1: limpiar(d1), d2: limpiar(d2) });
    if (Math.abs(d1) <= tol) { convergio = true; break; }
    exigir(Math.abs(d2) > 1e-12, 'Newton no puede continuar: la segunda derivada es cero.');
    const siguiente = x - d1 / d2; numero(siguiente, 'La siguiente aproximación');
    if (Math.abs(siguiente - x) <= tol && Math.abs(evaluar(d1node, { x: siguiente })) <= tol) { x = siguiente; convergio = true; iteraciones.push({ x: limpiar(x), fx: limpiar(evaluar(node, { x })), d1: limpiar(evaluar(d1node, { x })), d2: limpiar(evaluar(d2node, { x })) }); break; }
    x = siguiente;
  }
  exigir(convergio, 'Newton no convergió; pruebe otro punto inicial o más iteraciones.');
  const d2 = evaluar(d2node, { x });
  let tipo = d2 > 1e-9 ? 'minimo' : d2 < -1e-9 ? 'maximo' : 'inflexion';
  if (Math.abs(d2) <= 1e-9) {
    let derivada = d2node;
    for (let orden = 3; orden <= 12; orden++) {
      derivada = derivar(derivada, 'x'); const valor = evaluar(derivada, { x });
      if (Math.abs(valor) > 1e-9) { tipo = orden % 2 ? 'inflexion' : valor > 0 ? 'minimo' : 'maximo'; break; }
    }
  }
  return { x: limpiar(x), fx: limpiar(evaluar(node, { x })), iteraciones, tipo };
}
function lagrange2Interno(datos) {
  exigir(datos && typeof datos === 'object', 'Indique f, g y c.'); const { f, g, c } = datos; numero(c, 'El valor de la restricción');
  const fn = expresion(f, ['x', 'y']), gn = expresion(g, ['x', 'y']), fx = derivar(fn, 'x'), fy = derivar(fn, 'y'), gx = derivar(gn, 'x'), gy = derivar(gn, 'y');
  const fxx = derivar(fx, 'x'), fxy = derivar(fx, 'y'), fyy = derivar(fy, 'y'), gxx = derivar(gx, 'x'), gxy = derivar(gx, 'y'), gyy = derivar(gy, 'y');
  const semillas = [[c / 2, c / 2, 0], [1, 1, 0], [0, 0, 0], [1, 0, 0], [0, 1, 0], [-1, -1, 0], [c, 1, 1], [1, c, 1], [5, 5, 1]];
  function sistema(v) {
    const [x, y, l] = v, s = { x, y }, ev = node => evaluar(node, s), dx = ev(gx), dy = ev(gy);
    return { F: [ev(fx) - l * dx, ev(fy) - l * dy, ev(gn) - c], J: [[ev(fxx) - l * ev(gxx), ev(fxy) - l * ev(gxy), -dx], [ev(fxy) - l * ev(gxy), ev(fyy) - l * ev(gyy), -dy], [dx, dy, 0]] };
  }
  for (const semilla of semillas) {
    let v = [...semilla];
    try {
      for (let k = 0; k < 100; k++) {
        const { F, J } = sistema(v), norma = Math.max(...F.map(Math.abs));
        if (norma < 1e-8) {
          const s = { x: v[0], y: v[1] }; exigir(Math.hypot(evaluar(gx, s), evaluar(gy, s)) > 1e-10, 'La restricción no es regular en el punto encontrado.');
          return { x: limpiar(v[0]), y: limpiar(v[1]), lambda: limpiar(v[2]), fxy: limpiar(evaluar(fn, s)) };
        }
        const delta = resolverSistema(J, F.map(x => -x));
        let escala = 1, siguiente = v.map((x, i) => x + delta[i]);
        for (let t = 0; t < 20; t++) {
          try { if (Math.max(...sistema(siguiente).F.map(Math.abs)) < norma) break; } catch (_) { /* Reducir el paso si sale del dominio. */ }
          escala /= 2; siguiente = v.map((x, i) => x + escala * delta[i]);
        }
        v = siguiente;
      }
    } catch (_) { /* Probar otra semilla cuando el sistema es singular o sale del dominio. */ }
  }
  throw new Error('El sistema de Lagrange no convergió a un punto estacionario regular. Revise las funciones y la restricción.');
}
function muestrearFuncionInterno(datos) {
  intervalo(datos); const { f, a, b, n = 100 } = datos;
  exigir(Number.isInteger(n) && n >= 2 && n <= 100000, 'El número de muestras debe ser un entero entre 2 y 100000.');
  const node = expresion(f, ['x']);
  return Array.from({ length: n }, (_, i) => { const x = limpiar(a + (b - a) * i / (n - 1)); return { x, y: limpiar(evaluar(node, { x })) }; });
}

export function seccionDorada(datos) { return limpiarResultado(seccionDoradaInterno(datos)); }

export function newton(datos) { return limpiarResultado(newtonInterno(datos)); }

export function lagrange2(datos) { return limpiarResultado(lagrange2Interno(datos)); }

export function muestrearFuncion(datos) { return limpiarResultado(muestrearFuncionInterno(datos)); }
