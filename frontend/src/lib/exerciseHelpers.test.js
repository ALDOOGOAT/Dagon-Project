import { inferLearningFocus } from './exerciseHelpers';

describe('inferLearningFocus', () => {
  it('usa el concepto del backend para un CREATE TABLE en español', () => {
    const focus = inferLearningFocus({
      concept: 'DDL y reglas',
      title: '5.1: Crear tabla con sellos',
      description: 'Crea la tabla "mascotas" con: id (SERIAL, PK), nombre (VARCHAR 50, NOT NULL).',
      hint: 'Pista: Recuerda usar la sintaxis correcta y terminar con punto y coma (;).'
    }, '5');
    expect(focus.concept).toBe('Modelado de datos');
  });

  it('no confunde palabras españolas con funciones de agregacion', () => {
    // "terminar" contiene MIN, "eliminar" contiene MIN, "resumen" contiene SUM
    const focus = inferLearningFocus({
      concept: 'DML',
      title: 'Eliminar filas',
      description: 'Elimina el registro y revisa el resumen final.',
      hint: 'Recuerda terminar con punto y coma.'
    }, '3');
    expect(focus.concept).toBe('Cambios de datos');
  });

  it('sigue detectando agrupaciones reales', () => {
    const focus = inferLearningFocus({
      concept: 'Agregacion',
      title: 'Contar aventureros',
      description: 'Usa COUNT(*) y GROUP BY nivel.'
    }, '8');
    expect(focus.concept).toBe('Agrupaciones');
  });
});

describe('inferLearningFocus en diagramas', () => {
  it('un ejercicio de diagrama siempre enfoca el modelado', () => {
    // La query maestra es {"diagrama":"validado"}: sin este caso caia en "Consulta basica".
    const focus = inferLearningFocus({
      type: 'diagram',
      title: 'Fase 1: El Lienzo del Arquitecto',
      description: 'Diseña el diagrama Entidad-Relación y conéctalas con una Llave Foránea.',
      starterCode: ''
    }, '4');
    expect(focus.concept).toBe('Modelado de datos');
  });
});
