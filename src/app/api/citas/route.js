import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request) {
  try {
    const citasRef = collection(db, 'citas');
    const snapshot = await getDocs(citasRef);
    
    const citas = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json(citas);
  } catch (error) {
    console.error('Error fetching citas:', error);
    return NextResponse.json(
      { error: 'Error al obtener citas' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    
    const citasRef = collection(db, 'citas');
    const docRef = await addDoc(citasRef, {
      ...body,
      createdAt: serverTimestamp()
    });
    
    return NextResponse.json(
      { message: 'Cita creada exitosamente', id: docRef.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating cita:', error);
    return NextResponse.json(
      { error: 'Error al crear cita' },
      { status: 500 }
    );
  }
}
