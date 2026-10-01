'use client';

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Menu,
  User,
  ShoppingBag,
  ChevronRight,
  X,
  Plus,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Timestamp,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/services/firebaseConfig";
import WidgetManagerWrapper from "./widget-wraper-component";

export interface CartItem {
  productId: string;
  nombre: string;
  imagen: string;
  precio: number;
  cantidad: number;
  total: number;
}

interface ProductSuggestion {
  nombre: string;
  precio: number;
  imagen: string;
  categoryFolder: string;
}

interface HeaderProps {
  collapsed: boolean;
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}

export default function Header({
  collapsed,
  isSidebarOpen,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: HeaderProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Estado carrito
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref a Firestore carrito.
  // Debe ir en useMemo: `doc()` devuelve un objeto nuevo en cada render, y sin
  // memoizarlo el useEffect de abajo se resuscribía a Firestore en cada render
  // (incluida cada pulsación de teclado en el buscador).
  const carritoDocRef = useMemo(
    () =>
      isAuthenticated && user
        ? doc(db, "users", user.uid, "carrito", "carrito")
        : null,
    [isAuthenticated, user]
  );

  // Suscripción al carrito
  useEffect(() => {
    if (carritoDocRef) {
      const unsub = onSnapshot(carritoDocRef, async snap => {
        if (!snap.exists()) {
          setCartItems([]);
          setLoading(false);
          return;
        }
        const arr = Array.isArray(snap.data().productos) ? snap.data().productos : [];
        // Un getDoc() por item del carrito. Se resuelven en paralelo con
        // Promise.all. (El batch getAll() se eliminó en Firebase v12.)
        const detalles = await Promise.all(arr.map(async (entry: any) => {
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
        }));
        setCartItems(detalles);
        setLoading(false);
      });
      return () => unsub();
    } else {
      const ls = localStorage.getItem("cart");
      setCartItems(ls ? JSON.parse(ls) : []);
      setLoading(false);
    }
  }, [carritoDocRef]);

  // Persistir carrito en localStorage si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthenticated]);

  const updateQty = async (pid: string, delta: number) => {
    if (!carritoDocRef) {
      // fallback local
      const updated = cartItems
        .map(i =>
          i.productId === pid
            ? { ...i, cantidad: Math.max(0, i.cantidad + delta), total: Math.max(0, i.cantidad + delta) * i.precio }
            : i
        )
        .filter(i => i.cantidad > 0);
      setCartItems(updated);
      return;
    }
    // Firestore update
    const snap = await getDoc(carritoDocRef);
    if (!snap.exists()) return;
    const { productos = [] } = snap.data() as any;
    const idx = productos.findIndex((e: any) => e.productoId.path === pid);
    if (idx < 0) return;
    const prev = productos[idx];
    const nuevaQty = Math.max(0, prev.cantidad + delta);
    const next = [...productos];
    next.splice(idx, 1);
    if (nuevaQty > 0) next.splice(idx, 0, { productoId: prev.productoId, cantidad: nuevaQty });
    const totalNuevo = cartItems
      .map(i => i.productId === pid ? (i.cantidad + delta) * i.precio : i.total)
      .reduce((s, x) => s + x, 0);
    await setDoc(carritoDocRef, {
      productos: next,
      total: totalNuevo,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  };

  const removeItem = async (pid: string) => {
    if (!carritoDocRef) {
      setCartItems(cartItems.filter(i => i.productId !== pid));
      return;
    }
    const snap = await getDoc(carritoDocRef);
    if (!snap.exists()) return;
    const { productos = [] } = snap.data() as any;
    const next = productos.filter((e: any) => e.productoId.path !== pid);
    const totalNuevo = cartItems.filter(i => i.productId !== pid).reduce((s, i) => s + i.total, 0);
    await setDoc(carritoDocRef, {
      productos: next,
      total: totalNuevo,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  };

  const cartTotal = cartItems.reduce((s, i) => s + i.total, 0);

  // — BÚSQUEDA DINÁMICA —
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState<ProductSuggestion[]>([]);
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const loadedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Carga inicial de todos los productos
  const fetchAllProducts = async () => {
    if (allProducts.length) return;
    if (loadedRef.current) return;
    const cats = ["arboles","macetas","plantas","semillas","decoracion","fertilizantes","herramientas"];
    // Promise.all: las 7 categorías se piden en paralelo (1 ida y vuelta en vez
    // de 7 secuenciales).
    const snaps = await Promise.all(
      cats.map((cat) => getDocs(collection(db, "productos", cat, "tipos")))
    );
    const loaded: ProductSuggestion[] = [];
    snaps.forEach((snap, i) => {
      snap.forEach(d => {
        const data = d.data() as any;
        loaded.push({
          nombre: data.nombre,
          precio: data.precio,
          imagen: Array.isArray(data.imagen) ? data.imagen[0] : data.imagen,
          categoryFolder: cats[i],
        });
      });
    });
    setAllProducts(loaded);
    loadedRef.current = true;
  };



  // Filtra sugerencias
  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
    } else {
      setSuggestions(
        allProducts
          .filter(p => p.nombre.toLowerCase().includes(q))
          .slice(0, 5)
      );
    }
  }, [searchTerm, allProducts]);


  const doSearch = () => {
    const q = searchTerm.trim();
    if (!q) return;
    router.push(`/products?producto=${encodeURIComponent(q)}`);
    setShowSuggestions(false);
  };

  // Posición según sidebar
  const headerLeft = isSidebarOpen
    ? collapsed ? "left-20" : "left-64"
    : "left-0";

  return (
   
    <header className={`fixed top-0 ${headerLeft} right-0 z-[99999] transition-all duration-300`}>
    
      {/* Promo bar */}
      <div className="bg-green-600 text-white text-xs text-center py-2">
        <a href="#" className="hover:underline">
          Oferta Especial: ¡20% en Orquídeas esta Semana!{" "}
          <ChevronRight className="inline h-3 w-3" />
        </a>
      </div>

      {/* Main nav */}
      <div className="h-16 bg-white/90 backdrop-blur-md shadow-lg">
        <nav className="px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between text-gray-800">
          {/* Left */}
          <div className="flex items-center space-x-4">
            <button
              aria-label="Toggle menu"
              className="md:hidden hover:text-green-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <Link href="/home" className="text-2xl font-bold tracking-tight">
              Green<span className="text-green-600">Hub</span>
            </Link>
            {/* DESKTOP SEARCH */}
            <div className="hidden md:flex items-center relative">
              <Search
                className="h-4 w-4 mr-2 text-gray-500 cursor-pointer"
                onClick={doSearch}
              />
              <input
                ref={inputRef}
                type="search"
                placeholder="Buscar flores, plantas..."
                className="bg-gray-100 text-sm focus:outline-none w-64 px-2 py-1 rounded-md"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                onFocus={() =>{ setShowSuggestions(true) 
                                fetchAllProducts()
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full mt-1 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  {suggestions.map(prod => (
                    <Link
                      key={prod.nombre}
                      href={`/products/info?categoria=${encodeURIComponent(prod.categoryFolder)}&producto=${encodeURIComponent(prod.nombre)}`}
                      className="flex items-center p-2 hover:bg-gray-50"
                    >
                      <img
                        src={prod.imagen}
                        alt={prod.nombre}
                        width={40}
                        height={40}
                        loading="lazy"
                        decoding="async"
                        className="h-10 w-10 rounded mr-3 object-cover"
                      />
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">{prod.nombre}</p>
                        <p className="text-xs text-gray-500">€{prod.precio}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right (desktop) */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/products" className="hover:text-green-600">Productos</Link>
            <Link href="/blog" className="hover:text-green-600">Blog</Link>
            <button
              className="relative hover:text-green-600"
              onClick={() => setCartOpen(!cartOpen)}
            >
              <ShoppingBag className="h-5 w-5" />
              {!loading && cartItems.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 text-xs font-bold text-white bg-red-600 rounded-full">
                  {cartItems.length}
                </span>
              )}
            </button>
            <button
              className="hover:text-green-600"
              onClick={() => router.push("/user")}
            >
              <User className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile icons */}
          <div className="md:hidden flex items-center space-x-3">
            {/* MOBILE SEARCH */}
            <div className="flex items-center rounded-md bg-gray-100 px-2 py-1">
              <Search
                className="h-5 w-5 text-gray-600 cursor-pointer"
                onClick={doSearch}
              />
              <input
                type="search"
                placeholder="Buscar..."
                className="ml-1 bg-transparent text-sm focus:outline-none w-20 text-gray-800 placeholder-gray-500"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
              />
            </div>
            <button onClick={() => router.push("/user")}>
              <User className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="relative"
            >
              <ShoppingBag className="h-5 w-5 text-gray-600" />
              {!loading && cartItems.length > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1 text-xs font-bold text-white bg-red-600 rounded-full">
                  {cartItems.length}
                </span>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div
            className="md:hidden fixed inset-x-0 z-[70] bg-white text-gray-800 p-6 space-y-4 shadow-xl"
            style={{ top: '64px', height: 'calc(100vh - 64px)' }}
          >
            {/* buscador móvil */}
            <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 mb-6">
              <Search
                className="h-5 w-5 text-gray-500 mr-2 cursor-pointer"
                onClick={doSearch}
              />
              <input
                type="search"
                placeholder="Buscar..."
                className="bg-transparent text-sm placeholder-gray-500 focus:outline-none w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
              />
            </div>
            {["Productos", "Blog", "Mi Cuenta", "Favoritos"].map(item => (
              <Link
                key={item}
                href={
                  item === "Productos" ? "/products" :
                  item === "Blog"       ? "/blog"    :
                  item === "Mi Cuenta"  ? "/user"    :
                  "/"
                }
                className="block py-2 hover:text-green-600 transition-colors text-lg"
              >
                {item}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Cart panel */}
      {cartOpen && (
          <div className="fixed top-0 right-0 h-full bg-white shadow-lg w-96 sm:max-w-sm flex flex-col z-[9999]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Tu Carrito</h2>
            <button
              onClick={() => setCartOpen(false)}
              className="p-2 rounded-full bg-green-50 hover:bg-green-100"
            >
              <X className="h-5 w-5 text-green-600" />
            </button>
          </div>
          {/* Items */}
          <div className="p-4 flex-1 overflow-auto space-y-3">
            {loading ? (
              <p>Cargando…</p>
            ) : cartItems.length === 0 ? (
              <p className="text-gray-500">Sin productos para tu jardín</p>
            ) : (
              cartItems.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center border border-gray-200 rounded-lg p-3 hover:shadow-md transition-transform duration-150 transform hover:-translate-y-0.5"
                >
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                    className="h-12 w-12 rounded mr-3 object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.nombre}</p>
                    <p className="text-xs text-gray-500">
                      €{item.precio.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 mr-2">
                    <button onClick={() => updateQty(item.productId, -1)}>
                      <Minus className="h-4 w-4 text-gray-600" />
                    </button>
                    <span>{item.cantidad}</span>
                    <button onClick={() => updateQty(item.productId, +1)}>
                      <Plus className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.productId)}>
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))
            )}
          </div>
          {/* Footer */}
          <div className="p-4 bg-green-50">
            <div className="flex justify-between mb-4 text-gray-800">
              <span>Total:</span>
              <span>€{cartTotal.toFixed(2)}</span>
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => router.push("/checkout")}
            >
              Comprar
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
