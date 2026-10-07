import { create, all } from 'mathjs';
import { exigir } from './util';
export const math = create(all);
const funciones = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh', 'exp', 'log', 'log10', 'sqrt', 'abs', 'pow']);
export function expresion(texto, variables) {
  exigir(typeof texto === 'string' && texto.trim().length > 0, 'Escriba una fórmula válida.');
  try {
    const node = math.parse(texto);
    node.traverse(n => {
      exigir(['ConstantNode', 'SymbolNode', 'OperatorNode', 'ParenthesisNode', 'FunctionNode'].includes(n.type), 'La fórmula contiene una operación no permitida.');
      if (n.isSymbolNode) exigir(variables.includes(n.name) || funciones.has(n.name) || ['pi', 'e'].includes(n.name), `Símbolo desconocido: ${n.name}.`);
      if (n.isFunctionNode) exigir(n.fn.isSymbolNode && funciones.has(n.fn.name), 'La función no está permitida.');
      if (n.isOperatorNode) exigir(['+', '-', '*', '/', '^'].includes(n.op), 'El operador no está permitido.');
    });
    return node;
  } catch (e) { throw new Error('Fórmula inválida: revise la sintaxis, los símbolos y las operaciones permitidas.'); }
}
export function evaluar(node, scope) {
  try { const x = node.evaluate(scope); exigir(typeof x === 'number' && Number.isFinite(x), 'La fórmula no produce un número real finito.'); return x; }
  catch (e) { throw new Error('No se pudo evaluar la fórmula: compruebe el dominio y que produzca un número real finito.'); }
}
