import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calculator } from 'lucide-react';
import { IoCalculadora } from '../components/io/IoCalculadora';
import { Boton } from '../components/io/ui';
export const IoCalculadoraPage = () => {
  const navigate = useNavigate();
  const {
    setMateria
  } = useTheme();
  useEffect(() => setMateria('io'), [setMateria]);
  return <main className="dagon-page-shell dagon-page-shell--wide">
  <Boton variante="suave" icono={ArrowLeft} onClick={() => navigate('/dashboard')}>Volver al mapa</Boton>
  <header className="my-6">
    <h1 className="flex items-center gap-3 font-display text-3xl font-black">
<Calculator />Laboratorio de operaciones</h1>
    <p className="mt-2 opacity-75">Del enunciado al modelo, la gráfica y el procedimiento. Revisa los datos detectados y compara tus decisiones.</p>
  </header>
  <IoCalculadora />
</main>;
};
