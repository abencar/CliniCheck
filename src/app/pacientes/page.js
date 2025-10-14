'use client'
import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';

const Pacientes = () => {
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    genero: '',
    ubicacion: '',
    telefono: '',
    encuestaId: '',
    medicoId: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  const [busqueda, setBusqueda] = useState('');
  const [filtroEdad, setFiltroEdad] = useState('');
  const [filtroGenero, setFiltroGenero] = useState('');
  const [filtroUbicacion, setFiltroUbicacion] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const pacientesRes = await fetch('/api/pacientes');
        if (!pacientesRes.ok) throw new Error('Error al cargar pacientes');
        const pacientesData = await pacientesRes.json();
        setPacientes(pacientesData);

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
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nombre: '',
      edad: '',
      genero: '',
      ubicacion: '',
      telefono: '',
      encuestaId: '',
      medicoId: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Error al crear paciente');

      const pacientesResponse = await fetch('/api/pacientes');
      const pacientesData = await pacientesResponse.json();
      setPacientes(pacientesData);

      handleCloseModal();
      alert('Paciente creado exitosamente');
    } catch (err) {
      console.error('Error:', err);
      alert('Error al crear paciente: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEdad('');
    setFiltroGenero('');
    setFiltroUbicacion('');
  };

  const ubicacionesUnicas = [...new Set(pacientes.map(p => p.ubicacion))].filter(Boolean).sort();

  const pacientesFiltrados = pacientes.filter(paciente => {
    const email = paciente.nombre.toLowerCase().replace(/\s+/g, '.') + '@gmail.com';
    const coincideBusqueda = busqueda === '' || 
      paciente.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      email.toLowerCase().includes(busqueda.toLowerCase());

    let coincideEdad = true;
    if (filtroEdad === '0-18') {
      coincideEdad = paciente.edad <= 18;
    } else if (filtroEdad === '19-40') {
      coincideEdad = paciente.edad >= 19 && paciente.edad <= 40;
    } else if (filtroEdad === '41-65') {
      coincideEdad = paciente.edad >= 41 && paciente.edad <= 65;
    } else if (filtroEdad === '65+') {
      coincideEdad = paciente.edad > 65;
    }

    const coincideGenero = filtroGenero === '' || paciente.genero === filtroGenero;

    const coincideUbicacion = filtroUbicacion === '' || paciente.ubicacion === filtroUbicacion;

    return coincideBusqueda && coincideEdad && coincideGenero && coincideUbicacion;
  });

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-200">
        <Sidebar />

        <main className="flex-1 p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Gestión de pacientes</h1>
                <p className="text-gray-600">Administra y supervisa a todos los pacientes</p>
              </div>
              <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-[#0D9498] hover:bg-[#0a7377] text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar Paciente
              </button>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <div className="relative">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o email"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                    />
                  </div>
                </div>
                <button 
                  onClick={limpiarFiltros}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Limpiar filtros
                </button>
              </div>
              
              <div className="flex gap-4 mt-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Rango de edad</label>
                  <select 
                    value={filtroEdad}
                    onChange={(e) => setFiltroEdad(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9498]"
                  >
                    <option value="">Todas las edades</option>
                    <option value="0-18">0-18</option>
                    <option value="19-40">19-40</option>
                    <option value="41-65">41-65</option>
                    <option value="65+">65+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Género</label>
                  <select 
                    value={filtroGenero}
                    onChange={(e) => setFiltroGenero(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9498]"
                  >
                    <option value="">Todos los géneros</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ubicación</label>
                  <select 
                    value={filtroUbicacion}
                    onChange={(e) => setFiltroUbicacion(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#0D9498]"
                  >
                    <option value="">Todas las ubicaciones</option>
                    {ubicacionesUnicas.map((ubicacion) => (
                      <option key={ubicacion} value={ubicacion}>{ubicacion}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600">Mostrando {pacientesFiltrados.length} de {pacientes.length} pacientes</p>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="bg-white rounded-lg p-8 text-center text-gray-600 shadow-sm">
                Cargando pacientes...
              </div>
            )}
            
            {error && (
              <div className="bg-white rounded-lg p-8 text-center text-red-600 shadow-sm">
                Error: {error}
              </div>
            )}
            
            {!loading && !error && pacientes.length === 0 && (
              <div className="bg-white rounded-lg p-8 text-center text-gray-600 shadow-sm">
                No hay pacientes registrados
              </div>
            )}
            
            {!loading && !error && pacientesFiltrados.map((paciente) => {
              const medico = medicos.find(m => m.id === paciente.medicoId);
              const encuesta = encuestas.find(e => e.id === paciente.encuestaId);
              
              return (
                <div 
                  key={paciente.id}
                  className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full bg-[#0D9498] flex items-center justify-center flex-shrink-0">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>

                      <div className="flex-1 grid grid-cols-5 gap-4 items-center">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{paciente.nombre}</p>
                          <p className="text-sm text-gray-500 truncate">{paciente.nombre.toLowerCase().replace(/\s+/g, '.')}@gmail.com</p>
                          <p className="text-sm text-gray-500 truncate">{paciente.ubicacion}</p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Edad</p>
                          <p className="text-gray-800">{paciente.edad}</p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Género</p>
                          <p className="text-gray-800 truncate">{paciente.genero}</p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Médico</p>
                          <p className="text-gray-800 truncate">{medico ? medico.nombre : 'Sin asignar'}</p>
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">Cuestionarios</p>
                          <p className="text-gray-800">10</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => window.location.href = `/pacientes/${paciente.id}`}
                      className="px-4 py-2 text-[#0D9498] hover:bg-[#0D9498] hover:text-white border border-[#0D9498] rounded-lg transition font-medium"
                    >
                      Ver estadísticas
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {showModal && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
              onClick={handleCloseModal}
            >
              <div 
                className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800">Agregar Nuevo Paciente</h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo *
                      </label>
                      <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                        placeholder="Nombre del paciente"
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
                        min="0"
                        max="120"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                        placeholder="Edad"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      >
                        <option value="">Seleccionar género</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="Otro">Otro</option>
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                        placeholder="Ciudad o región"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                        placeholder="Número de teléfono"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Médico Asignado *
                      </label>
                      <select
                        name="medicoId"
                        value={formData.medicoId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      >
                        <option value="">Seleccionar médico</option>
                        {medicos.map(medico => (
                          <option key={medico.id} value={medico.id}>
                            {medico.nombre} - {medico.especialidad}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Encuesta Asignada *
                      </label>
                      <select
                        name="encuestaId"
                        value={formData.encuestaId}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      >
                        <option value="">Seleccionar encuesta</option>
                        {encuestas.map(encuesta => (
                          <option key={encuesta.id} value={encuesta.id}>
                            {encuesta.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </form>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-2 bg-[#0D9498] hover:bg-[#0a7377] text-white rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Creando...' : 'Crear Paciente'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Pacientes;
