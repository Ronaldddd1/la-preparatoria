import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, GraduationCap, Plus, CalendarClock, Megaphone, CalendarDays, CheckCircle2,
  Trophy, AlertTriangle, TrendingUp, Wallet, Cake, NotebookText, ShieldCheck, ArrowRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts';
import api from '../../api/axios';
import { Card, StatCard, PageHeader, Chip, Barra } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

const ANIO = 2026;

const COLORES_NIVEL = { Primaria: '#1B2A4A', Secundaria: '#E4202A' };
const COLORES_ASISTENCIA = { presente: '#10b981', tardanza: '#f59e0b', falta: '#E4202A', justificado: '#1B2A4A' };
const ETIQUETAS_ASISTENCIA = { presente: 'Presente', tardanza: 'Tardanza', falta: 'Falta', justificado: 'Justificado' };
const NOMBRES_MES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function AdminInicio() {
  const [datos, setDatos] = useState(null);
  const { usuario } = useAuth();

  useEffect(() => {
    api.get('/reportes/dashboard', { params: { anioEscolar: ANIO } }).then((res) => setDatos(res.data));
  }, []);

  if (!datos) return <p className="text-marino-400">Cargando panel...</p>;

  const {
    resumenGeneral, matriculasPorNivel, asistenciaPorEstado, distribucionNotas, cuposPorGrado,
    asistenciaMensual = [], rankingAlumnos = [], alertasRiesgo = [], pagosPendientes = [], cumpleanosHoy = [],
  } = datos;

  const datosMensuales = asistenciaMensual.map((m) => ({
    name: NOMBRES_MES[m.mes - 1],
    Presente: Number(m.presente),
    Tardanza: Number(m.tardanza),
    Falta: Number(m.falta),
    Justificado: Number(m.justificado),
  }));
  const hayTendenciaMensual = datosMensuales.length > 0;

  const datosNivel = ['Primaria', 'Secundaria'].map((nivel) => ({
    name: nivel,
    value: Number(matriculasPorNivel.find((m) => m.nivel === nivel)?.total || 0),
    color: COLORES_NIVEL[nivel],
  }));
  const hayMatriculas = datosNivel.some((d) => d.value > 0);

  const datosAsistencia = ['presente', 'tardanza', 'falta', 'justificado'].map((estado) => ({
    name: ETIQUETAS_ASISTENCIA[estado],
    value: Number(asistenciaPorEstado.find((a) => a.estado === estado)?.total || 0),
    color: COLORES_ASISTENCIA[estado],
  }));
  const hayAsistencia = datosAsistencia.some((d) => d.value > 0);

  const ordenRangos = ['C (0-10)', 'B (11-13)', 'A (14-17)', 'AD (18-20)'];
  const datosNotas = ordenRangos.map((rango) => ({
    name: rango,
    value: Number(distribucionNotas.find((n) => n.rango === rango)?.total || 0),
  }));
  const hayNotas = datosNotas.some((d) => d.value > 0);

  const capacidad = cuposPorGrado.reduce((t, g) => t + Number(g.capacidad_total), 0);
  const ocupados = cuposPorGrado.reduce((t, g) => t + Number(g.ocupados), 0);
  const totalAsist = datosAsistencia.reduce((t, d) => t + d.value, 0);
  const cuenta = (n) => datosAsistencia.find((d) => d.name === n)?.value || 0;
  const pctAsistencia = totalAsist > 0 ? (((cuenta('Presente') + cuenta('Justificado')) / totalAsist) * 100).toFixed(1) : null;
  const hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <PageHeader
        etiquetas={<>
          <Chip punto color="rojo">UGEL 02 • Sede San Martín de Porres</Chip>
          <span className="text-xs text-marino-400">• Año lectivo {ANIO}</span>
        </>}
        titulo="Panel de Gestión Directiva"
        subtitulo={`Bienvenido, ${usuario?.username || ''}. Resumen operativo del ${hoy}.`}
        accion={<>
          <Link to="/admin/calendario" className="inline-flex items-center gap-2 rounded-xl bg-white border border-marino-100 px-4 py-2.5 text-sm font-semibold text-marino-800 hover:border-marino-300 transition-colors">
            <CalendarDays className="w-4 h-4" aria-hidden="true" /> Ver calendario
          </Link>
          <Link to="/admin/avisos" className="inline-flex items-center gap-2 rounded-xl bg-marino-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-marino-800 transition-colors">
            <Megaphone className="w-4 h-4" aria-hidden="true" /> Publicar aviso
          </Link>
          <Link to="/admin/matriculas/nueva" className="inline-flex items-center gap-2 rounded-xl bg-rojo-400 px-4 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-rojo-500 transition-colors">
            <Plus className="w-4 h-4" aria-hidden="true" /> Nueva matrícula
          </Link>
        </>}
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard icono={Users} color="navy" etiqueta="Alumnos matriculados" valor={Number(resumenGeneral.matriculas_activas)}
          detalle={capacidad > 0 ? `de ${capacidad} vacantes` : undefined}>
          {capacidad > 0 && <Barra className="mt-3" valor={ocupados} max={capacidad} />}
        </StatCard>
        <StatCard icono={GraduationCap} color="azul" etiqueta="Plana docente activa" valor={Number(resumenGeneral.total_docentes)} detalle="Docentes registrados" />
        <StatCard icono={CheckCircle2} color="esmeralda" etiqueta="Asistencia registrada"
          valor={pctAsistencia != null ? `${pctAsistencia}%` : '—'}
          detalle={totalAsist > 0 ? `${cuenta('Presente')} presentes • ${cuenta('Tardanza')} tardanzas • ${cuenta('Falta')} faltas` : 'Aún sin registros'}>
          {totalAsist > 0 && <Barra className="mt-3" valor={cuenta('Presente') + cuenta('Justificado')} max={totalAsist} color="verde" />}
        </StatCard>
        <StatCard icono={AlertTriangle} color="rojo" etiqueta="Alumnos en riesgo" valor={alertasRiesgo.length}
          detalle={alertasRiesgo.length > 0 ? 'Más de 20% de faltas o promedio menor a 11' : 'Sin alertas por ahora'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-[18px] h-[18px] text-marino-700" aria-hidden="true" />
              <h2 className="font-display text-xl font-semibold text-marino-900">Monitoreo de asistencia escolar</h2>
            </div>
            <p className="text-xs text-marino-400 mb-4">Evolución mensual de presentes, tardanzas, faltas y justificaciones.</p>
            {hayTendenciaMensual ? (
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={datosMensuales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef1fa" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7f8fc0' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#7f8fc0' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="Presente" stroke={COLORES_ASISTENCIA.presente} strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="Tardanza" stroke={COLORES_ASISTENCIA.tardanza} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Falta" stroke={COLORES_ASISTENCIA.falta} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Justificado" stroke={COLORES_ASISTENCIA.justificado} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-marino-300 text-sm py-16 text-center">Aún no hay suficiente asistencia registrada para ver la tendencia.</p>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="font-display text-xl font-semibold text-marino-900">Aforo y matrículas por grado ({ANIO})</h2>
              <Chip color="azul">{Math.max(capacidad - ocupados, 0)} vacantes disponibles</Chip>
            </div>
            <p className="text-xs text-marino-400 mb-4">Cupos ocupados frente a la capacidad total de cada grado.</p>
            <div className="space-y-3">
              {cuposPorGrado.map((g) => {
                const cap = Number(g.capacidad_total);
                const oc = Number(g.ocupados);
                const pct = cap > 0 ? Math.round((oc / cap) * 100) : 0;
                const libres = Math.max(cap - oc, 0);
                return (
                  <div key={g.grado_nombre} className="rounded-xl bg-papel px-4 py-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="font-display text-base font-semibold text-marino-900">{g.grado_nombre}</p>
                      <p className="text-sm text-marino-700">
                        <span className="font-semibold">{oc} / {cap}</span>
                        <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${pct >= 95 ? 'bg-esmeralda-100 text-esmeralda-600' : 'bg-marino-100 text-marino-600'}`}>{pct}%</span>
                        <span className={`ml-2 text-xs font-semibold ${libres <= 5 ? 'text-rojo-500' : 'text-marino-400'}`}>{libres} libres</span>
                      </p>
                    </div>
                    <Barra valor={oc} max={cap} />
                  </div>
                );
              })}
              {cuposPorGrado.length === 0 && <p className="text-marino-300 text-sm py-8 text-center">Aún no hay grados con cupos configurados.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 bg-[#fff8e6] border-ambar-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-marino-900">
                <Cake className="w-[18px] h-[18px] text-ambar-500" aria-hidden="true" /> Cumpleaños de hoy
              </h2>
              {cumpleanosHoy.length > 0 && <Chip color="ambar">{cumpleanosHoy.length}</Chip>}
            </div>
            {cumpleanosHoy.length > 0 ? (
              <ul className="space-y-2">
                {cumpleanosHoy.map((a) => (
                  <li key={a.id} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-marino-800">🎉 {a.nombres} {a.apellidos}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-marino-500">Hoy no hay cumpleaños registrados.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-marino-900 mb-3">
              <AlertTriangle className="w-[18px] h-[18px] text-rojo-500" aria-hidden="true" /> Alumnos en riesgo
            </h2>
            {alertasRiesgo.length > 0 ? (
              <ul className="space-y-2">
                {alertasRiesgo.map((a) => (
                  <li key={a.alumno_id} className="rounded-xl bg-rojo-50 border border-rojo-100 px-3 py-2.5">
                    <p className="text-sm text-marino-900 font-semibold">{a.apellidos}, {a.nombres}</p>
                    <p className="text-xs text-rojo-500 font-medium mt-0.5">
                      {a.porcentaje_faltas >= 20 && `${a.porcentaje_faltas}% de faltas`}
                      {a.porcentaje_faltas >= 20 && a.promedio != null && a.promedio < 11 && ' • '}
                      {a.promedio != null && a.promedio < 11 && `Promedio ${a.promedio}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-marino-400 text-sm">Sin alertas: ningún alumno supera el 20% de faltas ni tiene promedio menor a 11.</p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-marino-900 mb-3">
              <Trophy className="w-[18px] h-[18px] text-ambar-500" aria-hidden="true" /> Cuadro de mérito
            </h2>
            {rankingAlumnos.length > 0 ? (
              <ul className="divide-y divide-marino-50">
                {rankingAlumnos.map((a, i) => (
                  <li key={a.id} className="flex items-center gap-3 py-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? 'bg-ambar-400 text-white' : 'bg-marino-50 text-marino-500'}`}>{i + 1}</span>
                    <span className="flex-1 min-w-0 text-sm text-marino-800 font-medium truncate">{a.apellidos}, {a.nombres}</span>
                    <span className="text-sm font-display font-semibold text-marino-700">{a.promedio}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-marino-400 text-sm">Aún no hay suficientes notas para armar el cuadro.</p>
            )}
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold text-marino-900 mb-4">Asistencia registrada</h2>
          {hayAsistencia ? (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosAsistencia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1fa" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7f8fc0' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#7f8fc0' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {datosAsistencia.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-marino-300 text-sm py-16 text-center">Aún no hay asistencia registrada este año.</p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-xl font-semibold text-marino-900 mb-4">Distribución de notas</h2>
          {hayNotas ? (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosNotas}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1fa" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#7f8fc0' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#7f8fc0' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#E4202A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-marino-300 text-sm py-16 text-center">Aún no hay notas registradas este año.</p>
          )}
        </Card>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-ambar-500" aria-hidden="true" />
          <h2 className="font-display text-xl font-semibold text-marino-900">Cobranza pendiente</h2>
        </div>
        {pagosPendientes.length > 0 ? (
          <ul className="divide-y divide-marino-50">
            {pagosPendientes.map((p) => (
              <li key={p.dni} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <p className="text-marino-800 font-medium">{p.apellidos}, {p.nombres}</p>
                  <p className="text-xs text-marino-400">DNI {p.dni} · {p.grado_nombre} "{p.seccion_nombre}"</p>
                </div>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-ambar-100 text-ambar-600">
                  Sin pago
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-marino-300 text-sm py-10 text-center">Todas las matrículas activas tienen un pago registrado.</p>
        )}
      </Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Atajo to="/admin/notas" icono={NotebookText} titulo="Notas y boletines" texto="Revisa y corrige las notas de todos los cursos y bimestres por sección." enlace="Gestionar notas" />
        <Atajo to="/admin/horarios" icono={CalendarClock} titulo="Horarios y cruces docentes" texto="Edita la grilla semanal y evita cruces de horario de los docentes." enlace="Consultar horarios" />
        <Atajo to="/admin/auditoria" icono={ShieldCheck} titulo="Auditoría y registro seguro" texto="Trazabilidad de cambios en notas y accesos de los usuarios." enlace="Ver registros" />
      </div>
    </div>
  );
}

function Atajo({ to, icono: Icono, titulo, texto, enlace }) {
  return (
    <Link to={to} className="group block">
      <Card className="p-5 h-full" hover>
        <span className="w-9 h-9 rounded-xl bg-marino-50 text-marino-700 flex items-center justify-center mb-3">
          <Icono className="w-[18px] h-[18px]" aria-hidden="true" />
        </span>
        <h3 className="font-display text-lg font-semibold text-marino-900 mb-1">{titulo}</h3>
        <p className="text-xs text-marino-500 leading-relaxed mb-3">{texto}</p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-marino-900">
          {enlace} <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </Card>
    </Link>
  );
}
