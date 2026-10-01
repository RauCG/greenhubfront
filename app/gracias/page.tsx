// app/(public)/gracias/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Header from "@/components/header-component";
import Footer from "@/components/footer-component";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  doc,
  collection,
  getDoc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebaseConfig";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface OrderItem {
  productId: string;
  nombre: string;
  imagen: string;
  precio: number;
  cantidad: number;
  total: number;
}

export default function ThanksPage() {
  const { isAuthenticated,user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<OrderItem[]>([]);

  // estados mínimos para Header:
  const [collapsed] = useState(false);
  const [isSidebarOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (isAuthenticated === false) {
      router.replace("/login");
      return;
    }
    const userId = user.uid; // TS no estrecha `user` dentro de la función async

    async function finalizeOrder() {
      const userRef = doc(db, "users", userId);
      const cartDocRef = doc(userRef, "carrito", "carrito");
      const cartSnap = await getDoc(cartDocRef);

      if (!cartSnap.exists()) {
        setLoading(false);
        return;
      }

      const cartData = cartSnap.data() as any;
      const productosMap = Array.isArray(cartData.productos)
        ? cartData.productos
        : [];

      // Cargamos los detalles de cada producto
      const loaded: OrderItem[] = await Promise.all(
        productosMap.map(async (entry: any) => {
          const prodSnap = await getDoc(entry.productoId);
          const pd = prodSnap.data() as any;
          const total = entry.cantidad * pd.precio;
          return {
            productId: entry.productoId.path,
            nombre: pd.nombre,
            imagen: Array.isArray(pd.imagen) ? pd.imagen[0] : pd.imagen,
            precio: pd.precio,
            cantidad: entry.cantidad,
            total,
          };
        })
      );
      setItems(loaded);

      const totalAmount = loaded.reduce((sum, i) => sum + i.total, 0);

      // 1) Guardar en users/{uid}/pedidorealizado
      const pedidoUserRef = doc(collection(userRef, "pedidorealizado"));
      await setDoc(pedidoUserRef, {
        productos: cartData.productos,
        total: totalAmount,
        updatedAt: Timestamp.now(),
      });

      // 2) Guardar en raíz /pedidos
      const pedidosRootRef = doc(collection(db, "pedidos"));
      // convertimos a mapa { key: { productoId, cantidad } }
      const prodMap: Record<string, any> = {};
      for (const entry of productosMap) {
        prodMap[entry.productoId.path] = {
          productoId: entry.productoId,
          cantidad: entry.cantidad,
        };
      }
      await setDoc(pedidosRootRef, {
        estado: "pendiente",
        fechaPedido: Timestamp.now(),
        total: totalAmount,
        uuid: userRef.path,
        productos: prodMap,
      });

      // 3) Limpiar carrito
      await setDoc(
        cartDocRef,
        { productos: [], total: 0, updatedAt: Timestamp.now() },
        { merge: true }
      );

      setLoading(false);
    }

    finalizeOrder();
  }, [isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando tu pedido…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        collapsed={collapsed}
        isSidebarOpen={isSidebarOpen}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 max-w-3xl mx-auto px-4 pt-32 pb-8">
        <Link
          href="/home"
          className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ChevronLeft className="mr-1" /> Volver a la tienda
        </Link>

        <h1 className="text-3xl font-bold mb-4">¡Gracias por tu pedido!</h1>
        <p className="mb-8">Tu pedido ha sido recibido y está en proceso.</p>

        <h2 className="text-xl font-semibold mb-4">Detalle de tu pedido</h2>
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex items-center border border-gray-200 rounded-lg p-4"
            >
              {/* `imagen` viene de Firestore: <img> + lazy/async en vez de next/image. */}
              <img
                src={item.imagen}
                alt={item.nombre}
                width={64}
                height={64}
                loading="lazy"
                decoding="async"
                className="h-16 w-16 object-cover rounded mr-4"
              />
              <div className="flex-1">
                <p className="font-medium">{item.nombre}</p>
                <p className="text-sm text-gray-500">
                  Cantidad: {item.cantidad}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">€{item.total.toFixed(2)}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex justify-between text-lg font-semibold border-t pt-4">
          <span>Total</span>
          <span>
            €
            {items
              .reduce((sum, i) => sum + i.total, 0)
              .toFixed(2)}
          </span>
        </div>
      </main>

      <Footer />
    </div>
  );
}
