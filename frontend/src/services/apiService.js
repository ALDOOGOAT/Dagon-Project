import axios from 'axios';
import { apiUrl } from '../config/api';

const API = apiUrl('/api');

export const apiService = {
  getLevels: async () => {
    const response = await axios.get(`${API}/levels`);
    return response.data;
  },

  getExercises: async (levelId) => {
    const response = await axios.get(`${API}/exercises/${levelId}`);
    return response.data;
  },

  validateExercise: async (exerciseId, query, levelId) => {
    const response = await axios.post(`${API}/exercises/validate`, {
      exercise_id: exerciseId,
      query,
      level_id: levelId
    });
    return response.data;
  },

  chat: async (message, sessionId) => {
    const response = await axios.post(`${API}/chat`, {
      message,
      session_id: sessionId
    });
    return response.data;
  }
};

export const clawbotService = {
  sendMessage: async (message, sessionId) => {
    return await apiService.chat(message, sessionId);
  }
};
