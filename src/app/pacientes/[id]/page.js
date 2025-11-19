'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ProtectedRoute, { useUser } from '../../../components/ProtectedRoute';
import toast from 'react-hot-toast';

const EstadisticasPaciente = () => {
  const params = useParams();
  const user = useUser();
  const router = useRouter();
  const pacienteId = params.id;

  const [paciente, setPaciente] = useState(null);
  const [medico, setMedico] = useState(null);
  const [respuestas, setRespuestas] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [encuestaAsignada, setEncuestaAsignada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [medicos, setMedicos] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    genero: '',
    ubicacion: '',
    telefono: '',
    encuestaId: '',
    medicoId: '',
    email: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let pacienteEncontrado = null;
        const pacientesRes = await fetch('/api/pacientes');
        if (pacientesRes.ok) {
          const pacientesData = await pacientesRes.json();
          pacienteEncontrado = pacientesData.find(p => p.id === pacienteId);
          setPaciente(pacienteEncontrado);

          if (pacienteEncontrado?.medicoId) {
            const medicosRes = await fetch('/api/medicos');
            if (medicosRes.ok) {
              const medicosData = await medicosRes.json();
              const medicoEncontrado = medicosData.find(m => m.id === pacienteEncontrado.medicoId);
              setMedico(medicoEncontrado);
            }
          }
        }

        const respuestasRes = await fetch('/api/respuestas');
        if (respuestasRes.ok) {
          const respuestasData = await respuestasRes.json();
          const respuestasPaciente = respuestasData.filter(r => r.pacienteId === pacienteEncontrado?.uid);
          setRespuestas(respuestasPaciente);
        }

        const encuestasRes = await fetch('/api/encuestas');
        if (encuestasRes.ok) {
          const encuestasData = await encuestasRes.json();
          setEncuestas(encuestasData);
          
          if (pacienteEncontrado?.encuestaId) {
            const encuestaDelPaciente = encuestasData.find(e => e.id === pacienteEncontrado.encuestaId);
            setEncuestaAsignada(encuestaDelPaciente);
          }
        }

        const medicosRes = await fetch('/api/medicos');
        if (medicosRes.ok) {
          const medicosData = await medicosRes.json();
          setMedicos(medicosData);
        }

      } catch (error) {
        // Error al cargar datos
      } finally {
        setLoading(false);
      }
    };

    if (pacienteId) {
      fetchData();
    }
  }, [pacienteId]);

  const isAdmin = user?.rol === 'admin';

  const handleOpenEdit = () => {
    if (!isAdmin) return;
    setFormData({
      nombre: paciente.nombre,
      edad: paciente.edad,
      genero: paciente.genero,
      ubicacion: paciente.ubicacion,
      telefono: paciente.telefono || '',
      encuestaId: paciente.encuestaId || '',
      medicoId: paciente.medicoId || '',
      email: paciente.email || ''
    });
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setSubmitting(true);

    try {
      const { email: unusedEmail, ...updatePayload } = formData;

      const response = await fetch(`/api/pacientes/${pacienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updatePayload, userUid: user?.uid }),
      });

      if (!response.ok) throw new Error('Error al actualizar paciente');

      setPaciente(prev => ({
        ...prev,
        ...updatePayload
      }));

      if (formData.medicoId) {
        const medicoEncontrado = medicos.find(m => m.id === formData.medicoId);
        setMedico(medicoEncontrado);
      }

      if (formData.encuestaId) {
        const encuestaEncontrada = encuestas.find(e => e.id === formData.encuestaId);
        setEncuestaAsignada(encuestaEncontrada);
      }

      setShowEditModal(false);
      toast.success('Paciente actualizado exitosamente');
    } catch (err) {
      toast.error('Error al actualizar paciente: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const calcularEstadisticasPorPregunta = () => {
    if (respuestas.length === 0) {
      return [];
    }

    const preguntasMap = new Map();

    respuestas.forEach((respuesta) => {
      const encuestaDeRespuesta = encuestas.find(e => e.id === respuesta.encuestaId);
      
      if (!encuestaDeRespuesta || !encuestaDeRespuesta.preguntas) {
        return;
      }

      Object.entries(respuesta.respuestas || {}).forEach(([key, valor]) => {
        const preguntaIndex = parseInt(key.split('_')[1]);
        const pregunta = encuestaDeRespuesta.preguntas[preguntaIndex];
        
        if (!pregunta) return;

        let tipoFinal = pregunta.tipo;
        if (!tipoFinal && !isNaN(valor)) {
          tipoFinal = 'numerica';
        }

        const preguntaKey = pregunta.texto;
        
        if (!preguntasMap.has(preguntaKey)) {
          preguntasMap.set(preguntaKey, {
            texto: pregunta.texto,
            tipo: tipoFinal,
            opciones: pregunta.opciones || [],
            respuestas: []
          });
        }
        
        preguntasMap.get(preguntaKey).respuestas.push(valor);
      });
    });

    const estadisticas = Array.from(preguntasMap.values()).map(preguntaData => {
      const { texto, tipo, opciones, respuestas: respuestasAPregunta } = preguntaData;

      if (tipo === 'opcion_multiple' || tipo === 'seleccion' || tipo === 'si-no') {
        const conteo = {};
        respuestasAPregunta.forEach(resp => {
          conteo[resp] = (conteo[resp] || 0) + 1;
        });

        const total = respuestasAPregunta.length || 1;
        const opcionesFinales = tipo === 'si-no' ? ['Sí', 'No'] : opciones;
        
        const distribucion = opcionesFinales.map(opcion => ({
          opcion,
          cantidad: conteo[opcion] || 0,
          porcentaje: Math.round(((conteo[opcion] || 0) / total) * 100)
        })).filter(item => item.porcentaje > 0);

        return {
          pregunta: texto,
          tipo: tipo,
          distribucion,
          totalRespuestas: respuestasAPregunta.length
        };
      } else if (tipo === 'numerica') {
        const valores = respuestasAPregunta.map(r => Number(r));
        const conteo = {};
        
        valores.forEach(valor => {
          conteo[valor] = (conteo[valor] || 0) + 1;
        });

        const total = valores.length || 1;
        
        const distribucion = Object.entries(conteo)
          .map(([valor, cantidad]) => ({
            opcion: valor,
            cantidad,
            porcentaje: Math.round((cantidad / total) * 100)
          }))
          .filter(item => item.porcentaje > 0)
          .sort((a, b) => Number(a.opcion) - Number(b.opcion));

        return {
          pregunta: texto,
          tipo: 'numerica',
          distribucion,
          totalRespuestas: respuestasAPregunta.length
        };
      } else {
        return {
          pregunta: texto,
          tipo: 'texto',
          respuestasRecientes: respuestasAPregunta.slice(-3),
          totalRespuestas: respuestasAPregunta.length
        };
      }
    });

    return estadisticas;
  };

  const estadisticas = calcularEstadisticasPorPregunta();

  if (loading) {
    return (
      <ProtectedRoute>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-gray-200 p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9498]"></div>
        </main>
      </ProtectedRoute>
    );
  }

  if (!paciente) {
    return (
      <ProtectedRoute>
        <Sidebar />
        <main className="ml-64 min-h-screen bg-gray-200 p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Paciente no encontrado</h1>
            <button
              onClick={() => router.push('/pacientes')}
              className="px-4 py-2 bg-[#0D9498] text-white rounded-lg hover:bg-[#0a7377]"
            >
              Volver a Pacientes
            </button>
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Sidebar />
      <main className="ml-64 min-h-screen bg-gray-200 p-8">
          <div className="mb-6">
            <button
              onClick={() => router.push('/pacientes')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver a Pacientes
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Estadísticas de {paciente.nombre}</h1>
            <p className="text-gray-600">Análisis detallado de cuestionarios y evolución</p>
          </div>
          {isAdmin && (
            <div className="flex gap-4 mb-6">
              <button
                onClick={async () => {
                  if (!window.confirm('¿Seguro que deseas eliminar este paciente? Esta acción no se puede deshacer.')) return;
                  try {
                    const res = await fetch(`/api/pacientes/${pacienteId}?userUid=${user?.uid}`, { method: 'DELETE' });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data?.error || 'Error al eliminar paciente');
                    toast.success('Paciente eliminado');
                    router.push('/pacientes');
                  } catch (err) {
                    toast.error(err.message);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Eliminar Paciente
              </button>
              <button 
                onClick={handleOpenEdit}
                className="px-4 py-2 bg-[#0D9498] text-white rounded-lg hover:bg-[#0a7377] flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editar Paciente
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg p-6 mb-6 shadow-md">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Nombre</p>
                  <p className="font-semibold text-gray-800">{paciente.nombre}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-semibold text-gray-800">{paciente.email || `${paciente.nombre.toLowerCase().replace(/\s+/g, '.') }@clinicheck.com`}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Edad</p>
                  <p className="font-semibold text-gray-800">{paciente.edad}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Género</p>
                  <p className="font-semibold text-gray-800">{paciente.genero}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Ubicación</p>
                  <p className="font-semibold text-gray-800">{paciente.ubicacion}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <p className="text-xs text-gray-500">Médico</p>
                  <p className="font-semibold text-gray-800">{medico ? medico.nombre : 'Sin asignar'}</p>
                </div>
              </div>
            </div>
          </div>

          {respuestas.length === 0 ? (
            <div className="bg-white rounded-lg p-8 shadow-md mb-6 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-lg">No hay respuestas para mostrar estadísticas</p>
              <p className="text-gray-400 text-sm mt-2">El paciente aún no ha respondido ninguna encuesta</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-3 gap-6 mb-6">
              {estadisticas.map((stat, index) => {
                if (stat.tipo === 'texto') return null;

                return (
                  <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col border border-gray-200">
                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-200">
                          <svg className="w-5 h-5 text-[#0D9498]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <h3 className="text-sm font-bold text-gray-800 flex-1">{stat.pregunta}</h3>
                      </div>
                    </div>
                    <div className="p-5 space-y-3 flex-1">
                      {stat.distribucion.map((item, idx) => {
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700">
                                {item.opcion}
                              </span>
                              <span className="text-lg font-bold text-gray-800">
                                {item.porcentaje}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-[#0D9498] h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${item.porcentaje}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
                      <p className="text-xs text-gray-600 text-center">
                        <span className="font-semibold">{stat.totalRespuestas}</span> {stat.totalRespuestas === 1 ? 'respuesta' : 'respuestas'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Cuestionarios</h3>
            
            {respuestas.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">No hay cuestionarios respondidos</p>
                <p className="text-gray-400 text-sm mt-2">Las respuestas del paciente aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-4">
                {respuestas.map((respuesta) => {
                  const fecha = respuesta.createdAt 
                    ? new Date(respuesta.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Fecha no disponible';

                  return (
                    <div key={respuesta.id} className="rounded-lg p-5 bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-300">
                        <h4 className="font-bold text-gray-800">{fecha}</h4>
                      </div>
                      
                      {!respuesta.respuestas ? (
                        <p className="text-gray-500">No hay respuestas en este cuestionario</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(respuesta.respuestas).map(([key, respuestaTexto], idx) => {
                            const encuestaDeRespuesta = encuestas.find(e => e.id === respuesta.encuestaId);
                            const preguntaIndex = parseInt(key.split('_')[1]);
                            const pregunta = encuestaDeRespuesta?.preguntas?.[preguntaIndex];
                            const textoPregunta = pregunta?.texto || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

                            return (
                              <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                <p className="text-sm text-gray-600 mb-2 font-medium">{textoPregunta}</p>
                                <p className="font-bold text-gray-900">{String(respuestaTexto)}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        {showEditModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-2xl font-bold text-gray-800">Editar Paciente</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdate} className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edad *
                  </label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Género *
                  </label>
                  <select
                    name="genero"
                    value={formData.genero}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900 bg-white"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación *
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900 bg-white"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email del paciente
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Médico asignado *
                  </label>
                  <select
                    name="medicoId"
                    value={formData.medicoId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900 bg-white"
                  >
                    <option value="">Seleccionar médico</option>
                    {medicos.map((medico) => (
                      <option key={medico.id} value={medico.id}>
                        {medico.nombre} {medico.especialidad && `- ${medico.especialidad}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pb-6 px-6 border-t border-gray-200 pt-4 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#0D9498] hover:bg-[#0a7377] text-white rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando...' : 'Actualizar Paciente'}
                </button>
              </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default function PacientePage() {
  return (
    <ProtectedRoute>
      <EstadisticasPaciente />
    </ProtectedRoute>
  );
}
