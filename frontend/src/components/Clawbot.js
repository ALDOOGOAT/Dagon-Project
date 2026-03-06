import { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { clawbotService } from '../services/apiService';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import { DagonMascot } from './DagonMascot';

export const Clawbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`session-${Date.now()}`);
  const messagesEndRef = useRef(null);

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
        content: '¡Hola! Soy Clawbot, tu tutor de SQL. ¿En qué puedo ayudarte hoy?'
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await clawbotService.sendMessage(userMessage, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, hubo un error. Intenta de nuevo.' }
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
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] transition-all duration-300 flex items-center justify-center group animate-pulse-glow"
        style={{ zIndex: 9999 }}
      >
        {isOpen ? (
          <X className="w-8 h-8 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-8 h-8 text-white" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
          </div>
        )}
      </button>

      {isOpen && (
        <div
          data-testid="clawbot-panel"
          className="fixed bottom-24 right-6 w-96 h-[600px] glass-card rounded-2xl shadow-2xl flex flex-col border border-slate-800"
          style={{ zIndex: 9999 }}
        >
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 rounded-t-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <DagonMascot size="small" mood="happy" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">
                Clawbot
              </h3>
              <p className="text-blue-100 text-xs">Tu tutor SQL inteligente</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4" data-testid="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                data-testid={`message-${msg.role}`}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    {msg.content}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-200 p-3 rounded-lg flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Pensando...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-800">
            <div className="flex gap-2">
              <Input
                data-testid="chat-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pregunta algo sobre SQL..."
                className="bg-slate-950 border-slate-800 text-slate-200 focus:border-red-500"
                disabled={loading}
              />
              <Button
                onClick={handleSendMessage}
                data-testid="send-message-button"
                disabled={loading || !inputMessage.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
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