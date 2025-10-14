import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request) {
  try {
    const medicosRef = collection(db, 'medicos');
    const snapshot = await getDocs(medicosRef);
    
    const medicos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(medicos);
  } catch (error) {
    console.error('Error fetching medicos:', error);
    return NextResponse.json(
      { error: 'Error al obtener médicos' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const medicosRef = collection(db, 'medicos');
    const docRef = await addDoc(medicosRef, {
      ...body,
      createdAt: serverTimestamp()
    });
    
    return NextResponse.json(
      { message: 'Médico creado exitosamente', id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating medico:', error);
    return NextResponse.json(
      { error: 'Error al crear médico' },
      { status: 500 }
    );
  }
}
