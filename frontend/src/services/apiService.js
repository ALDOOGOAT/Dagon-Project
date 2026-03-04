import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${API_URL}/api`;

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