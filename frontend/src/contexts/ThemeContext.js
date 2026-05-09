import { createContext, useContext, useState, useLayoutEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

export const COLOR_PALETTES = {
  dagon: {
    name: 'Dagon Original',
    mode: 'dark',
    primary: '#10b981',
    secondary: '#06b6d4', 
    accent: '#22d3ee',
    background: '#020617',
    surface: '#0f172a',
    surfaceAlt: '#1e293b',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    border: '#334155',
    gradient: 'from-emerald-600 to-cyan-700',
    gradientAlt: 'from-emerald-900/20 via-transparent to-cyan-900/20',
  },
  ocean: {
    name: 'Ocean',
    mode: 'dark',
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#22d3ee',
    background: '#0c1929',
    surface: '#0f2744',
    surfaceAlt: '#163a6b',
    text: '#f0f9ff',
    textMuted: '#7dd3fc',
    border: '#1e4a6e',
    gradient: 'from-sky-600 to-blue-700',
    gradientAlt: 'from-sky-900/20 via-transparent to-blue-900/20',
  },
  synthwave: {
    name: 'Synthwave',
    mode: 'dark',
    primary: '#d946ef',
    secondary: '#a855f7',
    accent: '#ec4899',
    background: '#1a0a2e',
    surface: '#2d1b4e',
    surfaceAlt: '#4c1d95',
    text: '#fdf4ff',
    textMuted: '#c4b5fd',
    border: '#5b21b6',
    gradient: 'from-fuchsia-600 to-purple-700',
    gradientAlt: 'from-fuchsia-900/20 via-transparent to-purple-900/20',
  },
  dragon: {
    name: 'Dragon',
    mode: 'dark',
    primary: '#dc2626',
    secondary: '#991b1b',
    accent: '#f87171',
    background: '#1a0505',
    surface: '#2a0a0a',
    surfaceAlt: '#450b0b',
    text: '#fef2f2',
    textMuted: '#fca5a5',
    border: '#7f1d1d',
    gradient: 'from-red-700 to-rose-800',
    gradientAlt: 'from-red-900/20 via-transparent to-rose-900/20',
  },
  forest: {
    name: 'Forest',
    mode: 'dark',
    primary: '#22c55e',
    secondary: '#15803d',
    accent: '#4ade80',
    background: '#051a0d',
    surface: '#0a2a17',
    surfaceAlt: '#14532d',
    text: '#f0fdf4',
    textMuted: '#86efac',
    border: '#14532d',
    gradient: 'from-green-600 to-emerald-700',
    gradientAlt: 'from-green-900/20 via-transparent to-emerald-900/20',
  },
  midnight: {
    name: 'Midnight',
    mode: 'dark',
    primary: '#6366f1',
    secondary: '#4338ca',
    accent: '#818cf8',
    background: '#0a0a1a',
    surface: '#121225',
    surfaceAlt: '#1e1e3f',
    text: '#eef2ff',
    textMuted: '#a5b4fc',
    border: '#312e81',
    gradient: 'from-indigo-600 to-violet-700',
    gradientAlt: 'from-indigo-900/20 via-transparent to-violet-900/20',
  },
  aurora: {
    name: 'Aurora Gold',
    mode: 'light',
    primary: '#a85f12',
    secondary: '#d9a441',
    accent: '#b86f1f',
    background: '#fffaf2',
    surface: '#fff7e8',
    surfaceAlt: '#eed7aa',
    text: '#2a2118',
    textMuted: '#6f5842',
    border: '#d7b983',
    gradient: 'from-amber-700 via-yellow-500 to-orange-500',
    gradientAlt: 'from-amber-100/82 via-white/40 to-orange-100/68',
  },
};

const DEFAULT_PALETTE = 'dagon';
const THEME_ROOT_CLASSES = ['theme-dark', 'theme-light'];
const getUserPaletteKey = (userId) => `userPalette:${userId}`;

const getValidPalette = (paletteName) => {
  return COLOR_PALETTES[paletteName] ? paletteName : DEFAULT_PALETTE;
};

const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length !== 7) {
    return { r: 99, g: 102, b: 241 };
  }

  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
};

const rgba = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getUserIdFromToken = (token) => {
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );
    const payload = JSON.parse(jsonPayload);

    return payload?.sub || null;
  } catch (error) {
    return null;
  }
};

const getStoredPalette = (userId) => {
  if (!userId) return DEFAULT_PALETTE;

  const storedPalette = localStorage.getItem(getUserPaletteKey(userId));
  return getValidPalette(storedPalette || DEFAULT_PALETTE);
};

export const ThemeProvider = ({ children }) => {
  const { user, token } = useAuth();
  const resolvedUserId = user?.idUsuario || getUserIdFromToken(token);
  const [palette, setPalette] = useState(() => {
    return getStoredPalette(user?.idUsuario || getUserIdFromToken(token));
  });

  useLayoutEffect(() => {
    const resolvedPalette = getStoredPalette(resolvedUserId);

    if (resolvedPalette !== palette) {
      setPalette(resolvedPalette);
      applyPalette(resolvedPalette);
      return;
    }

    if (resolvedUserId) {
      localStorage.setItem(getUserPaletteKey(resolvedUserId), resolvedPalette);
    }
    applyPalette(resolvedPalette);
  }, [palette, resolvedUserId]);

  const changePalette = (newPalette) => {
    const safePalette = getValidPalette(newPalette);

    setPalette(safePalette);

    if (resolvedUserId) {
      localStorage.setItem(getUserPaletteKey(resolvedUserId), safePalette);
    }

    applyPalette(safePalette);
  };

  const currentColors = COLOR_PALETTES[palette] || COLOR_PALETTES[DEFAULT_PALETTE];

  return (
    <ThemeContext.Provider value={{ 
      palette, 
      changePalette, 
      colors: currentColors,
      palettes: COLOR_PALETTES 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      palette: DEFAULT_PALETTE,
      changePalette: () => {},
      colors: COLOR_PALETTES[DEFAULT_PALETTE],
      palettes: COLOR_PALETTES,
    };
  }
  return context;
};

const applyPalette = (paletteName) => {
  const safePalette = getValidPalette(paletteName);
  const colors = COLOR_PALETTES[safePalette] || COLOR_PALETTES[DEFAULT_PALETTE];
  const root = document.documentElement;
  const isLight = colors.mode === 'light';
  const isAurora = safePalette === 'aurora';

  // Añadir transición suave para todos los cambios de color
  if (!root.style.transition) {
    setTimeout(() => {
      root.style.transition = 'background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease';
    }, 100);
  }

  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-secondary', colors.secondary);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-surface-alt', colors.surfaceAlt);
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-text-muted', colors.textMuted);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--glass-surface', isLight
    ? (isAurora ? 'rgba(255, 249, 239, 0.86)' : 'rgba(255, 251, 240, 0.72)')
    : 'rgba(255, 255, 255, 0.05)');
  root.style.setProperty('--glass-surface-strong', isLight
    ? (isAurora ? 'rgba(255, 247, 232, 0.94)' : 'rgba(255, 248, 230, 0.88)')
    : 'rgba(30, 41, 59, 0.4)');
  root.style.setProperty('--glass-border', isLight
    ? (isAurora ? 'rgba(168, 95, 18, 0.22)' : 'rgba(245, 158, 11, 0.18)')
    : 'rgba(255, 255, 255, 0.18)');
  root.style.setProperty('--glass-highlight', isLight
    ? (isAurora ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.92)')
    : 'rgba(255, 255, 255, 0.15)');
  root.style.setProperty('--glass-shadow', isLight
    ? (isAurora ? '0 30px 82px -38px rgba(133, 77, 14, 0.28)' : '0 25px 60px -25px rgba(217, 119, 6, 0.22)')
    : '0 8px 32px 0 rgba(0, 0, 0, 0.37)');
  root.style.setProperty('--grid-opacity', isLight ? (isAurora ? '0.055' : '0.09') : '0.05');
  root.style.setProperty('--theme-orb-a', isLight ? rgba(colors.primary, 0.16) : rgba(colors.primary, 0.18));
  root.style.setProperty('--theme-orb-b', isLight ? rgba(colors.secondary, 0.14) : rgba(colors.secondary, 0.16));
  root.style.setProperty('--theme-orb-c', isLight ? rgba(colors.accent, 0.12) : rgba(colors.accent, 0.12));
  root.style.setProperty('--theme-shell', isLight
    ? `radial-gradient(circle at top, rgba(255,255,255,0.98) 0%, ${rgba(colors.surface, 0.94)} 34%, ${rgba(colors.surfaceAlt, 0.78)} 74%, ${rgba(colors.border, 0.52)} 100%)`
    : `radial-gradient(ellipse at top, ${rgba(colors.surfaceAlt, 0.62)} 0%, ${rgba(colors.surface, 0.46)} 30%, ${colors.background} 100%)`);
  root.style.setProperty('--theme-overlay', isLight
    ? `linear-gradient(145deg, rgba(255,255,255,0.74) 0%, ${rgba(colors.surface, 0.28)} 36%, ${rgba(colors.surfaceAlt, 0.14)} 72%, rgba(255,255,255,0.08) 100%)`
    : `linear-gradient(180deg, ${rgba(colors.primary, 0.14)} 0%, transparent 42%, ${rgba(colors.secondary, 0.12)} 100%)`);
  root.style.setProperty('--theme-vignette', isLight
    ? `linear-gradient(180deg, ${rgba('#ffffff', 0.08)} 0%, transparent 54%, ${rgba(colors.surfaceAlt, 0.18)} 100%)`
    : `linear-gradient(180deg, transparent 0%, transparent 56%, ${rgba(colors.background, 0.82)} 100%)`);
  root.style.setProperty('--panel-shadow', isLight
    ? `0 24px 64px -30px ${rgba(colors.primary, 0.24)}`
    : `0 24px 64px -26px ${rgba(colors.background, 0.62)}`);
  root.dataset.themeMode = isLight ? 'light' : 'dark';
  root.dataset.themePalette = safePalette;
  root.classList.remove(...THEME_ROOT_CLASSES);
  root.classList.add(isLight ? 'theme-light' : 'theme-dark');
  
  root.style.setProperty('--background', colors.background);
  root.style.setProperty('--foreground', colors.text);
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--primary-foreground', isLight ? '#1f2937' : '#ffffff');
  root.style.setProperty('--secondary', colors.secondary);
  root.style.setProperty('--secondary-foreground', colors.text);
  root.style.setProperty('--muted', colors.surfaceAlt);
  root.style.setProperty('--muted-foreground', colors.textMuted);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--accent-foreground', colors.text);
  root.style.setProperty('--destructive', '#dc2626');
  root.style.setProperty('--destructive-foreground', '#ffffff');
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--input', colors.border);
  root.style.setProperty('--ring', colors.primary);
  root.style.setProperty('--card', colors.surface);
  root.style.setProperty('--card-foreground', colors.text);
  root.style.setProperty('--popover', colors.surface);
  root.style.setProperty('--popover-foreground', colors.text);

  // También actualizar el color de fondo del body directamente para evitar flashes
  document.body.style.backgroundColor = colors.background;
  document.body.style.backgroundImage = isLight
    ? (isAurora
      ? 'radial-gradient(circle at top, rgba(255,255,255,0.98) 0%, rgba(255,249,239,0.96) 34%, rgba(245,228,196,0.88) 74%, rgba(231,204,158,0.72) 100%), linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(255,248,237,0.68) 40%, rgba(238,216,174,0.30) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(255,248,220,0.92) 55%, rgba(255,243,199,0.88) 100%)')
    : '';
};

export default ThemeContext;
