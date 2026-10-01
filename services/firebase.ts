import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions'; 
import { setCookie, destroyCookie } from 'nookies';
import type { UserCredential } from 'firebase/auth';
import { app } from './firebaseConfig';
import { createOrUpdateUserProfile } from './authService';
import { doc, getDoc,serverTimestamp,setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const auth = getAuth(app);
const functions = getFunctions(app);  // Obtén la instancia de Firebase Functions

// Función para asignar el rol de "admin"
const assignAdminRole = async (uid: string) => {
  try {
    const setAdminRoleFunction = httpsCallable(functions, 'setAdminRole');  
    const result = await setAdminRoleFunction({ uid });
    console.log('Resultado:', (result.data as { message?: string }).message);  // Mensaje de éxito
  } catch (error) {
    console.error('Error al asignar el rol:', error);
  }
};

// Función para obtener el rol desde Firestore
const getUserRoleFromFirestore = async (uid: string) => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (userDoc.exists()) {
    return userDoc.data()?.role || 'user'; // Retorna el rol, 'user' por defecto si no está definido
  }
  return 'user'; 
};

// Registro por email y password
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  username: string
) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const { uid, email: userEmail } = userCredential.user;

  // Guardamos los datos iniciales en Firestore.
  // No pasamos `createdAt`: lo escribe createOrUpdateUserProfile con
  // serverTimestamp(), que es lo que se usa en el resto de flujos de auth.
  await createOrUpdateUserProfile(uid, {
    email: userEmail,
    displayName,
    username,
    photoURL: '',
    emailVerified: userCredential.user.emailVerified,
    role: 'user', // rol por defecto
    bio: 'Sin descripción',
  });

  return userCredential;
};

// Login por email y password
export const loginUser = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const { user } = userCredential;
  const token = await user.getIdToken(true);

  // 1) Token en cookie
  setCookie(null, 'token', token, {
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
    secure: true,
  });

  // 2) Recoger datos
  const { uid, email: userEmail, displayName = 'Nuevo usuario', photoURL = '' } = user;
  const role = await getUserRoleFromFirestore(uid);

  // 3) Crear o actualizar perfil
  //    createOrUpdateUserProfile debe usar serverTimestamp() para createdAt y lastLogin
  await createOrUpdateUserProfile(uid, {
    email: userEmail,
    displayName,
    photoURL,
    emailVerified: user.emailVerified,
    lastLogin: serverTimestamp(),
    // NO vuelvas a fijar createdAt si ya existe
    role,
    username: displayName,
    bio: 'Sin descripción',
  });

  // 4) Si es admin, asignar custom claim y refrescar token
  if (role === 'admin') {
    await assignAdminRole(uid);
    const newToken = await user.getIdToken(true);
    setCookie(null, 'token', newToken, {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      secure: true,
    });
  }

  return userCredential;
};

// Login con Google
export const loginWithGoogle = async (): Promise<UserCredential> => {
  const provider = new GoogleAuthProvider();
  // 1) Hacemos el login y guardamos el UserCredential completo:
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;
  const uid = user.uid;

  // 2) Obtenemos el token y lo guardamos en cookie
  const token = await user.getIdToken(true);
  setCookie(null, "token", token, {
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
    secure: true,
  });

  // 3) Datos básicos de usuario
  const email = user.email ?? "";
  const displayName = user.displayName ?? "Nuevo usuario";
  const photoURL = user.photoURL ?? "";
  const emailVerified = user.emailVerified;

  // 4) Role desde Firestore
  const role = await getUserRoleFromFirestore(uid);

  // 5) Ref a Firestore
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // Nuevo usuario: creamos todos los campos
    await setDoc(userRef, {
      email,
      displayName,
      photoURL,
      emailVerified,
      role,
      username: displayName,
      bio: "Sin descripción",
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Ya existía: solo update de login
    await setDoc(
      userRef,
      {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  // 6) Si admin → asignamos custom claim y refrescamos token
  if (role === "admin") {
    await assignAdminRole(uid);
    const newToken = await user.getIdToken(true); 
    setCookie(null, "token", newToken, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      secure: true,
    });
  }

  // Devolvemos el credential completo
  return userCredential;
};
// Logout del usuario
export const logoutUser = async () => {
  await auth.signOut();
  destroyCookie(null, 'token', { path: '/' });
};

export { auth, onAuthStateChanged };
