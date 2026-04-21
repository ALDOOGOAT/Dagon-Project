import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, X, Send, Loader, Terminal, Code, Sparkles, Zap, BookOpen, Database, HelpCircle, Copy, Check } from 'lucide-react';
import { DagonMascot } from './DagonMascot';

export const Clawbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { token } = useAuth(); 

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
        content: '¡Hola! Soy Dagonbot 🎮, tu tutor interactivo de SQL.\n\nEstoy aquí para ayudarte a:\n🔍 **Resolver dudas** sobre consultas\n💡 **Entender errores** y darte pistas\n📋 **Ver ejemplos** de código SQL\n🎯 **Dominar** PostgreSQL\n\n¿ Sobre qué quieres aprender hoy?'
      }]);
    }
  }, [isOpen, messages.length]);

  const copyToClipboard = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  const renderFormattedText = (text, index) => {
    if (!text) return null;
    
    const codeBlockRegex = /```sql\n([\s\S]*?)```/g;
    const parts = text.split(codeBlockRegex);
    
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        const codeContent = part.trim();
        return (
          <div key={`${index}-${i}`} className="my-4 rounded-xl overflow-hidden border border-cyan-500/30 shadow-[0_0_25px_rgba(34,211,238,0.15)] group relative">
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 px-4 py-2 flex items-center justify-between border-b border-slate-800/50">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                <span className="ml-3 flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
                  <Code className="w-3 h-3" /> SQL Query
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(codeContent, `${index}-${i}`)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-slate-800"
              >
                {copiedIndex === `${index}-${i}` ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
            <pre className="bg-slate-950/80 p-4 overflow-x-auto text-[13px] font-mono leading-relaxed">
              <code className="text-emerald-300" dangerouslySetInnerHTML={{ 
                __html: syntaxHighlight(codeContent) 
              }} />
            </pre>
          </div>
        );
      }
      
      const lines = part.split('\n');
      return lines.map((line, lineIdx) => {
        if (line.includes('📋') || line.includes('Ejemplo')) {
          return (
            <div key={`${index}-line-${lineIdx}`} className="mt-3 mb-2 flex items-start gap-2 text-amber-300 text-sm font-semibold">
              <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{line.replace('📋', '').replace('Ejemplo:', '')}</span>
            </div>
          );
        }
        if (line.includes('💡') || line.includes('Tip:')) {
          return (
            <div key={`${index}-line-${lineIdx}`} className="mt-2 mb-2 flex items-start gap-2 text-purple-300 text-sm">
              <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{line.replace('💡', '')}</span>
            </div>
          );
        }
        if (line.includes('🎯') || line.includes('PISTA')) {
          return (
            <div key={`${index}-line-${lineIdx}`} className="mt-3 mb-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2 text-amber-200 text-sm font-semibold">
              <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{line.replace('🎯', '').replace('PISTA', '')}</span>
            </div>
          );
        }
        return line ? <span key={`${index}-line-${lineIdx}`} className="block">{line}</span> : <br key={lineIdx} />;
      });
    });
  };

  const syntaxHighlight = (sql) => {
    return sql
      .replace(/\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|OUTER|ON|AND|OR|NOT|IS|NULL|ORDER|BY|ASC|DESC|GROUP|HAVING|LIMIT|OFFSET|AS|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DISTINCT|COUNT|SUM|AVG|MAX|MIN)\b/gi, 
        '<span class="text-cyan-400 font-bold">$1</span>')
      .replace(/\bWHERE\b/gi, '<span class="text-purple-400 font-bold">WHERE</span>')
      .replace(/('(?:[^'\\]|\\')*')/g, '<span class="text-yellow-300">$1</span>')
      .replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>');
  };

  const suggestedQuestions = [
    { icon: Database, text: '¿Cómo funciona JOIN?', topic: 'join' },
    { icon: Code, text: 'Ejemplo de SELECT', topic: 'select' },
    { icon: Zap, text: 'ORDER BY vs GROUP BY', topic: 'group vs order' },
    { icon: HelpCircle, text: 'Qué es NULL?', topic: 'null' },
  ];

  const handleSuggestedQuestion = (topic) => {
    const questions = {
      'join': '¿Cómo funciona el JOIN en SQL? Dame un ejemplo.',
      'select': '¿Cómo uso SELECT con WHERE?',
      'group vs order': '¿Cuál es la diferencia entre ORDER BY y GROUP BY?',
      'null': '¿Cómo trabajar con valores NULL?'
    };
    setInputMessage(questions[topic]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/clawbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          mensaje: userMessage,
          historial: messages 
        })
      });

      if (!response.ok) throw new Error('Error de conexión');

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '¡Ups! Mis circuitos están procesando algo. Intenta de nuevo en un momento. 😅' }
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-emerald-600 to-cyan-700 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_50px_rgba(16,185,129,0.8)] transition-all duration-300 flex items-center justify-center group animate-pulse-glow hover:scale-110 z-50"
      >
        {isOpen ? (
          <X className="w-8 h-8 text-white transition-transform duration-300 rotate-90" />
        ) : (
          <div className="relative">
            <Sparkles className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
          </div>
        )}
      </button>

      {isOpen && (
        <div
          data-testid="clawbot-panel"
          className="fixed bottom-24 right-6 w-[420px] h-[700px] bg-slate-950 rounded-3xl shadow-2xl flex flex-col border border-slate-800/50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-cyan-900/20 pointer-events-none" />
          
          <div className="relative z-10 bg-gradient-to-r from-slate-900 to-slate-950 p-4 flex items-center gap-4 border-b border-slate-800/50">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
                <DagonMascot size="medium" mood="excited" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-black text-xl tracking-wide flex items-center gap-2">
                Dagonbot <span className="text-emerald-400 text-xs">IA</span>
              </h3>
              <p className="text-slate-400 text-xs font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Tutor de SQL
              </p>
            </div>
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50" data-testid="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-200`}
              >
                <div
                  className={`max-w-[90%] p-4 rounded-2xl shadow-lg ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-emerald-600 to-cyan-600 text-white font-medium rounded-br-md'
                      : 'bg-slate-900/80 text-slate-200 border border-slate-800 rounded-bl-md'
                  }`}
                >
                  <div className="text-[14px] whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {renderFormattedText(msg.content, index)}
                  </div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-slate-900/80 text-slate-200 p-4 rounded-2xl rounded-bl-md flex items-center gap-3 border border-slate-800 shadow-lg">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm font-semibold tracking-wide text-slate-400">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-2">Sugerencias</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((sq, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(sq.topic)}
                    className="px-3 py-1.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/30 rounded-lg text-xs text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <sq.icon className="w-3 h-3 text-emerald-400" />
                    {sq.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative z-10 p-4 border-t border-slate-800/50 bg-slate-950 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
            <div className="flex gap-3 relative">
              <Input
                data-testid="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntame sobre SQL..."
                className="bg-slate-900 border-slate-700 text-slate-200 focus:border-emerald-500 pr-14 h-12 rounded-xl shadow-inner placeholder:text-slate-600"
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                data-testid="send-message-button"
                disabled={loading || !inputMessage.trim()}
                className="absolute right-1 top-1 bottom-1 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg px-4 transition-all duration-300 shadow-md h-10 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};