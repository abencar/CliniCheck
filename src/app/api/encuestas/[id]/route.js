import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const encuestaRef = doc(db, 'encuestas', id);
    
    const encuestaDoc = await getDoc(encuestaRef);
    if (!encuestaDoc.exists()) {
      return NextResponse.json(
        { error: 'Encuesta no encontrada' },
        { status: 404 }
      );
    }
    
    await updateDoc(encuestaRef, body);
    
    return NextResponse.json(
      { message: 'Encuesta actualizada exitosamente', id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating encuesta:', error);
    return NextResponse.json(
      { error: 'Error al actualizar encuesta' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    const encuestaRef = doc(db, 'encuestas', id);
    
    const encuestaDoc = await getDoc(encuestaRef);
    if (!encuestaDoc.exists()) {
      return NextResponse.json(
        { error: 'Encuesta no encontrada' },
        { status: 404 }
      );
    }
    
    await deleteDoc(encuestaRef);
    
    return NextResponse.json(
      { message: 'Encuesta eliminada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting encuesta:', error);
    return NextResponse.json(
      { error: 'Error al eliminar encuesta' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const encuestaRef = doc(db, 'encuestas', id);
    const encuestaDoc = await getDoc(encuestaRef);
    if (!encuestaDoc.exists()) {
      return NextResponse.json(
        { error: 'Encuesta no encontrada' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { id: encuestaDoc.id, ...encuestaDoc.data() },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error obteniendo encuesta:', error);
    return NextResponse.json(
      { error: 'Error al obtener encuesta' },
      { status: 500 }
    );
  }
}