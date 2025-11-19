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
      if (user) {

        try {
          const userDoc = doc(db, 'usuarios', user.uid);
          const userSnap = await getDoc(userDoc);
          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData({
              uid: user.uid,
              email: user.email,
              rol: data.rol || 'medico'
            });
          } else {

            setUserData({
              uid: user.uid,
              email: user.email,
              rol: 'medico'
            });
          }
          setAuthenticated(true);
        } catch (error) {
          setUserData({
            uid: user.uid,
            email: user.email,
            rol: 'medico'
          });
          setAuthenticated(true);
        }
        setLoading(false);
      } else {

        setAuthenticated(false);
        setLoading(false);
        router.push('/');
      }
    });

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
    return null; 
  }

  return (
    <UserContext.Provider value={userData}>
      {children}
    </UserContext.Provider>
  );
}
