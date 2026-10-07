import { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Renderiza LaTeX con KaTeX. Con throwOnError:false una fórmula mal escrita se pinta en rojo en vez de romper la página.
export const Formula = ({ latex, bloque = false, className = '' }) => {
  const html = useMemo(
    () => katex.renderToString(String(latex ?? ''), { throwOnError: false, displayMode: bloque, output: 'html' }),
    [latex, bloque]
  );
  const Tag = bloque ? 'div' : 'span';
  return (
    <Tag
      className={`io-formula ${bloque ? 'io-formula--bloque' : ''} ${className}`}
      // El HTML lo genera KaTeX a partir del LaTeX: no se inyecta texto del usuario sin escapar.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Formula;
