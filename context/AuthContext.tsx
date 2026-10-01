// context/AuthContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/services/firebase";            // tu instancia de firebase/auth
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/services/firebaseConfig";

interface AuthContextType {
  user: FirebaseUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        setIsAuthenticated(true);

        // Lee el rol desde Firestore
        try {
          const uDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (uDoc.exists()) {
            const data = uDoc.data() as any;
            setIsAdmin(data.role === "admin");
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          console.error("Error leyendo rol de Firestore:", e);
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Mientras carga, puedes retornar null o un loader

  // Memoizar el valor evita que cada cambio de estado re-renderice todo el árbol
  // de componentes Suscritos a useAuth().
  const value = useMemo(
    () => ({ user, isAuthenticated, isAdmin }),
    [user, isAuthenticated, isAdmin]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  }
  return ctx;
};
