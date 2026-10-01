"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/services/firebaseConfig";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

export interface CartItem {
  productId: string;
  nombre: string;
  imagen: string;
  precio: number;
  cantidad: number;
  total: number;
}

export interface Address {
  id: string;
  calle: string;
  ciudad: string;
  codigoPostal: number;
  principal: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  // --- Direcciones ---
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    calle: "",
    ciudad: "",
    codigoPostal: "",
    principal: true,
  });

  // --- Carrito ---
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Handler de checkout
  const onCheckout = useCallback(async () => {
    // Llamada al endpoint Next.js
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cartItems,
        successUrl: `${window.location.origin}/gracias`,
        cancelUrl: `${window.location.origin}/checkout`,
      }),
    });
    const { sessionId, error } = await res.json();
    if (error) {
      console.error("Stripe error:", error);
      return;
    }
    // Redirige a Stripe Checkout
    const stripeJs = await loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
    );
    await stripeJs!.redirectToCheckout({ sessionId });
  }, [cartItems]);

  useEffect(() => {
    // Si no está autenticado, va al login
    if (isAuthenticated === false) {
      router.replace("/login");
      return;
    }
    if (!user) return;
    const userId = user.uid; // TS no estrecha `user` dentro de la función async

    async function loadAll() {
      setLoading(true);
      const userRef = doc(db, "users", userId);

      // Cargar direcciones
      const addrSnap = await getDocs(collection(userRef, "direcciones"));
      const addrs = addrSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as Address[];
      setAddresses(addrs);
      const principal = addrs.find((a) => a.principal);
      if (principal) setSelectedAddressId(principal.id);

      // Cargar carrito (único doc "carrito")
      const cartDocRef = doc(userRef, "carrito", "carrito");
      const cartDoc = await getDoc(cartDocRef);
      if (cartDoc.exists()) {
        const data = cartDoc.data() as any;
        const productosArr: any[] = Array.isArray(data.productos)
          ? data.productos
          : [];
        const detalles = await Promise.all(
          productosArr.map(async (entry) => {
            const prodSnap = await getDoc(entry.productoId);
            const pd = prodSnap.data() as any;
            return {
              productId: entry.productoId.path,
              nombre: pd.nombre,
              imagen: Array.isArray(pd.imagen) ? pd.imagen[0] : pd.imagen,
              precio: pd.precio,
              cantidad: entry.cantidad,
              total: entry.cantidad * pd.precio,
            } as CartItem;
          })
        );
        setCartItems(detalles);
      } else {
        setCartItems([]);
      }

      setLoading(false);
    }

    loadAll();
  }, [isAuthenticated, user, router]);

  // Añadir nueva dirección
  const handleAddAddress = async () => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    const col = collection(userRef, "direcciones");
    const docRef = await addDoc(col, {
      calle: newAddr.calle,
      ciudad: newAddr.ciudad,
      codigoPostal: Number(newAddr.codigoPostal),
      principal: true,
    });
    // Desmarcar anteriores
    await Promise.all(
      addresses.map((a) =>
        updateDoc(doc(userRef, "direcciones", a.id), { principal: false })
      )
    );
    setNewAddr({ calle: "", ciudad: "", codigoPostal: "", principal: true });
    setShowNewForm(false);
    // Refrescar direcciones
    const snap = await getDocs(col);
    const refreshed = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as any),
    })) as Address[];
    setAddresses(refreshed);
    setSelectedAddressId(docRef.id);
  };

  // Seleccionar dirección
  const handleSelectAddress = async (id: string) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await Promise.all(
      addresses.map((a) =>
        updateDoc(doc(userRef, "direcciones", a.id), {
          principal: a.id === id,
        })
      )
    );
    setAddresses(addresses.map((a) => ({ ...a, principal: a.id === id })));
    setSelectedAddressId(id);
  };

  // Total del carrito
  const cartTotal = cartItems.reduce((sum, i) => sum + i.total, 0);

  if (loading) {
    return <p className="p-8 text-center">Cargando datos…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Volver atrás */}
      <Link
        href="/home"
        className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
      >
        <ChevronLeft className="mr-1" /> Volver atrás
      </Link>

      {/* Direcciones */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dirección de envío</h2>
        <div className="space-y-2">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={`block border ${
                addr.id === selectedAddressId
                  ? "border-green-600"
                  : "border-gray-300"
              } rounded-lg p-4 cursor-pointer flex items-center transition-shadow hover:shadow-md`}
            >
              <input
                type="radio"
                name="addr"
                checked={addr.id === selectedAddressId}
                onChange={() => handleSelectAddress(addr.id)}
                className="mr-3"
              />
              <div>
                <p className="font-medium">
                  {addr.calle}, {addr.ciudad}
                </p>
                <p className="text-sm text-gray-500">
                  C.P. {addr.codigoPostal}
                </p>
              </div>
            </label>
          ))}
        </div>
        <Button variant="outline" onClick={() => setShowNewForm((s) => !s)}>
          {showNewForm ? "Cancelar" : "Añadir nueva dirección"}
        </Button>
        {showNewForm && (
          <div className="border border-gray-300 rounded-lg p-4 space-y-4">
            <div>
              <Label htmlFor="calle">Calle</Label>
              <Input
                id="calle"
                value={newAddr.calle}
                onChange={(e) =>
                  setNewAddr((n) => ({ ...n, calle: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input
                id="ciudad"
                value={newAddr.ciudad}
                onChange={(e) =>
                  setNewAddr((n) => ({ ...n, ciudad: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="cp">Código Postal</Label>
              <Input
                id="cp"
                type="number"
                value={newAddr.codigoPostal}
                onChange={(e) =>
                  setNewAddr((n) => ({
                    ...n,
                    codigoPostal: e.target.value,
                  }))
                }
              />
            </div>
            <Button onClick={handleAddAddress}>Guardar dirección</Button>
          </div>
        )}
      </section>

      {/* Resumen de pedido */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tu carrito</h2>
        {cartItems.map((item) => (
          <div
            key={item.productId}
            className="flex border border-gray-300 rounded-lg p-4 items-center hover:shadow-md transition-transform transform hover:-translate-y-0.5"
          >
            {/* `imagen` viene de Firestore con un host arbitrario, así que se mantiene
                <img> en vez de next/image (evita depender de remotePatterns).
                lazy + async evita bloquear el render inicial. */}
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
              <p>€{item.total.toFixed(2)}</p>
              <Link
                href={`/products/info?categoria=${encodeURIComponent(
                  item.productId.split("/")[1]
                )}&producto=${encodeURIComponent(item.nombre)}`}
                className="text-sm text-green-600 hover:underline"
              >
                Ver producto
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Total y botón de pago */}
      <section className="pt-4 border-t border-gray-200 space-y-4">
        <div className="flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span>€{cartTotal.toFixed(2)}</span>
        </div>
        <Button
          size="lg"
          className="w-full bg-green-600 hover:bg-green-700"
          onClick={onCheckout}
        >
          Realizar compra
        </Button>
      </section>
    </div>
  );
}
