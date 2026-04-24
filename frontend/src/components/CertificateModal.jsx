import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, CheckCircle, X } from 'lucide-react';
import { Button } from './ui/button';

const generarCertificadoPNG = (datos, cursoId) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = 1200;
  canvas.height = 850;
  
  const fondoGradiente = ctx.createLinearGradient(0, 0, 1200, 850);
  fondoGradiente.addColorStop(0, '#0f172a');
  fondoGradiente.addColorStop(0.5, '#1e1b4b');
  fondoGradiente.addColorStop(1, '#0f172a');
  ctx.fillStyle = fondoGradiente;
  ctx.fillRect(0, 0, 1200, 850);
  
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 8;
  ctx.strokeRect(30, 30, 1140, 790);
  
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 50, 1100, 750);
  
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.arc(60 + i * 30, 60, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1140 - i * 30, 60, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(60 + i * 30, 790, 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1140 - i * 30, 790, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 72px serif';
  ctx.textAlign = 'center';
  ctx.fillText('✦ CERTIFICADO ✦', 600, 140);
  
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Academia Dagon - Escuela de Sql', 600, 190);
  
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px sans-serif';
  ctx.fillText('Este documento certifica que', 600, 280);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px serif';
  ctx.fillText(datos.nombre.toUpperCase(), 600, 350);
  
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(300, 370);
  ctx.lineTo(900, 370);
  ctx.stroke();
  
  ctx.fillStyle = '#94a3b8';
  ctx.font = '20px sans-serif';
  ctx.fillText('ha completado satisfactoriamente el curso de', 600, 420);
  
  const esGuerrero = datos.curso && datos.curso.toLowerCase().includes('guerrero');
  
  ctx.fillStyle = esGuerrero ? '#ef4444' : '#3b82f6';
  ctx.font = 'bold 36px serif';
  ctx.fillText(datos.curso, 600, 480);
  
  ctx.fillStyle = '#78350f';
  ctx.font = '16px sans-serif';
  ctx.fillText('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 600, 520);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Fecha de completación: ${datos.fechaCompletado}`, 600, 570);
  ctx.fillText(`Ejercicios completados: ${datos.ejerciciosCompletados}`, 600, 600);
  
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`Código de verificación: ${datos.codigoVerificacion}`, 600, 650);
  
  ctx.fillStyle = '#78350f';
  ctx.font = 'italic 18px serif';
  ctx.fillText('✦ Dagon - La Academia del Guerrero SQL ✦', 600, 750);
  
  ctx.fillStyle = '#475569';
  ctx.font = '12px sans-serif';
  ctx.fillText('www.dagonacademia.com', 600, 800);
  
  return canvas.toDataURL('image/png');
};

export const CertificateModal = ({ isOpen, onClose, certificado, cursoId, cursoNombre }) => {
  const [loading, setLoading] = useState(false);
  const [datosCertificado, setDatosCertificado] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (isOpen && certificado) {
      setDatosCertificado(certificado);
      const url = generarCertificadoPNG(certificado, cursoId);
      setPreviewUrl(url);
    }
  }, [isOpen, certificado, cursoId]);

  const handleDescargar = async () => {
    if (!datosCertificado) return;
    
    setLoading(true);
    
    try {
      const dataUrl = generarCertificadoPNG(datosCertificado, cursoId);
      
      const link = document.createElement('a');
      link.download = `Certificado_Dagon_${datosCertificado.curso.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar certificado:', error);
    }
    
    setLoading(false);
  };

  if (!isOpen) return null;

  const esGuerrero = datosCertificado?.curso?.toLowerCase().includes('guerrero');

  if (!isOpen) return null;

  if (!datosCertificado) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-8 max-w-md w-full"
        >
          <div className="text-center">
            <div className="text-6xl mb-4">📜</div>
            <h2 className="text-2xl font-display font-black text-amber-300 mb-4">
              ¡Certificado de Dagon!
            </h2>
            <p className="text-slate-400 mb-6">
              Completa todos los ejercicios del curso para obtener tu certificado.
            </p>
            <Button onClick={onClose} className="w-full">
              Continuar Aventurando
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 max-w-4xl w-full shadow-2xl shadow-amber-500/30"
      >
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-10 h-10 flex items-center justify-center bg-slate-800/80 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-4"
          >
            <Award className="w-16 h-16 mx-auto text-amber-400" />
          </motion.div>

          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={`text-2xl font-display font-black mb-2 ${esGuerrero ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-500' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500'}`}
          >
            ¡CERTIFICADO DE {esGuerrero ? 'GUERRERO' : 'ARQUITECTO'} SQL!
          </motion.h2>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-sm mb-4"
          >
            Academia Dagon - La Escuela del Guerrero SQL
          </motion.p>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative mt-4 rounded-xl overflow-hidden border-2 border-amber-500/30 shadow-lg"
          style={{ 
            boxShadow: esGuerrero 
              ? '0 0 30px rgba(239, 68, 68, 0.3)' 
              : '0 0 30px rgba(59, 130, 246, 0.3)'
          }}
        >
          <div className="relative bg-slate-900 rounded-xl overflow-hidden">
            {previewUrl ? (
              <img 
                src={previewUrl} 
                alt="Certificado" 
                className="w-full h-auto max-h-[60vh] object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-3 mt-6"
        >
          <Button 
            onClick={handleDescargar}
            disabled={loading}
            className={`font-bold ${esGuerrero 
              ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white' 
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
            }`}
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Generando...' : 'Descargar PNG'}
          </Button>
          <Button onClick={onClose} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
            Cerrar
          </Button>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-center"
        >
          <p className="text-slate-500 text-xs">
            Código de verificación: <span className="text-amber-400 font-mono">{datosCertificado.codigoVerificacion}</span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export const useCertificado = (token) => {
  const [cursosCompletados, setCursosCompletados] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCursosCompletados = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/modulos/cursos-completados`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCursosCompletados(data);
      }
    } catch (error) {
      console.error('Error al cargar cursos completados:', error);
    } finally {
      setLoading(false);
    }
  };

  const generarCertificado = async (cursoId) => {
    if (!token) return null;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/modulos/certificado/${cursoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error al generar certificado:', error);
    }
    return null;
  };

  useEffect(() => {
    fetchCursosCompletados();
  }, [token]);

  return { cursosCompletados, loading, generarCertificado, refetch: fetchCursosCompletados };
};