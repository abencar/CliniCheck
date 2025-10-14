import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request) {
  try {
    const pacientesRef = collection(db, 'pacientes');
    const snapshot = await getDocs(pacientesRef);
    
    const pacientes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(pacientes);
  } catch (error) {
    console.error('Error fetching pacientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener pacientes' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const pacientesRef = collection(db, 'pacientes');
    const docRef = await addDoc(pacientesRef, {
      ...body,
      createdAt: serverTimestamp()
    });
    
    return NextResponse.json(
      { message: 'Paciente creado exitosamente', id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating paciente:', error);
    return NextResponse.json(
      { error: 'Error al crear paciente' },
      { status: 500 }
    );
  }
}
