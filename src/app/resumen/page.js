'use client'
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';

const Resumen = () => {
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [respuestas, setRespuestas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const pacientesRes = await fetch('/api/pacientes');
        if (pacientesRes.ok) {
          const pacientesData = await pacientesRes.json();
          setPacientes(pacientesData);
        }

        const medicosRes = await fetch('/api/medicos');
        if (medicosRes.ok) {
          const medicosData = await medicosRes.json();
          setMedicos(medicosData);
        }

        const encuestasRes = await fetch('/api/encuestas');
        if (encuestasRes.ok) {
          const encuestasData = await encuestasRes.json();
          setEncuestas(encuestasData);
        }

        const citasRes = await fetch('/api/citas');
        if (citasRes.ok) {
          const citasData = await citasRes.json();
          setCitas(citasData);
        }

        const respuestasRes = await fetch('/api/respuestas');
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

  const citasPendientes = citas.filter(cita => cita.estado === 'Pendiente').length;

  const ultimasRespuestas = respuestas.slice(0, 5);
  const crearRespuestaPrueba = async () => {
    try {
      // Buscar el paciente específico
      const pacienteEspecifico = pacientes.find(p => p.id === '6emFrz1bJ4XoUNH0f8cr');
      
      if (!pacienteEspecifico) {
        alert('❌ No se encontró el paciente con ID: 6emFrz1bJ4XoUNH0f8cr');
        return;
      }

      if (!pacienteEspecifico.uid) {
        alert('❌ El paciente no tiene UID. Asegúrate de que tenga autenticación.');
        return;
      }

      if (encuestas.length === 0) {
        alert('No hay encuestas en la base de datos. Crea al menos una encuesta primero.');
        return;
      }

      let encuestaSeleccionada = encuestas.find(e => e.id === pacienteEspecifico.encuestaId);
      if (!encuestaSeleccionada) {
        encuestaSeleccionada = encuestas[Math.floor(Math.random() * encuestas.length)];
      }

      const respuestasPrueba = {};
      if (encuestaSeleccionada.preguntas && encuestaSeleccionada.preguntas.length > 0) {
        encuestaSeleccionada.preguntas.forEach((pregunta, index) => {
          const preguntaTexto = pregunta.texto?.toLowerCase() || '';
          
          if (pregunta.tipo === 'opcion_multiple' || pregunta.tipo === 'seleccion') {
            if (pregunta.opciones && pregunta.opciones.length > 0) {
              const opcionAleatoria = pregunta.opciones[Math.floor(Math.random() * pregunta.opciones.length)];
              respuestasPrueba[`pregunta_${index}`] = opcionAleatoria;
            } else {
              respuestasPrueba[`pregunta_${index}`] = 'Opción 1';
            }
          } else if (pregunta.tipo === 'escala') {
            const min = pregunta.min || 1;
            const max = pregunta.max || 10;
            
            let valorAleatorio;
            if (preguntaTexto.includes('dolor')) {
              valorAleatorio = Math.floor(Math.random() * 7) + 1;
            } else if (preguntaTexto.includes('satisfacción') || preguntaTexto.includes('calidad')) {
              valorAleatorio = Math.floor(Math.random() * 6) + 5;
            } else {
              valorAleatorio = Math.floor(Math.random() * (max - min + 1)) + min;
            }
            
            respuestasPrueba[`pregunta_${index}`] = valorAleatorio;
          } else if (pregunta.tipo === 'texto') {
            if (preguntaTexto.includes('dolor')) {
              const respuestasDolorPosibles = [
                'Dolor moderado en la zona lumbar',
                'Molestia leve que aparece al caminar',
                'Dolor punzante ocasional',
                'Me duele al hacer ciertos movimientos',
                'Es un dolor constante pero tolerable'
              ];
              respuestasPrueba[`pregunta_${index}`] = respuestasDolorPosibles[Math.floor(Math.random() * respuestasDolorPosibles.length)];
            } else if (preguntaTexto.includes('sueño') || preguntaTexto.includes('dorm')) {
              const respuestasSuenoPosibles = [
                'Duermo bien, sin interrupciones',
                'Me despierto una o dos veces en la noche',
                'Tengo dificultad para conciliar el sueño',
                'Duermo aproximadamente 7 horas',
                'Me siento descansado al despertar'
              ];
              respuestasPrueba[`pregunta_${index}`] = respuestasSuenoPosibles[Math.floor(Math.random() * respuestasSuenoPosibles.length)];
            } else if (preguntaTexto.includes('dato') || preguntaTexto.includes('añadir') || preguntaTexto.includes('comentario')) {
              const respuestasGeneralesPosibles = [
                'Todo bien en general',
                'He notado mejoría en los últimos días',
                'Me siento mejor que la semana pasada',
                'No tengo nada adicional que reportar',
                'Seguiré las indicaciones del médico'
              ];
              respuestasPrueba[`pregunta_${index}`] = respuestasGeneralesPosibles[Math.floor(Math.random() * respuestasGeneralesPosibles.length)];
            } else {
              respuestasPrueba[`pregunta_${index}`] = 'Respuesta de prueba automática';
            }
          } else {
            respuestasPrueba[`pregunta_${index}`] = 'Respuesta de prueba';
          }
        });
      } else {
        respuestasPrueba.ejemplo = 'Esta es una respuesta de prueba generada automáticamente';
      }

      const respuestaPrueba = {
        pacienteId: pacienteEspecifico.uid,
        encuestaId: encuestaSeleccionada.id,
        respuestas: respuestasPrueba
      };

      const response = await fetch('/api/respuestas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(respuestaPrueba)
      });

      if (response.ok) {
        alert(`✅ Respuesta de prueba creada:\n\nPaciente: ${pacienteEspecifico.nombre}\nEncuesta: ${encuestaSeleccionada.nombre}`);
        
        const respuestasRes = await fetch('/api/respuestas');
        if (respuestasRes.ok) {
          const respuestasData = await respuestasRes.json();
          setRespuestas(respuestasData);
        }
      } else {
        const errorData = await response.json();
        alert(`❌ Error al crear respuesta de prueba:\n${errorData.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al crear respuesta de prueba');
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-200">
        <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Bienvenido, Dr. Admin</h1>
          <p className="text-gray-600 text-lg">Panel de administración</p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-400 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total de pacientes</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : pacientes.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-400 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Total de médicos</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : medicos.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-pink-400 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Encuestas creadas</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : encuestas.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-400 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Citas pendientes</p>
                <p className="text-3xl font-bold text-gray-800">
                  {loading ? '...' : citasPendientes}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-[#0D9498]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">Últimas 5 encuestas respondidas</h3>
            <button
              onClick={crearRespuestaPrueba}
              disabled={loading}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear respuesta de prueba
            </button>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9498]"></div>
              </div>
            ) : ultimasRespuestas.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg font-medium">No hay encuestas respondidas</p>
                <p className="text-gray-400 text-sm mt-2">Las respuestas de los pacientes aparecerán aquí cuando las envíen desde la app móvil</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ultimasRespuestas.map((respuesta) => {
                  const paciente = pacientes.find(p => p.uid === respuesta.pacienteId);
                  const encuesta = encuestas.find(e => e.id === respuesta.encuestaId);
                  const fechaRespuesta = respuesta.createdAt 
                    ? new Date(respuesta.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })
                    : 'Fecha no disponible';
                  
                  return (
                    <div 
                      key={respuesta.id}
                      className="flex items-center justify-between p-4 bg-white border-2 border-[#0D9498] rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0D9498] rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <span className="font-semibold text-gray-900 text-lg">
                          {paciente ? paciente.nombre : 'Paciente desconocido'}
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        Último cuestionario {fechaRespuesta}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default Resumen;
