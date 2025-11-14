 import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import admin, { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

let mailTransporter;

const getMailTransporter = () => {
  if (mailTransporter) {
    return mailTransporter;
  }

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Faltan las variables de entorno SMTP_HOST, SMTP_USER o SMTP_PASS');
  }

  mailTransporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });

  return mailTransporter;
};

const generateTemporaryPassword = (length = 10) => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i += 1) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
};

const sanitizePatientData = (data = {}) => {
  const sanitized = { ...data };

  if (typeof sanitized.nombre === 'string') sanitized.nombre = sanitized.nombre.trim();
  if (typeof sanitized.ubicacion === 'string') sanitized.ubicacion = sanitized.ubicacion.trim();
  if (typeof sanitized.telefono === 'string') sanitized.telefono = sanitized.telefono.trim();
  if (typeof sanitized.genero === 'string') sanitized.genero = sanitized.genero.trim();
  if (typeof sanitized.medicoId === 'string') sanitized.medicoId = sanitized.medicoId.trim();
  if (typeof sanitized.encuestaId === 'string') sanitized.encuestaId = sanitized.encuestaId.trim();

  if (sanitized.telefono === '') delete sanitized.telefono;
  if (sanitized.medicoId === '') delete sanitized.medicoId;
  if (sanitized.encuestaId === '') delete sanitized.encuestaId;

  if (sanitized.edad !== undefined) {
    const edadNumber = Number(sanitized.edad);
    if (!Number.isNaN(edadNumber)) {
      sanitized.edad = edadNumber;
    } else {
      delete sanitized.edad;
    }
  }

  return sanitized;
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userUid = searchParams.get('userUid');
    
    let pacientes = [];
    
    if (userUid) {
      // Verificar el rol del usuario
      const userDoc = doc(db, 'usuarios', userUid);
      const userSnap = await getDoc(userDoc);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        console.log('Usuario encontrado. Rol:', userData.rol);
        
        if (userData.rol === 'medico') {
          // Si es médico, buscar su ID en la colección de médicos
          const medicosRef = collection(db, 'medicos');
          const medicosSnapshot = await getDocs(medicosRef);
          const medico = medicosSnapshot.docs.find(doc => doc.data().uid === userUid);
          
          if (medico) {
            console.log('Médico encontrado con ID:', medico.id);
            // Filtrar solo los pacientes asignados a este médico
            const pacientesRef = collection(db, 'pacientes');
            const q = query(pacientesRef, where('medicoId', '==', medico.id));
            const snapshot = await getDocs(q);
            
            pacientes = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            console.log('Pacientes del médico:', pacientes.length);
          } else {
            console.log('Médico no encontrado en colección médicos');
          }
        } else {
          // Si es admin, mostrar todos los pacientes
          console.log('Usuario es admin, cargando todos los pacientes');
          const pacientesRef = collection(db, 'pacientes');
          const snapshot = await getDocs(pacientesRef);
          
          pacientes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('Total pacientes (admin):', pacientes.length);
        }
      } else {
        // Usuario no existe en colección usuarios, devolver todos (asumir admin)
        console.log('Usuario NO encontrado en colección usuarios, asumiendo admin');
        const pacientesRef = collection(db, 'pacientes');
        const snapshot = await getDocs(pacientesRef);
        
        pacientes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('Total pacientes (sin rol):', pacientes.length);
      }
    } else {
      // Sin userUid, devolver todos
      console.log('Sin userUid, devolviendo todos los pacientes');
      const pacientesRef = collection(db, 'pacientes');
      const snapshot = await getDocs(pacientesRef);
      
      pacientes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Total pacientes:', pacientes.length);
    }

    return NextResponse.json(pacientes);
  } catch (error) {
    console.error('Error fetching pacientes:', error);
    return NextResponse.json(
      { error: 'Error al obtener pacientes', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let transporter;

  try {
    transporter = getMailTransporter();
  } catch (configError) {
    console.error('SMTP configuration error:', configError);
    return NextResponse.json(
      { error: 'Configuración SMTP no válida. Verifica las variables de entorno SMTP_HOST, SMTP_USER y SMTP_PASS.' },
      { status: 500 }
    );
  }

  let userRecord;
  let usuarioDocRef;
  let pacienteDocRef;

  try {
    const body = await request.json();
    const { email: rawEmail, password, ...rest } = body;

    const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json(
        { error: 'El correo del paciente es obligatorio' },
        { status: 400 }
      );
    }

    const patientData = sanitizePatientData(rest);

    if (!patientData.nombre) {
      return NextResponse.json(
        { error: 'El nombre del paciente es obligatorio' },
        { status: 400 }
      );
    }

    const generatedPassword = typeof password === 'string' && password.trim().length >= 6
      ? password.trim()
      : generateTemporaryPassword();

    userRecord = await adminAuth.createUser({
      email,
      password: generatedPassword
    });

    usuarioDocRef = adminDb.collection('usuarios').doc(userRecord.uid);
    await usuarioDocRef.set({
      email,
      rol: 'paciente',
      nombre: patientData.nombre,
      telefono: patientData.telefono || '',
      medicoId: patientData.medicoId || null,
      encuestaId: patientData.encuestaId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const pacientesCollection = adminDb.collection('pacientes');
    pacienteDocRef = await pacientesCollection.add({
      ...patientData,
      email,
      uid: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const nombrePaciente = patientData.nombre || 'Paciente';
    const subject = 'Tu acceso a CliniCheck';
  const plainText = `Hola ${nombrePaciente},\n\nTu cuenta en CliniCheck se creó correctamente.\n\nCorreo: ${email}\nContraseña: ${generatedPassword}\n\nTe recomendamos iniciar sesión dentro de la app para empezar con las encuestas.\n\nGracias,\nEquipo CliniCheck`;
  const htmlBody = `<!doctype html><html><body><p>Hola <strong>${nombrePaciente}</strong>,</p><p>Tu cuenta en CliniCheck se creó correctamente.</p><p><strong>Correo:</strong> ${email}<br><strong>Contraseña:</strong> ${generatedPassword}</p><p>Te recomendamos iniciar sesión dentro de la app para empezar con las encuestas.</p><p>Gracias,<br>Equipo CliniCheck</p></body></html>`;

    try {
      await transporter.sendMail({
        from: smtpFrom || `CliniCheck <${smtpUser}>`,
        to: email,
        subject,
        text: plainText,
        html: htmlBody
      });
    } catch (mailError) {
      console.error('Error sending patient email:', mailError);
      await pacienteDocRef.delete().catch(() => {});
      await usuarioDocRef.delete().catch(() => {});
      await adminAuth.deleteUser(userRecord.uid).catch(() => {});
      return NextResponse.json(
        { error: 'No se pudo enviar el correo al paciente. Intenta nuevamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Paciente creado y notificado exitosamente', id: pacienteDocRef.id, email },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating paciente:', error);

    if (pacienteDocRef) {
      await pacienteDocRef.delete().catch(() => {});
    }
    if (usuarioDocRef) {
      await usuarioDocRef.delete().catch(() => {});
    }
    if (userRecord) {
      await adminAuth.deleteUser(userRecord.uid).catch(() => {});
    }

    let message = 'Error al crear paciente';
    let status = 500;

    if (error?.code === 'auth/email-already-exists') {
      message = 'El correo ya está registrado';
      status = 409;
    } else if (error?.code === 'auth/invalid-email') {
      message = 'El correo no es válido';
      status = 400;
    } else if (error?.code === 'auth/invalid-password') {
      message = 'La contraseña no cumple los requisitos mínimos';
      status = 400;
    } else if (error instanceof SyntaxError) {
      message = 'Formato de datos inválido';
      status = 400;
    }

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
