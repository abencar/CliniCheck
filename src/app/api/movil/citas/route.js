import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
  const userUid = searchParams.get('userUid');
  const medicoUid = searchParams.get('medicoUid');


    if (medicoUid) {
      const citasRef = collection(db, 'citas');
      const q = query(citasRef, where('medicoId', '==', medicoUid));
      const snapshot = await getDocs(q);
      const citas = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.estado !== 'rechazado')
        .map(c => ({ fecha: c.fecha, hora: c.hora }));
      return NextResponse.json(citas);
    }

    if (userUid) {
      const citasRef = collection(db, 'citas');
      const q = query(citasRef, where('pacienteUid', '==', userUid));
      const snapshot = await getDocs(q);
      const citas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      const ultimaCita = citas
        .filter(c => c.createdAt && c.createdAt.seconds)
        .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)[0];

      let puedePedirCita = true;
      if (ultimaCita) {
        if (ultimaCita.estado === 'rechazado') {
          puedePedirCita = true;
        } else if (ultimaCita.estado === 'confirmado') {
          if (ultimaCita.fecha) {
            const [anio, mes, dia] = ultimaCita.fecha.split('-').map(Number);
            const fechaCita = new Date(anio, mes - 1, dia);
            fechaCita.setHours(0, 0, 0, 0);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            puedePedirCita = fechaCita < hoy;
          } else {
            puedePedirCita = true;
          }
        } else {
          puedePedirCita = false;
        }
      }
      let resultado = { puedePedirCita };
      if (ultimaCita) {
        resultado.id = ultimaCita.id;
        resultado.fecha = ultimaCita.fecha;
        resultado.hora = ultimaCita.hora;
        resultado.estado = ultimaCita.estado;
      }
      return NextResponse.json(resultado);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error('Error en citas_movil:', error);
    return NextResponse.json(
      { error: 'Error al obtener citas de paciente' },
      { status: 500 }
    );
  }
}

// Permite que un paciente cancele su última cita si está pendiente
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userUid = searchParams.get('userUid');

    if (!userUid) {
      return NextResponse.json({ error: 'Falta userUid' }, { status: 400 });
    }

    const citasRef = collection(db, 'citas');
    const q = query(citasRef, where('pacienteUid', '==', userUid));
    const snapshot = await getDocs(q);
    const citas = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    if (citas.length === 0) {
      return NextResponse.json({ error: 'No hay citas para cancelar' }, { status: 404 });
    }

    const ultimaCita = citas
      .filter(c => c.createdAt && c.createdAt.seconds)
      .sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)[0];

    if (!ultimaCita) {
      return NextResponse.json({ error: 'No se encontró la última cita' }, { status: 404 });
    }

    if (ultimaCita.estado !== 'pendiente') {
      return NextResponse.json({ error: 'Solo se puede cancelar la última cita pendiente' }, { status: 400 });
    }

    const citaRef = doc(db, 'citas', ultimaCita.id);
    await updateDoc(citaRef, {
      estado: 'cancelado_por_paciente',
      canceladoPor: userUid,
      canceladoEn: serverTimestamp()
    });

    return NextResponse.json({ message: 'Cita cancelada', id: ultimaCita.id }, { status: 200 });
  } catch (error) {
    console.error('Error cancelando cita (movil):', error);
    return NextResponse.json({ error: 'Error al cancelar cita' }, { status: 500 });
  }
}
