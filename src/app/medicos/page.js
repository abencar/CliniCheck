'use client'
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedRoute from '../../components/ProtectedRoute';

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
    if (!confirm('¿Estás seguro de que deseas eliminar este médico?')) {
      return;
    }

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

      alert('Médico eliminado exitosamente');
    } catch (err) {
      alert('Error al eliminar médico: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nombreConTitulo = formData.nombre.trim().startsWith('Dr. ') 
        ? formData.nombre 
        : `Dr. ${formData.nombre}`;

      const nombreExiste = medicos.some(
        medico => medico.nombre.toLowerCase() === nombreConTitulo.toLowerCase() 
                  && medico.id !== editingMedico?.id
      );
      
      if (nombreExiste) {
        alert('Ya existe un médico con ese nombre. Por favor, use un nombre diferente.');
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
        alert('Médico actualizado exitosamente');
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
        
        alert(`Médico creado exitosamente\n\nCredenciales de acceso:\nCorreo: ${correoGenerado}\nContraseña: ${passwordGenerada}\n\n⚠️ Guarda esta información, no se volverá a mostrar.`);
      }

      const medicosResponse = await fetch('/api/medicos');
      if (medicosResponse.ok) {
        const medicosData = await medicosResponse.json();
        setMedicos(medicosData);
      }

      handleCloseModal();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-200">
        <Sidebar />

        <main className="flex-1 p-8">
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

        <div className="bg-white rounded-xl shadow-lg p-6 border-4 border-[#0D9498]">
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
                className="flex items-center justify-between p-4 border-2 border-[#0D9498] rounded-lg hover:bg-gray-50 transition bg-white"
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
                    onClick={() => handleDelete(medico.id)}
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
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            onClick={handleCloseModal}>
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {editingMedico ? 'Editar Médico' : 'Agregar Nuevo Médico'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#0D9498] placeholder:text-gray-500 text-gray-900"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Especialidad
                  </label>
                  <select
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-4 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#0D9498] text-gray-900 bg-white appearance-none"
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 pt-6">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {!editingMedico && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Nota:</strong> Se generarán automáticamente las credenciales de acceso:
                    </p>
                    <ul className="text-xs text-blue-700 mt-2 ml-4 list-disc">
                      <li>Correo: nombre.apellido@clinicheck.com</li>
                      <li>Contraseña: Se generará automáticamente</li>
                    </ul>
                    <p className="text-xs text-blue-700 mt-2">
                      Las credenciales se mostrarán después de crear el médico.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#0D9498] text-white rounded-lg hover:bg-[#0a7377] font-medium transition"
                  >
                    {editingMedico ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
    </ProtectedRoute>
  );
};

export default Medicos;
