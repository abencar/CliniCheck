import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request) {
  try {
    const { email, password, type } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Guardar el rol del usuario en Firestore
    const userDoc = doc(db, 'usuarios', userCredential.user.uid);
    await setDoc(userDoc, {
      email: userCredential.user.email,
      rol: type || 'medico', // o 'admin'
      createdAt: serverTimestamp()
    });
    
    return NextResponse.json(
      { 
        message: `Usuario ${type} creado exitosamente`,
        uid: userCredential.user.uid,
        email: userCredential.user.email
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    let errorMessage = 'Error al crear usuario';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Este correo electrónico ya está registrado';
        break;
      case 'auth/invalid-email':
        errorMessage = 'El correo electrónico no es válido';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        break;
      default:
        errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
