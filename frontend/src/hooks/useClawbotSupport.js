import { useState } from 'react';
import apiClient from '../services/apiClient';
import { buildLocalClawbotFallback } from '../lib/exerciseHelpers';

/**
 * Estado y llamada a Clawbot cuando un alumno falla un ejercicio: "está pensando",
 * el mensaje que devuelve (o el fallback local si la API falla) y el contador de
 * intentos fallidos del ejercicio actual. Extraído de ExercisePage para aislar
 * ese pedazo de estado del resto del flujo de validación.
 */
export const useClawbotSupport = (exercises, currentExerciseIndex) => {
  const [clawbotThinking, setClawbotThinking] = useState(false);
  const [clawbotMessage, setClawbotMessage] = useState(null);
  const [intentosFallidos, setIntentosFallidos] = useState(0);

  const invokeClawbot = async (errorData) => {
    setClawbotThinking(true);
    try {
      const response = await apiClient.post('/api/clawbot/analyze', errorData);
      const data = response.data;
      setClawbotMessage(data.mensaje || data.response || "No tengo pistas en este momento.");
    } catch {
      setClawbotMessage(errorData.materia === 'io' ? 'Revisa las unidades, los supuestos y cada paso del procedimiento. Compara tus campos con la teoría y usa la calculadora para verificar tus operaciones.' : buildLocalClawbotFallback(errorData, exercises[currentExerciseIndex]));
    } finally {
      setClawbotThinking(false);
    }
  };

  return {
    clawbotThinking,
    clawbotMessage,
    setClawbotMessage,
    intentosFallidos,
    setIntentosFallidos,
    invokeClawbot,
  };
};
