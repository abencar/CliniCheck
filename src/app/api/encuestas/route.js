import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request) {
  try {
    const encuestasRef = collection(db, 'encuestas');
    const snapshot = await getDocs(encuestasRef);
    
    const encuestas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(encuestas);
  } catch (error) {
    console.error('Error fetching encuestas:', error);
    return NextResponse.json(
      { error: 'Error al obtener encuestas' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const encuestasRef = collection(db, 'encuestas');
    const docRef = await addDoc(encuestasRef, {
      ...body,
      createdAt: serverTimestamp()
    });
    
    return NextResponse.json(
      { message: 'Encuesta creada exitosamente', id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating encuesta:', error);
    return NextResponse.json(
      { error: 'Error al crear encuesta' },
      { status: 500 }
    );
  }
}
