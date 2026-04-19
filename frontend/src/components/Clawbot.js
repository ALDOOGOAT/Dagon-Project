import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, X, Send, Loader, Terminal } from 'lucide-react';
import { DagonMascot } from './DagonMascot';

export const Clawbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  const { token } = useAuth(); 

  // EL RENDERIZADOR MEJORADO: Transforma las comillas en Terminales Hacker
  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/```/g);
    
    return parts.map((part, index) => {
      // Si es texto normal
      if (index % 2 === 0) {
        return <span key={index}>{part}</span>;
      } else {
        // Si es Arte ASCII o Código SQL
        const codeContent = part.replace(/^[a-z]*\n/i, ''); // Limpia la palabra oculta
        return (
          <div key={index} className="my-4 rounded-xl overflow-hidden border border-slate-700 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <div className="bg-slate-900 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
              <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
              <span className="ml-2 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Terminal className="w-3 h-3" /> Terminal Dagon
              </span>
            </div>
            <pre className="bg-slate-950 p-4 overflow-x-auto text-[13px] font-mono text-emerald-400 leading-relaxed">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      }
    });
  };

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
        content: '¡Hola! Soy Dagonbot, tu tutor de SQL. ¿En qué puedo ayudarte hoy?'
      }]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/clawbot/chat', {
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
        { role: 'assistant', content: 'Lo siento, mis circuitos están procesando una anomalía. Intenta de nuevo.' }
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.8)] transition-all duration-300 flex items-center justify-center group animate-pulse-glow hover:scale-105"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? (
          <X className="w-8 h-8 text-white transition-transform duration-300 rotate-90" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-8 h-8 text-white transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
          </div>
        )}
      </button>

      {isOpen && (
        <div
          data-testid="clawbot-panel"
          className="fixed bottom-24 right-6 w-[400px] h-[650px] glass-card-apple rounded-2xl shadow-2xl flex flex-col border border-slate-700/50 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300"
          style={{ zIndex: 9999 }}
        >
          {/* Cabecera del Chat */}
          <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 p-4 flex items-center gap-4 shadow-lg relative overflow-hidden">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner relative z-10">
              <DagonMascot size="small" mood="happy" />
            </div>
            <div className="relative z-10">
              <h3 className="text-white font-black text-xl tracking-wide flex items-center gap-2">
                Dagonbot <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              </h3>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">Tutor IA de Dagon</p>
            </div>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-slate-900/60" data-testid="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-xl ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium rounded-br-sm'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/50 backdrop-blur-md rounded-bl-sm'
                  }`}
                >
                  <div className="text-[14px] whitespace-pre-wrap leading-relaxed" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {renderFormattedText(msg.content)}
                  </div>
                  
                  {msg.role === 'assistant' && msg.content.toLowerCase().includes('select') && !msg.content.includes('```') && (
                    <div className="mt-4 p-3 bg-slate-950 rounded-xl border border-slate-700/50 shadow-inner">
                      <div className="text-[10px] text-slate-500 mb-2 font-mono uppercase tracking-widest font-bold">Recordatorio de Sintaxis</div>
                      <div className="font-mono text-xs">
                        <span className="text-cyan-400 font-bold">SELECT</span> <span className="text-green-400">columnas</span> <span className="text-cyan-400 font-bold">FROM</span> <span className="text-yellow-400">tabla</span>;
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-200">
                <div className="bg-slate-800/90 text-slate-200 p-4 rounded-2xl rounded-bl-sm flex items-center gap-3 border border-slate-700/50 shadow-lg">
                  <Loader className="w-5 h-5 animate-spin text-blue-400" />
                  <span className="text-sm font-semibold tracking-wide text-slate-300">Generando respuesta...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Área de Input */}
          <div className="p-4 border-t border-slate-700/50 bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] relative z-10">
            <div className="flex gap-3 relative">
              <Input
                data-testid="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregúntame sobre SQL..."
                className="bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500 pr-14 h-12 rounded-xl shadow-inner"
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                data-testid="send-message-button"
                disabled={loading || !inputMessage.trim()}
                className="absolute right-1 top-1 bottom-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg px-4 transition-all duration-300 shadow-md h-10"
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