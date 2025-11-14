'use client'
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';
import RoleProtection from '../../components/RoleProtection';
import toast from 'react-hot-toast';

const Medicos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMedico, setEditingMedico] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [medicoToDelete, setMedicoToDelete] = useState(null);

  useEffect(() => {
    const fetchMedicos = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/medicos');
        if (!response.ok) throw new Error('Error al cargar médicos');
        const data = await response.json();
        setMedicos(data);
      } catch (err) {
        setError(err.message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const medicosFiltrados = medicos.filter(medico => 
    medico.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (medico) => {
    setEditingMedico(medico);
    const nombreSinTitulo = medico.nombre.startsWith('Dr. ') 
      ? medico.nombre.substring(4) 
      : medico.nombre;
    setFormData({
      nombre: nombreSinTitulo,
      especialidad: medico.especialidad || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMedico(null);
    setFormData({
      nombre: '',
      especialidad: ''
    });
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`/api/medicos/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Error al eliminar médico');

      const medicosResponse = await fetch('/api/medicos');
      if (medicosResponse.ok) {
        const medicosData = await medicosResponse.json();
        setMedicos(medicosData);
      }

      setShowDeleteModal(false);
      setMedicoToDelete(null);
      toast('Médico eliminado exitosamente', {
        icon: '🗑️',
        style: {
          border: '1px solid #DC2626',
          background: '#FEE2E2',
          color: '#991B1B',
        },
      });
    } catch (err) {
      toast.error('Error al eliminar médico: ' + err.message);
    }
  };

  const handleDeleteClick = (medico) => {
    setMedicoToDelete(medico);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const nombreConTitulo = formData.nombre.trim().startsWith('Dr. ') 
        ? formData.nombre 
        : `Dr. ${formData.nombre}`;

      const nombreExiste = medicos.some(
        medico => medico.nombre.toLowerCase() === nombreConTitulo.toLowerCase() 
                  && medico.id !== editingMedico?.id
      );
      
      if (nombreExiste) {
        toast.error('Ya existe un médico con ese nombre. Por favor, use un nombre diferente.');
        return;
      }

      if (editingMedico) {
        const dataToUpdate = {
          nombre: nombreConTitulo,
          especialidad: formData.especialidad
        };

        const response = await fetch(`/api/medicos/${editingMedico.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataToUpdate),
        });

        if (!response.ok) throw new Error('Error al actualizar el médico');
        setSuccessData({
          mensaje: '¡Médico actualizado exitosamente!'
        });
        setShowSuccessModal(true);
      } else {
        const nombreLimpio = formData.nombre.trim().toLowerCase().replace(/\s+/g, '.');
        const correoGenerado = `${nombreLimpio}@clinicheck.com`;
        
        const passwordGenerada = `Clinicheck${Math.floor(1000 + Math.random() * 9000)}`;

        const authResponse = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: correoGenerado,
            password: passwordGenerada,
            type: 'medico'
          }),
        });

        if (!authResponse.ok) {
          const errorData = await authResponse.json();
          throw new Error(errorData.error || 'Error al crear el usuario');
        }

        const authData = await authResponse.json();

        const response = await fetch('/api/medicos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: nombreConTitulo,
            especialidad: formData.especialidad,
            uid: authData.uid
          })
        });

        if (!response.ok) throw new Error('Error al crear el médico');
        
        setSuccessData({
          mensaje: '¡Médico creado exitosamente!',
          credenciales: {
            correo: correoGenerado,
            password: passwordGenerada
          }
        });
        setShowSuccessModal(true);
      }

      const medicosResponse = await fetch('/api/medicos');
      if (medicosResponse.ok) {
        const medicosData = await medicosResponse.json();
        setMedicos(medicosData);
      }

      handleCloseModal();
    } catch (err) {
      toast.error('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <RoleProtection allowedRoles={['admin']}>
        <div className="flex min-h-screen bg-gray-200">
          <Sidebar />

        <main className="flex-1 p-8 ml-64">
          <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Gestión de médicos</h1>
            <p className="text-gray-600">Administra el equipo médico de la clínica</p>
          </div>
          <button className="flex items-center gap-2 bg-[#0D9498] hover:bg-[#0a7377] text-white px-4 py-2 rounded-lg font-medium transition"
            onClick={() => setShowModal(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar Médico
          </button>
        </div>

        <div className="mb-4">
          <div className="relative max-w-md">
            <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-[#0D9498] rounded-full focus:outline-none focus:ring-2 focus:ring-[#0D9498] placeholder:text-gray-500 bg-white text-gray-900"
            />
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <span className="text-gray-600 text-sm">Mostrando {medicosFiltrados.length} de {medicos.length} médicos</span>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {loading && (
            <div className="p-8 text-center text-gray-600">
              Cargando médicos...
            </div>
          )}
          
          {error && (
            <div className="p-8 text-center text-red-600">
              Error: {error}
            </div>
          )}
          
          {!loading && !error && medicos.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              No hay médicos registrados
            </div>
          )}
          
          {!loading && !error && medicos.length > 0 && medicosFiltrados.length === 0 && (
            <div className="p-8 text-center text-gray-600">
              No se encontraron médicos con ese nombre
            </div>
          )}
          
          <div className="space-y-3">
            {!loading && !error && medicosFiltrados.map((medico) => (
              <div 
                key={medico.id}
                className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition bg-white border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0D9498] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-lg">{medico.nombre}</p>
                    {medico.especialidad && (
                      <p className="text-sm text-gray-600">{medico.especialidad}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick(medico)}
                    className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600"
                    title="Editar médico">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(medico)}
                    className="p-2 hover:bg-red-50 rounded-lg transition text-red-600"
                    title="Eliminar médico">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-[#0D9498]/20 bg-[#0D9498] rounded-t-lg">
                <h2 className="text-2xl font-bold text-white">
                  {editingMedico ? 'Editar Médico' : 'Agregar Nuevo Médico'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-white/70 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Sección de información básica */}
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Información del Médico</h3>
                    
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
                        placeholder="Dr. Juan Pérez"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Especialidad *
                      </label>
                      <select
                        name="especialidad"
                        value={formData.especialidad}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9498] text-gray-900"
                      >
                        <option value="">Selecciona una especialidad</option>
                        <option value="Medicina General">Medicina General</option>
                        <option value="Pediatría">Pediatría</option>
                        <option value="Cardiología">Cardiología</option>
                        <option value="Dermatología">Dermatología</option>
                        <option value="Ginecología">Ginecología</option>
                        <option value="Traumatología">Traumatología</option>
                        <option value="Otra">Otra</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
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
                  className="px-6 py-2 bg-[#0D9498] hover:bg-[#0a7377] text-white rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingMedico ? 'Actualizando...' : 'Creando...'}
                    </>
                  ) : (
                    <>{editingMedico ? 'Actualizar Médico' : 'Crear Médico'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de éxito */}
        {showSuccessModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccessModal(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-6 border-b border-[#0D9498]/20 bg-[#0D9498] rounded-t-lg">
                <h2 className="text-2xl font-bold text-white">
                  {successData?.mensaje}
                </h2>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-white/70 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {successData?.credenciales && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-[#0D9498]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Credenciales de Acceso</h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Correo electrónico</p>
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-gray-900 bg-white p-2 rounded border border-gray-200">
                                {successData.credenciales.correo}
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(successData.credenciales.correo);
                                  toast.success('Correo copiado al portapapeles');
                                }}
                                className="p-2 text-gray-500 hover:text-[#0D9498] hover:bg-[#0D9498]/10 rounded-lg transition-colors"
                                title="Copiar correo"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">Contraseña temporal</p>
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-gray-900 font-mono bg-white p-2 rounded border border-gray-200">
                                {successData.credenciales.password}
                              </p>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(successData.credenciales.password);
                                  toast.success('Contraseña copiada al portapapeles');
                                }}
                                className="p-2 text-gray-500 hover:text-[#0D9498] hover:bg-[#0D9498]/10 rounded-lg transition-colors"
                                title="Copiar contraseña"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <p className="text-sm text-yellow-800">
                              Guarda esta información de forma segura. No se volverá a mostrar.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-6 py-2 bg-[#0D9498] hover:bg-[#0a7377] text-white rounded-lg transition"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && medicoToDelete && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div 
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Confirmar eliminación</h2>
                  <p className="text-sm text-gray-600 mt-1">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="p-6">
                <p className="text-gray-700 mb-2">
                  ¿Estás seguro de que deseas eliminar al siguiente médico?
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4">
                  <p className="font-semibold text-gray-800">{medicoToDelete.nombre}</p>
                  {medicoToDelete.especialidad && (
                    <p className="text-sm text-gray-600">{medicoToDelete.especialidad}</p>
                  )}
                </div>
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Advertencia:</strong> Se eliminarán todos los datos relacionados con este médico.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setMedicoToDelete(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(medicoToDelete.id)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar Médico
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
      </RoleProtection>
    </ProtectedRoute>
  );
};

export default Medicos;
