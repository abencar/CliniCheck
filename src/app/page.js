'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      router.push('/resumen');
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      switch (error.code) {
        case 'auth/invalid-email':
          setError('El correo electrónico no es válido.');
          break;
        case 'auth/user-not-found':
          setError('No existe una cuenta con este correo.');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta.');
          break;
        case 'auth/invalid-credential':
          setError('Credenciales inválidas. Verifica tu correo y contraseña.');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos fallidos. Intenta más tarde.');
          break;
        default:
          setError('Error al iniciar sesión. Intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D9498] flex flex-col items-center justify-center">
      <h1 className="text-white text-6xl font-bold mb-2 drop-shadow-lg">
        CliniCheck
      </h1>
      
      <p className="text-white/90 text-xl mb-8 drop-shadow-lg">
        Sistema de seguimiento de pacientes
      </p>

      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22A1A7] focus:border-transparent transition placeholder:text-gray-400 text-gray-900"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#22A1A7] focus:border-transparent transition placeholder:text-gray-400 text-gray-900"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#22A1A7] hover:bg-[#1a8087] text-white font-medium py-3 rounded-md transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>

      <div className="mt-8">
        <svg 
          className="w-16 h-16 text-white drop-shadow-lg" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
          />
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 12l2 2 4-4" 
          />
        </svg>
      </div>
    </div>
  );
};

export default Login;
