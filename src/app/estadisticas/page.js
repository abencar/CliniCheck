'use client'
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Estadisticas = () => {
  const [encuestas, setEncuestas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState('');
  const [filtroEdad, setFiltroEdad] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroEncuesta, setFiltroEncuesta] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [encuestasRes, pacientesRes, respuestasRes] = await Promise.all([
          fetch('/api/encuestas'),
          fetch('/api/pacientes'),
          fetch('/api/respuestas')
        ]);

        if (encuestasRes.ok) {
          const encuestasData = await encuestasRes.json();
          setEncuestas(encuestasData);
          if (encuestasData.length > 0) {
            setEncuestaSeleccionada(encuestasData[0].id);
            setFiltroEncuesta(encuestasData[0].id);
          }
        }

        if (pacientesRes.ok) {
          const pacientesData = await pacientesRes.json();
          setPacientes(pacientesData);
        }

        if (respuestasRes.ok) {
          const respuestasData = await respuestasRes.json();
          setRespuestas(respuestasData);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const limpiarFiltros = () => {
    setFiltroEdad('');
    setFiltroGenero('');
    setFiltroUbicacion('');
    setFiltroEncuesta('');
  };

  const ubicacionesUnicas = [...new Set(pacientes.map(p => p.ubicacion))].filter(Boolean).sort();

  const respuestasFiltradas = respuestas.filter(respuesta => {
    const paciente = pacientes.find(p => p.uid === respuesta.pacienteId);
    if (!paciente) return false;

    const coincideEncuesta = !filtroEncuesta || respuesta.encuestaId === filtroEncuesta;

    let coincideEdad = true;
    if (filtroEdad === '0-18') coincideEdad = paciente.edad <= 18;
    else if (filtroEdad === '19-40') coincideEdad = paciente.edad >= 19 && paciente.edad <= 40;
    else if (filtroEdad === '41-65') coincideEdad = paciente.edad >= 41 && paciente.edad <= 65;
    else if (filtroEdad === '65+') coincideEdad = paciente.edad > 65;

    const coincideGenero = !filtroGenero || paciente.genero === filtroGenero;
    const coincideUbicacion = !filtroUbicacion || paciente.ubicacion === filtroUbicacion;

    return coincideEncuesta && coincideEdad && coincideGenero && coincideUbicacion;
  });

  const encuestaActual = encuestas.find(e => e.id === encuestaSeleccionada);

  const calcularEstadisticasGraficas = () => {
    if (!encuestaActual || respuestasFiltradas.length === 0) {
      return { totalPacientes: 0, edadPromedio: 0, generoPredominante: 'N/A', ubicacionComun: 'N/A' };
    }
    const pacientesIds = [...new Set(respuestasFiltradas.map(r => r.pacienteId))];
    const pacientesUnicos = pacientes.filter(p => pacientesIds.includes(p.uid));
    const edades = pacientesUnicos.map(p => p.edad).filter(e => e);
    const edadPromedio = edades.length > 0 ? (edades.reduce((sum, edad) => sum + edad, 0) / edades.length).toFixed(1) : 0;

    const generos = {};
    pacientesUnicos.forEach(p => { if (p.genero) generos[p.genero] = (generos[p.genero] || 0) + 1; });
    const generoPredominante = Object.keys(generos).length > 0 ? Object.keys(generos).reduce((a, b) => generos[a] > generos[b] ? a : b) : 'N/A';

    const ubicaciones = {};
    pacientesUnicos.forEach(p => { if (p.ubicacion) ubicaciones[p.ubicacion] = (ubicaciones[p.ubicacion] || 0) + 1; });
    const ubicacionComun = Object.keys(ubicaciones).length > 0 ? Object.keys(ubicaciones).reduce((a, b) => ubicaciones[a] > ubicaciones[b] ? a : b) : 'N/A';

    return { totalPacientes: pacientesIds.length, edadPromedio, generoPredominante, ubicacionComun };
  };

  const estadisticas = calcularEstadisticasGraficas();

  const generarDatosGrafica = (pregunta, index) => {
    const respuestasPregunta = respuestasFiltradas.map(r => r.respuestas?.[`pregunta_${index}`]).filter(r => r !== undefined && r !== null && r !== '');
    if (pregunta.tipo === 'numerica' || pregunta.tipo === 'escala') {
      const conteo = {}; for (let i = 1; i <= 10; i++) conteo[i] = 0;
      respuestasPregunta.forEach(valor => { if (typeof valor === 'number') conteo[valor] = (conteo[valor] || 0) + 1; });
      return { labels: Object.keys(conteo), datasets: [{ label: 'Cantidad de respuestas', data: Object.values(conteo), backgroundColor: ['#60A5FA', '#34D399', '#FBBF24', '#F87171', '#A78BFA', '#EC4899', '#14B8A6', '#F59E0B', '#10B981', '#3B82F6'] }] };
    } else if (pregunta.tipo === 'seleccion' || pregunta.tipo === 'opcion_multiple') {
      const conteo = {}; pregunta.opciones?.forEach(opcion => { conteo[opcion] = 0; });
      respuestasPregunta.forEach(valor => { if (conteo.hasOwnProperty(valor)) conteo[valor]++; });
      return { labels: Object.keys(conteo), datasets: [{ data: Object.values(conteo), backgroundColor: ['#22C55E', '#F59E0B', '#EF4444', '#3B82F6', '#A78BFA', '#EC4899'] }] };
    } else if (pregunta.tipo === 'si-no') {
      const conteo = { 'Sí': 0, 'No': 0 };
      respuestasPregunta.forEach(valor => {
        const v = typeof valor === 'string' ? valor.toLowerCase() : '';
        if (v === 'sí' || v === 'si') conteo['Sí']++;
        else if (v === 'no') conteo['No']++;
      });
      return { labels: Object.keys(conteo), datasets: [{ label: 'Cantidad de respuestas', data: Object.values(conteo), backgroundColor: ['#22C55E', '#EF4444'] }] };
    }
    return null;
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-200">
        <Sidebar />
        <main className="flex-1 p-8 ml-64">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Estadísticas de Estado de Salud</h1>
            <p className="text-gray-600">Análisis del bienestar de los pacientes con filtros demográficos</p>
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#0D9498]"></div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#0D9498] to-[#0a7579] rounded-lg flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Filtros Demográficos</h3>
                  </div>
                  <button onClick={limpiarFiltros} className="flex items-center gap-2 px-4 py-2 text-[#0D9498] bg-[#0D9498]/5 rounded-lg hover:bg-[#0D9498] hover:text-white transition-all duration-200 text-sm font-medium shadow-sm hover:shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Limpiar filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">Rango de edad</label>
                    <select value={filtroEdad} onChange={(e) => setFiltroEdad(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white">
                      <option value="">Todas las edades</option>
                      <option value="0-18">0-18 años</option>
                      <option value="19-40">19-40 años</option>
                      <option value="41-65">41-65 años</option>
                      <option value="65+">65+ años</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">Género</label>
                    <select value={filtroGenero} onChange={(e) => setFiltroGenero(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white">
                      <option value="">Todos los géneros</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Femenino">Femenino</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">Ubicación</label>
                    <select value={filtroUbicacion} onChange={(e) => setFiltroUbicacion(e.target.value)} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white">
                      <option value="">Todas las ubicaciones</option>
                      {ubicacionesUnicas.map((ubicacion) => (<option key={ubicacion} value={ubicacion}>{ubicacion}</option>))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">Encuesta</label>
                    <select value={filtroEncuesta} onChange={(e) => { setFiltroEncuesta(e.target.value); setEncuestaSeleccionada(e.target.value); }} className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#0D9498] focus:ring-2 focus:ring-[#0D9498]/20 transition-all bg-gray-50 hover:bg-white">
                      {encuestas.map((encuesta) => (<option key={encuesta.id} value={encuesta.id}>{encuesta.nombre}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                    <div><p className="text-xs text-gray-600">Pacientes Evaluados</p><p className="text-2xl font-bold text-[#0D9498]">{estadisticas.totalPacientes}</p></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-400 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    <div><p className="text-xs text-gray-600">Edad Promedio</p><p className="text-2xl font-bold text-green-600">{estadisticas.edadPromedio} años</p></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                    <div><p className="text-xs text-gray-600">Género Predominante</p><p className="text-2xl font-bold text-pink-600">{estadisticas.generoPredominante}</p></div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center"><svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 3.87 7 13 7 13s7-9.13 7-13c0-3.87-3.13-7-7-7z" /></svg></div>
                    <div><p className="text-xs text-gray-600">Ubicación Más Común</p><p className="text-2xl font-bold text-yellow-600">{estadisticas.ubicacionComun}</p></div>
                  </div>
                </div>
              </div>

              {encuestaActual && encuestaActual.preguntas && encuestaActual.preguntas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {encuestaActual.preguntas.map((pregunta, index) => {
                    const datosGrafica = generarDatosGrafica(pregunta, index);
                    if (!datosGrafica) return null;
                    return (
                      <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                        <h3 className="text-sm font-semibold mb-3 text-gray-700">{pregunta.texto}</h3>
                        <div className="h-64">
                          {pregunta.tipo === 'numerica' || pregunta.tipo === 'escala' ? (
                            <Bar data={datosGrafica} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, title: { display: false } } }} />
                          ) : (
                            <Pie data={datosGrafica} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }, title: { display: false } } }} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 text-center mt-10">No hay preguntas para mostrar</p>
              )}
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Estadisticas;
