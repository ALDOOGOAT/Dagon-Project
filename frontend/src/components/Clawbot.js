import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, Send, Code, Sparkles, BookOpen, Database, HelpCircle, Copy, Check, ChevronRight, FileCode, Lightbulb, AlertCircle } from 'lucide-react';
import { DagonMascot } from './DagonMascot';
import apiClient from '../services/apiClient';

export const Clawbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { token } = useAuth(); 
  const { colors } = useTheme(); 
  const isLight = colors.mode === 'light';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: '¡Hola! Soy Dagonbot, tu tutor interactivo de SQL 🌟\n\nEstoy aqui para ayudarte a:\n🔍 Resolver dudas sobre consultas\n💡 Entender errores y darte pistas\n📋 Ver ejemplos de codigo SQL\n🎯 Dominar PostgreSQL\n\n¿Sobre que quieres aprender hoy?'
      }]);
    }
  }, [isOpen, messages.length]);

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {}
  };

  const cleanText = (text) => {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/<\/[^>]*>/g, '')
      .replace(/font-weight:[^;]*;/g, '')
      .replace(/font-semibold/g, '')
      .replace(/font-bold/g, '')
      .replace(/<span[^>]*>/g, '')
      .replace(/<\/span>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/__SQL_BLOCK__/g, '___SQL_BLOCK___')
      .replace(/___END_SQL___/g, '___END_SQL___')
      .replace(/```sql\n([\s\S]*?)```/g, '___SQL_BLOCK___$1___END_SQL___')
      .replace(/```\n([\s\S]*?)```/g, '___SQL_BLOCK___$1___END_SQL___')
      .replace(/```([\s\S]*?)```/g, '___SQL_BLOCK___$1___END_SQL___')
      .replace(/[*]{2,}/g, '')
      .replace(/##\s*/g, '## ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };

  const renderFormattedText = (text, index) => {
    if (!text) return null;
    
    let cleanMessage = text
      .replace(/```sql\n([\s\S]*?)```/g, '___SQL_BLOCK___$1___END_SQL___')
      .replace(/```\n([\s\S]*?)```/g, '___SQL_BLOCK___$1___END_SQL___')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#{1,6}\s*/g, '\n## ')
      .replace(/__SQL_BLOCK__/g, '___SQL_BLOCK___')
      .replace(/___END_SQL___/g, '___END_SQL___');

    const sqlBlockRegex = /___SQL_BLOCK___([\s\S]*?)___END_SQL___/g;
    const parts = cleanMessage.split(sqlBlockRegex);
    
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        const codeContent = part.trim();
        return (
          <div key={`${index}-${i}`} className="my-3 rounded-xl overflow-hidden border border-emerald-500/20 shadow-lg group relative bg-slate-900/90">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2.5 flex items-center justify-between border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-sm"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 shadow-sm"></span>
                </div>
                <span className="ml-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 tracking-wide">
                  <FileCode className="w-3.5 h-3.5" /> SQL
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(codeContent, `${index}-${i}`)}
                className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-slate-700"
              >
                {copiedIndex === `${index}-${i}` ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
            <pre className="bg-slate-950/95 p-4 overflow-x-auto text-[13px] font-mono leading-6">
              <code className="text-emerald-300" dangerouslySetInnerHTML={{ 
                __html: syntaxHighlight(codeContent) 
              }} />
            </pre>
          </div>
        );
      }
      
      const lines = part.split('\n');
      return lines.map((line, lineIdx) => {
        line = line.trim();
        if (!line) return <br key={`${index}-line-${lineIdx}`} />;
        
        if (line.startsWith('## ')) {
          return (
            <h4 key={`${index}-h-${lineIdx}`} className="mt-5 mb-2 text-base font-bold text-emerald-400 flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              {line.replace('## ', '')}
            </h4>
          );
        }
        
        if (line.includes('SQL') && (line.length < 30)) {
          return (
            <div key={`${index}-sql-${lineIdx}`} className="mt-3 mb-1 flex items-center gap-2 text-xs font-medium text-cyan-400">
              <Database className="w-3.5 h-3.5" />
              <span>{line}</span>
            </div>
          );
        }
        
        if (line.includes('Ejemplo') || line.includes('ejemplo')) {
          return (
            <div key={`${index}-ex-${lineIdx}`} className="mt-4 mb-2 flex items-center gap-2 text-sm font-semibold text-amber-400">
              <BookOpen className="w-4 h-4" />
              <span>{line}</span>
            </div>
          );
        }
        
        if (line.includes('Aviso') || line.includes('Avisos') || line.includes('ERROR') || line.includes('PISTA')) {
          return (
            <div key={`${index}-tip-${lineIdx}`} className="mt-3 mb-2 px-3 py-2 bg-amber-500/10 border-l-2 border-amber-400 rounded-r flex items-start gap-2 text-amber-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{line}</span>
            </div>
          );
        }
        
        if (line.length < 50 && (line.includes('¿') || line.includes('?'))) {
          return (
            <div key={`${index}-q-${lineIdx}`} className="mt-3 mb-2 flex items-start gap-2 text-purple-300 font-medium">
              <HelpCircle className="w-4 h-4 mt-0.5" />
              <span>{line}</span>
            </div>
          );
        }
        
        if (line.includes('Con') && line.includes(':')) {
          return (
            <div key={`${index}-c-${lineIdx}`} className="mt-2 mb-1 flex items-start gap-2 text-slate-300 text-sm">
              <Lightbulb className="w-3.5 h-3.5 mt-1 text-cyan-400 flex-shrink-0" />
              <span>{line}</span>
            </div>
          );
        }

        if (line.length > 100) {
          return (
            <p key={`${index}-p-${lineIdx}`} className="mt-2 mb-2 text-slate-300 leading-relaxed text-sm">
              {line}
            </p>
          );
        }
        
        return line ? (
          <span key={`${index}-s-${lineIdx}`} className="block text-slate-300 text-sm mb-1">{line}</span>
        ) : <br key={lineIdx} />;
      });
    });
  };

  const syntaxHighlight = (sql) => {
    if (!sql) return '';
    let cleanSql = sql
      .replace(/<[^>]*>/g, '')
      .replace(/font-[^;]+;/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    
    let highlighted = cleanSql
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 1. PROTEGEMOS LOS STRINGS Y NÚMEROS ANTES DE PONER ETIQUETAS HTML
    highlighted = highlighted.replace(/('(?:[^'\\]|\\')*')/g, '___STR___$1___ENDSTR___');
    highlighted = highlighted.replace(/\b(\d+)\b/g, '___NUM___$1___ENDNUM___');
    
    // 2. COLOREAMOS LAS PALABRAS CLAVE DE SQL
    const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'IS', 'NULL', 'ORDER', 'BY', 'ASC', 'DESC', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'INDEX', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'COALESCE', 'IF', 'NULLIF', 'EXISTS', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'LIKE', 'IN', 'BETWEEN'];
    
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="text-cyan-400 font-semibold">$1</span>');
    });
    
    // 3. RESTAURAMOS LOS STRINGS Y NÚMEROS YA CON SU HTML SEGURO
    highlighted = highlighted.replace(/___STR___([\s\S]*?)___ENDSTR___/g, '<span class="text-yellow-300">$1</span>');
    highlighted = highlighted.replace(/___NUM___([\s\S]*?)___ENDNUM___/g, '<span class="text-orange-400">$1</span>');
    
    return highlighted;
  };

  const suggestedQuestions = [
    { icon: Database, text: 'Como funciona JOIN?', topic: 'join' },
    { icon: Code, text: 'Ejemplo de SELECT', topic: 'select' },
    { icon: Lightbulb, text: 'ORDER BY vs GROUP BY', topic: 'group vs order' },
    { icon: HelpCircle, text: 'Que es NULL?', topic: 'null' },
  ];

  const handleSuggestedQuestion = (topic) => {
    const questions = {
      'join': '¿Como funciona el JOIN en SQL? Dame un ejemplo.',
      'select': '¿Como uso SELECT con WHERE?',
      'group vs order': '¿Cual es la diferencia entre ORDER BY y GROUP BY?',
      'null': '¿Como trabajar con valores NULL?'
    };
    setInputMessage(questions[topic]);
  };

  if (!token) return null;

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const response = await apiClient.post('/api/clawbot/chat', {
        mensaje: userMessage,
        historial: messages
      });

      const data = response.data;
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Clawbot no pudo responder ahora. Usa las pistas locales y vuelve a intentar en un momento.';
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: errorMessage }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="clawbot-fab"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-14 h-14 sm:w-16 sm:h-16 rounded-full transition-all duration-300 flex items-center justify-center group animate-pulse-glow hover:scale-110 z-50 border"
        style={{
          background: isLight
            ? 'linear-gradient(145deg, rgba(255,248,238,0.96) 0%, rgba(240,219,182,0.94) 100%)'
            : 'linear-gradient(145deg, rgba(5,150,105,1) 0%, rgba(14,116,144,1) 100%)',
          borderColor: isLight ? 'rgba(198,122,29,0.28)' : 'rgba(52,211,153,0.24)',
          boxShadow: isLight
            ? '0 18px 40px -18px rgba(166, 98, 29, 0.42), inset 0 1px 0 rgba(255,255,255,0.55)'
            : '0 0 30px rgba(16,185,129,0.5)'
        }}
      >
        {isOpen ? (
          <X className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 rotate-90" style={{ color: isLight ? '#6f4b22' : '#ffffff' }} />
        ) : (
          <div className="relative">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 transition-transform duration-300 group-hover:scale-110" style={{ color: isLight ? '#7c5318' : '#ffffff' }} />
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
              style={{
                backgroundColor: isLight ? '#d99a4e' : '#22d3ee',
                boxShadow: isLight ? '0 0 14px rgba(217,154,78,0.55)' : '0 0 15px rgba(34,211,238,0.8)'
              }}
            />
          </div>
        )}
      </button>

      {isOpen && (
        <>
        <button
          type="button"
          aria-label="Cerrar Dagonbot"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-[2px] sm:bg-slate-950/30"
        />
        <div
          data-testid="clawbot-panel"
          className="fixed inset-x-3 top-4 bottom-20 sm:inset-x-auto sm:top-auto sm:bottom-24 sm:right-6 sm:w-[450px] sm:h-[720px] sm:max-h-[calc(100dvh-8rem)] rounded-[28px] sm:rounded-3xl shadow-2xl flex flex-col border overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 mobile-safe-bottom"
          style={{
            backgroundColor: isLight ? 'rgba(255, 250, 242, 0.94)' : colors.background,
            borderColor: colors.border,
            boxShadow: isLight
              ? '0 32px 90px -38px rgba(101, 67, 33, 0.45)'
              : undefined
          }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ 
            background: isLight
              ? 'linear-gradient(180deg, rgba(198,122,29,0.12) 0%, rgba(255,255,255,0) 24%, rgba(217,154,78,0.08) 100%)'
              : `linear-gradient(to bottom, ${colors.primary}20, transparent, ${colors.secondary}20)` 
          }} />
          
          <div className="relative z-10 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border-b" style={{ 
            background: isLight ? 'linear-gradient(180deg, rgba(255,248,238,0.98), rgba(255,244,227,0.9))' : colors.surface, 
            borderColor: colors.border 
          }}>
            <div className="relative">
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg border"
                style={{
                  background: isLight
                    ? 'linear-gradient(145deg, rgba(250,235,210,1) 0%, rgba(231,205,156,1) 100%)'
                    : 'linear-gradient(145deg, rgba(16,185,129,1) 0%, rgba(8,145,178,1) 100%)',
                  borderColor: isLight ? 'rgba(198,122,29,0.24)' : 'rgba(52,211,153,0.3)',
                  boxShadow: isLight ? '0 14px 30px -18px rgba(198,122,29,0.45)' : undefined
                }}
              >
                <DagonMascot size="medium" mood="excited" />
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 animate-pulse"
                style={{
                  backgroundColor: isLight ? '#c67a1d' : '#34d399',
                  borderColor: isLight ? '#fff8ee' : '#0f172a'
                }}
              />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl tracking-wide flex items-center gap-2" style={{ color: isLight ? '#352517' : '#ffffff' }}>
                Dagonbot <span className="text-xs" style={{ color: isLight ? '#a16207' : '#34d399' }}>AI</span>
              </h3>
              <p className="text-xs font-semibold flex items-center gap-2" style={{ color: isLight ? '#8b6f4e' : '#94a3b8' }}>
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: isLight ? '#c67a1d' : '#34d399' }}></span>
                Tutor de SQL
              </p>
            </div>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto p-3 sm:p-4 space-y-3" style={{ backgroundColor: isLight ? 'rgba(255,250,244,0.55)' : `${colors.background}80` }} data-testid="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-200`}
              >
                <div
                  className={`max-w-[96%] sm:max-w-[92%] p-3 sm:p-4 rounded-2xl shadow-lg ${
                    msg.role === 'user'
                      ? 'text-white font-medium rounded-br-md'
                      : 'border rounded-bl-md'
                  }`}
                  style={{
                    background: msg.role === 'user' 
                      ? (isLight
                        ? 'linear-gradient(135deg, #b8731d 0%, #d6b45a 100%)'
                        : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`)
                      : (isLight ? 'rgba(255, 247, 236, 0.96)' : colors.surface),
                    borderColor: colors.border,
                    color: msg.role === 'user' ? '#fffefb' : colors.text,
                    boxShadow: isLight && msg.role !== 'user'
                      ? '0 16px 34px -26px rgba(101,67,33,0.32)'
                      : undefined
                  }}
                >
                  <div className="text-[14px] whitespace-pre-wrap leading-relaxed font-['Manrope','Segoe_UI',sans-serif]" style={{ fontFamily: 'Manrope, Segoe UI, system-ui, sans-serif' }}>
                    {renderFormattedText(msg.content, index)}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div
                  className="p-4 rounded-2xl rounded-bl-md flex items-center gap-3 border shadow-lg"
                  style={{
                    backgroundColor: isLight ? 'rgba(255,247,236,0.96)' : 'rgba(15,23,42,0.8)',
                    borderColor: colors.border,
                    color: isLight ? '#5f4a31' : '#cbd5e1'
                  }}
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '0ms', backgroundColor: isLight ? '#c67a1d' : '#34d399' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '150ms', backgroundColor: isLight ? '#c67a1d' : '#34d399' }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ animationDelay: '300ms', backgroundColor: isLight ? '#c67a1d' : '#34d399' }} />
                  </div>
                  <span className="text-sm font-semibold tracking-wide" style={{ color: isLight ? '#8b6f4e' : '#94a3b8' }}>Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-3 sm:px-4 pb-1 sm:pb-2">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: isLight ? '#8b6f4e' : '#64748b' }}>Sugerencias</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(sq.topic)}
                    className="px-3 py-1.5 border rounded-lg text-xs transition-all flex items-center gap-1.5"
                    style={{
                      backgroundColor: isLight ? 'rgba(255,247,236,0.92)' : 'rgba(30,41,59,0.5)',
                      borderColor: isLight ? 'rgba(198,122,29,0.16)' : 'rgba(51,65,85,0.5)',
                      color: isLight ? '#6f573c' : '#cbd5e1'
                    }}
                  >
                    <sq.icon className="w-3 h-3" style={{ color: isLight ? '#c67a1d' : '#34d399' }} />
                    {sq.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative z-10 p-3 sm:p-4 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.3)]" style={{ backgroundColor: isLight ? 'rgba(255,248,238,0.96)' : colors.background, borderColor: colors.border }}>
            <div className="flex items-end gap-2 sm:gap-3">
              <Input
                data-testid="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Preguntame sobre SQL..."
                className="h-12 flex-1 rounded-xl shadow-inner font-medium"
                style={{
                  backgroundColor: isLight ? 'rgba(255,255,255,0.8)' : colors.surface,
                  borderColor: colors.border,
                  color: colors.text
                }}
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                data-testid="send-message-button"
                disabled={loading || !inputMessage.trim()}
                className="h-12 shrink-0 text-white rounded-xl px-3 sm:px-4 transition-all duration-300 shadow-md disabled:opacity-50"
                style={{
                  background: isLight
                    ? 'linear-gradient(135deg, #b8731d 0%, #d6b45a 100%)'
                    : 'linear-gradient(90deg, #059669 0%, #0891b2 100%)'
                }}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
};
