import {
  BookOpen,
  Code2,
  Lightbulb,
  Quote,
  Sparkles
} from 'lucide-react';

const BlockIcon = ({ type, colors }) => {
  const iconStyle = { color: colors.primary };

  if (type === 'code') return <Code2 className="h-4 w-4" style={iconStyle} />;
  if (type === 'quote') return <Quote className="h-4 w-4" style={iconStyle} />;
  if (type === 'bullets') return <Lightbulb className="h-4 w-4" style={iconStyle} />;
  if (type === 'callout') return <Sparkles className="h-4 w-4" style={iconStyle} />;

  return <BookOpen className="h-4 w-4" style={iconStyle} />;
};

export const BookPage = ({
  page,
  pageNumber,
  side = 'left',
  colors,
  isLight,
  codeStyle
}) => {
  if (!page) {
    return (
      <article className={`book-page book-page--${side}`}>
        <div className="book-page-content book-page-content--empty">
          <p className="book-page-kicker">Fin del capítulo</p>
          <h3 className="book-page-title">Pasa al siguiente comando</h3>
          <p className="book-page-text">
            Terminaste estas páginas. Continúa para abrir el siguiente capítulo del libro.
          </p>
        </div>

        <div className="book-footer">
          <span>Dagon Academy</span>
          <span>{pageNumber}</span>
        </div>
      </article>
    );
  }

  return (
    <article className={`book-page book-page--${side}`}>
      <div className="book-page-content">
        <p className="book-page-kicker">{page.kicker}</p>

        <h3 className="book-page-title">{page.title}</h3>

        {page.subtitle && (
          <p className="book-page-subtitle">{page.subtitle}</p>
        )}

        <div className="book-page-blocks">
          {page.blocks?.map((block, index) => {
            if (block.type === 'paragraph') {
              return (
                <section key={`${page.id}-paragraph-${index}`} className="book-block">
                  {block.title && (
                    <div className="book-block-heading">
                      <BlockIcon type={block.type} colors={colors} />
                      <h4>{block.title}</h4>
                    </div>
                  )}

                  <p className="book-page-text">{block.content}</p>
                </section>
              );
            }

            if (block.type === 'quote') {
              return (
                <section key={`${page.id}-quote-${index}`} className="book-quote">
                  <Quote className="h-5 w-5" style={{ color: colors.primary }} />
                  <p>{block.content}</p>
                </section>
              );
            }

            if (block.type === 'callout') {
              return (
                <section key={`${page.id}-callout-${index}`} className="book-callout">
                  <div className="book-block-heading">
                    <BlockIcon type="callout" colors={colors} />
                    <h4>{block.title || 'Nota'}</h4>
                  </div>

                  <p>{block.content}</p>
                </section>
              );
            }

            if (block.type === 'bullets') {
              return (
                <section key={`${page.id}-bullets-${index}`} className="book-block">
                  {block.title && (
                    <div className="book-block-heading">
                      <BlockIcon type={block.type} colors={colors} />
                      <h4>{block.title}</h4>
                    </div>
                  )}

                  <div className="book-bullets">
                    {block.items?.map((item, itemIndex) => (
                      <div key={`${page.id}-${index}-${itemIndex}`} className="book-bullet">
                        <span>{itemIndex + 1}</span>
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (block.type === 'code') {
              return (
                <section key={`${page.id}-code-${index}`} className="book-code-wrap">
                  <div className="book-block-heading">
                    <BlockIcon type="code" colors={colors} />
                    <h4>{block.label || 'codigo.sql'}</h4>
                  </div>

                  <div className="book-code-block" style={codeStyle}>
                    <div
                      className="book-code-header"
                      style={{
                        borderColor: isLight
                          ? 'rgba(255,232,189,0.14)'
                          : 'rgba(255,255,255,0.08)'
                      }}
                    >
                      <span />
                      <span />
                      <span />
                      <small>{block.label || 'codigo.sql'}</small>
                    </div>

                    <pre>
                      <code>{block.content}</code>
                    </pre>
                  </div>
                </section>
              );
            }

            return null;
          })}
        </div>
      </div>

      <div className="book-footer">
        <span>Dagon Academy</span>
        <span>{pageNumber}</span>
      </div>
    </article>
  );
};