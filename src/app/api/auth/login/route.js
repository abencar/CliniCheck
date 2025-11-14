import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '@/lib/firebase';

const FIREBASE_LOGIN_URL = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;

/**
 * Inicia sesión para pacientes utilizando Firebase Authentication y valida su rol.
 */
export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const firebaseResponse = await fetch(FIREBASE_LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const firebaseData = await firebaseResponse.json();

    if (!firebaseResponse.ok) {
      const errorMessage = mapFirebaseError(firebaseData?.error?.message);
      const statusCode = firebaseData?.error?.message === 'EMAIL_NOT_FOUND' || firebaseData?.error?.message === 'INVALID_PASSWORD'
        ? 401
        : firebaseData?.error?.message === 'USER_DISABLED'
          ? 403
          : 500;

      return NextResponse.json(
        { error: errorMessage },
        { status: statusCode }
      );
    }

    const { localId: uid, idToken, refreshToken, expiresIn } = firebaseData;

    const userDocRef = doc(db, 'usuarios', uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return NextResponse.json(
        { error: 'No se encontró la información del usuario' },
        { status: 404 }
      );
    }

    const userData = userSnap.data();

    if ((userData?.rol || '').toLowerCase() !== 'paciente') {
      return NextResponse.json(
        { error: 'Este usuario no tiene permisos de paciente' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: 'Login exitoso',
        uid,
        email,
        rol: userData.rol,
        idToken,
        refreshToken,
        expiresIn,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}

function mapFirebaseError(code = '') {
  switch (code) {
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
      return 'Correo o contraseña incorrectos';
    case 'USER_DISABLED':
      return 'La cuenta ha sido deshabilitada';
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return 'Demasiados intentos fallidos. Intenta nuevamente más tarde';
    default:
      return 'Error al iniciar sesión';
  }
}
