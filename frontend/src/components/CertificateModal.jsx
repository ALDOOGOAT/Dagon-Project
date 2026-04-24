import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, CheckCircle, X } from 'lucide-react';
import { Button } from './ui/button';

export const CertificateModal = ({ isOpen, onClose, certificado, cursoId, cursoNombre }) => {
  const [loading, setLoading] = useState(false);
  const [datosCertificado, setDatosCertificado] = useState(null);

  useEffect(() => {
    if (isOpen && certificado) {
      setDatosCertificado(certificado);
    }
  }, [isOpen, certificado]);

  const handleDescargar = async () => {
    if (!datosCertificado) return;
    
    setLoading(true);
    
    const certContent = `
═══════════════════════════════════════════════════════
                 CERTIFICADO DE DAGON
═══════════════════════════════════════════════════════

  Este documento certifica que:

      ${datosCertificado.nombre}
      ${datosCertificado.email}

  Ha completado satisfactoriamente el curso:

      "${datosCertificado.curso}"

  Fecha de completación: ${datosCertificado.fechaCompletado}
  Ejercicios completados: ${datosCertificado.ejerciciosCompletados}

  Código de verificación: ${datosCertificado.codigoVerificacion}

═══════════════════════════════════════════════════════
          ,DAGON - La Academia del Guerrero SQL
═══════════════════════════════════════════════════════
    `;

    const blob = new Blob([certContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Certificado_Dagon_${datosCertificado.curso.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    setLoading(false);
  };

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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-8 max-w-lg w-full shadow-2xl shadow-amber-500/20"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center">
          <motion.div
            initial={{ rotate: -10, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="mb-6"
          >
            <Award className="w-20 h-20 mx-auto text-amber-400" />
          </motion.div>

          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 mb-2"
          >
            ¡CERTIFICADO DE DAGON!
          </motion.h2>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-sm mb-6"
          >
            Academia del Guerrero SQL
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 rounded-2xl p-6 mb-6 border border-amber-500/20"
          >
            <p className="text-slate-400 text-sm mb-2">Otorgado a:</p>
            <h3 className="text-2xl font-display font-black text-white mb-4">
              {datosCertificado.nombre}
            </h3>
            <p className="text-slate-400 text-sm mb-2">Por completar:</p>
            <h4 className="text-xl font-bold text-amber-300 mb-4">
              {datosCertificado.curso}
            </h4>
            <div className="flex justify-between text-sm">
              <div>
                <p className="text-slate-500">Fecha</p>
                <p className="text-white">{datosCertificado.fechaCompletado}</p>
              </div>
              <div>
                <p className="text-slate-500">Ejercicios</p>
                <p className="text-white">{datosCertificado.ejerciciosCompletados}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-800/30 rounded-xl p-4 mb-6"
          >
            <p className="text-slate-500 text-xs">Código de verificación</p>
            <p className="text-amber-400 font-mono text-sm">{datosCertificado.codigoVerificacion}</p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-3"
          >
            <Button 
              onClick={handleDescargar}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Descargando...' : 'Descargar Certificado'}
            </Button>
            <Button onClick={onClose} variant="outline" className="border-slate-600">
              Cerrar
            </Button>
          </motion.div>
        </div>
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