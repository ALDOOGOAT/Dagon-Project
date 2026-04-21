import { useEffect, useCallback } from 'react';
import { sounds } from '../lib/SoundEngine';

export const useSound = () => {
  const initSound = useCallback(() => {
    sounds.init();
    return sounds;
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      sounds.init();
      sounds.resume();
    };
    
    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keypress', handleInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keypress', handleInteraction);
    };
  }, []);

  return { sounds, initSound };
};

export default useSound;