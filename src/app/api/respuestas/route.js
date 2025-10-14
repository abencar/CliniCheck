import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy, limit, where } from 'firebase/firestore';

export async function GET(request) {
  try {
    const respuestasRef = collection(db, 'respuestas');
    const q = query(respuestasRef, orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    
    const respuestas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString()
    }));

    return NextResponse.json(respuestas);
  } catch (error) {
    console.error('Error fetching respuestas:', error);
    return NextResponse.json(
      { error: 'Error al obtener respuestas' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    if (!body.pacienteId || !body.encuestaId) {
      return NextResponse.json(
        { error: 'Se requiere pacienteId y encuestaId' },
        { status: 400 }
      );
    }

    const pacientesRef = collection(db, 'pacientes');
    const pacienteQuery = query(pacientesRef, where('uid', '==', body.pacienteId));
    const pacienteSnapshot = await getDocs(pacienteQuery);
    
    if (pacienteSnapshot.empty) {
      return NextResponse.json(
        { error: 'Paciente no encontrado o no autorizado' },
        { status: 403 }
      );
    }

    const encuestasRef = collection(db, 'encuestas');
    const encuestaQuery = query(encuestasRef, where('__name__', '==', body.encuestaId));
    const encuestaSnapshot = await getDocs(encuestaQuery);
    
    if (encuestaSnapshot.empty) {
      return NextResponse.json(
        { error: 'Encuesta no encontrada' },
        { status: 404 }
      );
    }
    
    const respuestasRef = collection(db, 'respuestas');
    const docRef = await addDoc(respuestasRef, {
      pacienteId: body.pacienteId,
      encuestaId: body.encuestaId,
      respuestas: body.respuestas || {},
      createdAt: serverTimestamp()
    });
    
    return NextResponse.json(
      { message: 'Respuesta guardada exitosamente', id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating respuesta:', error);
    return NextResponse.json(
      { error: 'Error al guardar respuesta' },
      { status: 500 }
    );
  }
}
