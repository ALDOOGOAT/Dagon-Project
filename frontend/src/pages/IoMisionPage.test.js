import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IoMisionPage } from './IoMisionPage';
import apiClient, { cachedGet } from '../services/apiClient';
const mockNavigate = jest.fn();
const mockXP = jest.fn();
const mockStreak = jest.fn();
const mockMateria = jest.fn();
const mockTutor = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({
    moduloId: '301'
  })
}), {
  virtual: true
});
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      xp: 100
    },
    updateUserXP: mockXP,
    updateUserStreak: mockStreak
  })
}));
jest.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({
    setMateria: mockMateria
  })
}));
jest.mock('../services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn()
  },
  cachedGet: jest.fn()
}));
jest.mock('../hooks/useClawbotSupport', () => ({
  useClawbotSupport: () => ({
    setClawbotMessage: jest.fn(),
    invokeClawbot: mockTutor
  })
}));
jest.mock('../components/RewardAnimation', () => ({
  RewardAnimation: () => <div>Recompensa</div>
}));
// La cinemática se cubre en su propia prueba; aquí se salta al instante para llegar a la teoría.
jest.mock('../components/ModuleCinematic', () => ({
  ModuleCinematic: ({ onComplete }) => {
    require('react').useEffect(() => { onComplete(); }, [onComplete]);
    return null;
  }
}));
jest.mock('../components/DagonMascot', () => ({
  DagonMascot: () => null
}));
jest.mock('../components/io/Formula', () => ({
  Formula: () => null
}));
jest.mock('../components/io/ui', () => ({
  Boton: ({
    children,
    icono,
    variante,
    ...props
  }) => <button type="button" {...props}>
  {children}
</button>,
  Panel: ({
    children,
    titulo
  }) => <section>
  <h2>
    {titulo}
  </h2>
  {children}
</section>,
  ErrorIO: ({
    mensaje
  }) => mensaje ? <p role="alert">
  {mensaje}
</p> : null,
  Etiqueta: ({
    children,
    htmlFor
  }) => <label htmlFor={htmlFor}>
  {children}
</label>
}));
const modulo = {
  module: {
    titulo: 'Método gráfico',
    materia_slug: 'io',
    nombre_curso: 'IO I',
    orden: 3
  },
  exercises: [{
    id: 801,
    type: 'numerico',
    title: 'Wyndor',
    description: 'Obtén Z óptimo',
    campos: [{
      clave: 'z',
      etiqueta: 'Z óptimo',
      tipo: 'numero'
    }]
  }]
};
let host, root;
const click = async texto => {
  const boton = Array.from(host.querySelectorAll('button')).find(b => b.textContent === texto);
  await act(async () => boton.dispatchEvent(new MouseEvent('click', {
    bubbles: true
  })));
};
const responder = async valor => {
  const input = host.querySelector('input');
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, valor);
    input.dispatchEvent(new Event('input', {
      bubbles: true
    }));
    input.dispatchEvent(new Event('change', {
      bubbles: true
    }));
  });
};
const enviar = async () => act(async () => host.querySelector('form').dispatchEvent(new Event('submit', {
  bubbles: true,
  cancelable: true
})));
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  cachedGet.mockResolvedValue({
    data: modulo
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
});
test('error por campo, tutor IO y acierto otorgan XP/racha una sola vez', async () => {
  await act(async () => root.render(<IoMisionPage />));
  await click('Empezar misiones');
  await responder('20');
  apiClient.post.mockResolvedValueOnce({
    data: {
      success: false,
      campos: {
        z: false
      },
      message: 'Revisa los campos marcados'
    }
  });
  await enviar();
  expect(host.textContent).toContain('Revisa este campo');
  expect(mockXP).not.toHaveBeenCalled();
  expect(mockTutor).toHaveBeenCalledWith(expect.objectContaining({
    materia: 'io',
    ejercicioId: 801
  }));
  await responder('36');
  apiClient.post.mockResolvedValueOnce({
    data: {
      success: true,
      campos: {
        z: true
      },
      xp_gained: 20,
      streak_activated_today: true,
      new_streak: 2
    }
  });
  await enviar();
  expect(host.textContent).toContain('Correcto');
  expect(mockXP).toHaveBeenCalledWith(120);
  expect(mockStreak).toHaveBeenCalledWith(2);
  await enviar();
  expect(apiClient.post).toHaveBeenCalledTimes(2);
  expect(mockXP).toHaveBeenCalledTimes(1);
  expect(JSON.parse(localStorage.getItem('dagon_io_progress:local:301'))).toMatchObject({
    attempts: 2,
    successes: 1,
    failures: 1
  });
  await click('Completar módulo');
  expect(mockNavigate).toHaveBeenCalledWith('/graduation/301');
});
test('rechaza módulos SQL al abrir una URL de IO', async () => {
  cachedGet.mockResolvedValue({
    data: {
      ...modulo,
      module: {
        ...modulo.module,
        materia_slug: 'sql'
      }
    }
  });
  await act(async () => root.render(<IoMisionPage />));
  expect(host.querySelector('[role="alert"]').textContent).toContain('pertenece a SQL');
  expect(host.querySelector('form')).toBeNull();
  expect(mockMateria).not.toHaveBeenCalled();
});
test('un acierto ya registrado con XP cero permite avanzar sin sumar XP', async () => {
  await act(async () => root.render(<IoMisionPage />));
  await click('Empezar misiones');
  await responder('36');
  apiClient.post.mockResolvedValue({
    data: {
      success: true,
      campos: {
        z: true
      },
      xp_gained: 0
    }
  });
  await enviar();
  expect(mockXP).not.toHaveBeenCalled();
  expect(host.textContent).toContain('Completar módulo');
});
