'use client'
import { useEffect, useState, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const UserContext = createContext(null);

export const useUser = () => useContext(UserContext);

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('=== ProtectedRoute onAuthStateChanged ===');
      console.log('User:', user?.uid, user?.email);
      
      if (user) {
        // Usuario autenticado, obtener su rol
        try {
          const userDoc = doc(db, 'usuarios', user.uid);
          const userSnap = await getDoc(userDoc);
          
          console.log('Documento usuario existe:', userSnap.exists());
          
          if (userSnap.exists()) {
            const data = userSnap.data();
            console.log('Datos del usuario:', data);
            setUserData({
              uid: user.uid,
              email: user.email,
              rol: data.rol || 'medico'
            });
            console.log('userData configurado como:', { uid: user.uid, email: user.email, rol: data.rol || 'medico' });
          } else {
            // Si no existe el documento, asignar rol de médico por defecto
            console.log('Documento no existe, asignando rol medico por defecto');
            setUserData({
              uid: user.uid,
              email: user.email,
              rol: 'medico'
            });
          }
          
          setAuthenticated(true);
        } catch (error) {
          console.error('Error al obtener datos del usuario:', error);
          setUserData({
            uid: user.uid,
            email: user.email,
            rol: 'medico'
          });
          setAuthenticated(true);
        }
        setLoading(false);
      } else {
        // Usuario no autenticado, redirigir al login
        console.log('Usuario no autenticado');
        setAuthenticated(false);
        setLoading(false);
        router.push('/');
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0D9498] mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // No mostrar nada mientras redirige
  }

  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
}
