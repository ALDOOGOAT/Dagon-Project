import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

// Aislado de DocentePage para que recharts se cargue solo cuando el docente
// realmente ve estas gráficas (React.lazy en DocentePage importa este módulo).

export const FallosPorEjercicioChart = ({ data, borderColor, mutedColor, headingColor, isLight, chartColors }) => (
  <div className="h-64 sm:h-80">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.ejercicios_fallados.slice(0, 10).map(e => ({
          name: e.titulo?.length > 25 ? e.titulo.slice(0, 22) + '...' : e.titulo,
          tasaError: e.tasaError,
          intentos: e.intentosTotales
        }))}
        layout="vertical"
        margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: mutedColor, fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          width={160}
          tick={{ fill: mutedColor, fontSize: 11 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isLight ? '#fff' : '#1e293b',
            border: `1px solid ${borderColor}`,
            borderRadius: 12,
            color: headingColor
          }}
          formatter={(val, name) => [
            name === 'tasaError' ? `${val}%` : val,
            name === 'tasaError' ? 'Tasa error' : 'Intentos'
          ]}
        />
        <Bar dataKey="tasaError" radius={[0, 6, 6, 0]}>
          {data.ejercicios_fallados.slice(0, 10).map((_, i) => (
            <Cell key={i} fill={chartColors[i % chartColors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const AbandonoPorModuloChart = ({ data, borderColor, mutedColor, headingColor, isLight }) => (
  <div className="h-64 sm:h-80">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data.abandono_modulos.map(m => ({
          name: m.titulo?.length > 20 ? m.titulo.slice(0, 17) + '...' : m.titulo,
          abandono: m.tasaAbandono,
          iniciaron: m.alumnosQueIniciaron,
          completaron: m.alumnosQueCompletaron
        }))}
        margin={{ left: 5, right: 20, top: 5, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={borderColor} />
        <XAxis
          dataKey="name"
          tick={{ fill: mutedColor, fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={70}
        />
        <YAxis domain={[0, 100]} tick={{ fill: mutedColor, fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: isLight ? '#fff' : '#1e293b',
            border: `1px solid ${borderColor}`,
            borderRadius: 12,
            color: headingColor
          }}
          formatter={(val, name) => {
            if (name === 'abandono') return [`${val}%`, 'Tasa abandono'];
            if (name === 'iniciaron') return [val, 'Iniciaron'];
            return [val, 'Completaron'];
          }}
        />
        <Bar dataKey="abandono" fill={isLight ? '#d97706' : '#fbbf24'} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
