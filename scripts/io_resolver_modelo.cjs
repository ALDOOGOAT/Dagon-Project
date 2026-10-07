// Puente de verificación: ejecuta los solvers reales, sin navegador ni respuesta IA.
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../frontend');
const lib = path.join(root, 'src/lib/io') + path.sep;
const babel = require(path.join(root, 'node_modules/@babel/core'));
const original = require.extensions['.js'];
require.extensions['.js'] = (module, filename) => {
  if (!filename.startsWith(lib)) return original(module, filename);
  const result = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    plugins: [require(path.join(root, 'node_modules/@babel/plugin-transform-modules-commonjs'))],
  });
  module._compile(result.code, filename);
};
try {
  const modelo = JSON.parse(fs.readFileSync(0, 'utf8'));
  const { resolverModeloInterpretado } = require(path.join(lib, 'desdeEnunciado.js'));
  const result = resolverModeloInterpretado(modelo);
  process.stdout.write(JSON.stringify(result, (_, value) =>
    typeof value === 'number' && !Number.isFinite(value) ? String(value) : value));
} catch (error) {
  process.stderr.write(error.message + '\n');
  process.exitCode = 1;
}
