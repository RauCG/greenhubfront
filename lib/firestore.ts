import { doc, type DocumentReference, type Firestore } from "firebase/firestore";

/**
 * Reconstruye una `DocumentReference` a partir de su ruta en forma de string
 * (`"productos/arboles/tipos/olivo"`).
 *
 * Hacer `doc(db, ...ruta.split("/"))` directamente no compila: TypeScript no
 * puede inferir la tupla de segmentos que `doc()` espera. Aquí se hace el cast
 * explícito a `[string, ...string[]]`, que es la firma real de la API.
 */
export function docFromPath(
  db: Firestore,
  path: string
): DocumentReference {
  const segments = path.split("/").filter(Boolean);
  return doc(db, ...(segments as [string, ...string[]]));
}