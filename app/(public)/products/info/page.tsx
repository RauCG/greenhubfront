"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, getDocs, collection, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/services/firebaseConfig";
import AdminSidebar from "@/components/admin/adminSidebar";
import Header from "@/components/header-component";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/footer-component";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Plus,
  Minus,
  Heart,
  ChevronRight,
  Truck,
  Package,
  X,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

type ProductData = {
  nombre: string;
  descripcion: string;
  imagen: string[];
  precio: number;
  originalPrice: number;
  disponible: string;
  categoria_principal: string;
};

export default function ProductDetailPage() {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
const rawCategoria = searchParams.get("categoria") || "";
const rawProducto  = searchParams.get("producto")  || "";
const categoriaParam = decodeURIComponent(rawCategoria.replace(/\+/g, " "));
const productoParam  = decodeURIComponent(rawProducto .replace(/\+/g, " "));

  // PRODUCTO
  const [productData, setProductData] = useState<ProductData>({
    nombre: "",
    descripcion: "",
    imagen: ["", ""],
    precio: 0,
    originalPrice: 0,
    disponible: "",
    categoria_principal: "",
  });

  // LAYOUT
  const [quantity, setQuantity] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Abrir sidebar para admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) setIsSidebarOpen(true);
  }, [isAuthenticated, isAdmin]);

  // Fetch producto
 useEffect(() => {
  async function fetchProduct() {
    if (!categoriaParam || !productoParam) return;

    // 1) Intentamos doc directo
    let snap = await getDoc(
      doc(db, "productos", categoriaParam, "tipos", productoParam)
    );

    // 2) Si no existe, buscamos en toda la colección comparando 'nombre'
    if (!snap.exists()) {
      const colRef = collection(db, "productos", categoriaParam, "tipos");
      const all = await getDocs(colRef);

      // normalizamos ambos: quitamos espacios extras y pasamos a minúsculas
      const slugParam = productoParam.trim().toLowerCase();

      const match = all.docs.find(d => {
        const idSlug   = d.id.trim().toLowerCase();
        const nameSlug = (d.data().nombre as string || "")
                           .trim().toLowerCase();
        return idSlug === slugParam || nameSlug === slugParam;
      });

      if (!match) {
        console.warn("No encontrado:", productoParam);
        return;
      }
      snap = match;
    }

    // 3) Si hay documento, leemos datos
    const d = snap.data() as any;
    setProductData({
      nombre: d.nombre || "",
      descripcion: d.descripcion || "",
      imagen: Array.isArray(d.imagen) ? d.imagen : ["", ""],
      precio: typeof d.precio === "number" ? d.precio : 0,
      originalPrice: typeof d.originalPrice === "number" ? d.originalPrice : 0,
      disponible: d.disponible || "",
      categoria_principal: d.categoria_principal || "",
    });
  }
  fetchProduct();
}, [categoriaParam, productoParam]);


  // El estado del carrito vive en <Header />. Aquí solo se escribe el
  // documento del carrito en Firestore; Header se suscribe y se actualiza solo.

  // Añadir al carrito
 async function handleAddToCart() {
  // 1) Si no estamos autenticados, redirigimos al login
  if (!isAuthenticated || !user?.uid) {
    router.push("/login");
    return;
  }

  // 2) Referencia al documento único "carrito" en users/{uid}/carrito/carrito
  const carritoRef = doc(db, "users", user.uid, "carrito", "carrito");

  // 3) Referencia al documento real del producto
  const productRef = doc(
    db,
    "productos",
    categoriaParam,
    "tipos",
    productoParam
  );

  // 4) Leemos el estado actual del carrito
  const snap = await getDoc(carritoRef);
  // Inicializamos productos (array) y total previos
  let productos: { productoId: any; cantidad: number }[] = [];
  let prevTotal = 0;
  if (snap.exists()) {
    const data = snap.data();
    productos = Array.isArray(data.productos) ? data.productos : [];
    prevTotal = typeof data.total === "number" ? data.total : 0;
  }

  // 5) Buscamos si ya existía en el array
  const idx = productos.findIndex(
    (e) => (e.productoId as any).path === productRef.path
  );

  if (idx > -1) {
    // ya existe → sumamos cantidad
    productos[idx].cantidad += quantity;
  } else {
    // no existe → lo añadimos
    productos.push({
      productoId: productRef,
      cantidad: quantity,
    });
  }

  // 6) Calculamos el nuevo total (incremental)
  const delta = quantity * productData.precio;
  const newTotal = prevTotal + delta;

  // 7) Escribimos todo de golpe (merge no necesario pues reemplazamos los campos)
  await setDoc(
    carritoRef,
    {
      productos,
      total: newTotal,
      updatedAt: Timestamp.now(),
    },
    { merge: true }
  );

  // 8) El panel del carrito lo abre/refleja <Header /> mediante su suscripción.

}


  // Ajustar contenedor cuando el sidebar esté abierto
  const contentClass = !isSidebarOpen
    ? "w-full"
    : collapsed
    ? "ml-20"
    : "ml-64";

  return (
    <div className="min-h-screen bg-white font-sans flex">
      <AdminSidebar
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        variant="permanent"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <div className={`flex-1 ${contentClass} transition-all duration-300`}>
        {/* El carrito lo gestiona Header por dentro. */}
        <Header
          collapsed={collapsed}
          isSidebarOpen={isSidebarOpen}
          isMobileMenuOpen={false}
          setIsMobileMenuOpen={() => {}}
        />

        {/* DETALLE DEL PRODUCTO */}
        <main className="pt-[calc(1.75rem+4rem)] pb-8 px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="text-xs sm:text-sm text-gray-500 mb-8 flex items-center space-x-1.5">
            <Link href="/products" className="hover:text-green-600">
              Productos
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/products?categoria=${categoriaParam}`}
              className="hover:text-green-600"
            >
              {categoriaParam}
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-gray-700">
              {productData.nombre}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Imágenes */}
            <div className="lg:col-span-7">
              <div className="grid grid-cols-2 gap-4">
                {productData.imagen.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden shadow-sm"
                  >
                    <Image
                      src={src || "/placeholder.svg"}
                      alt={productData.nombre}
                      fill
                      className="object-cover"
                      priority={i === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Detalles */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex justify-between items-start mb-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  {productData.nombre}
                </h1>
                <Button variant="ghost" size="icon">
                  <Heart className="h-6 w-6 text-gray-500 hover:text-pink-500" />
                </Button>
              </div>

              <p className="text-gray-600 mb-4 text-base">
                {productData.descripcion}
              </p>

              <p className="text-3xl font-semibold text-gray-800 mb-1">
                €{productData.precio.toFixed(2)}
              </p>
              {productData.originalPrice > 0 && (
                <p className="text-sm text-gray-400 line-through mb-4">
                  €{productData.originalPrice.toFixed(2)}
                </p>
              )}

              <p className="text-xs text-gray-500 mb-6">
                IVA incluido.{" "}
                <Link href="#" className="underline hover:text-green-600">
                  Gastos de envío
                </Link>{" "}
                no incluidos.
              </p>

              <div className="border rounded-md p-3 mb-6 flex items-center justify-between text-sm hover:border-gray-400 transition">
                <span>{productData.descripcion}</span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              <p className="text-sm text-gray-700 mb-4 flex items-center">
                <Truck className="h-5 w-5 mr-2 text-green-600" />
                Compra ahora y recíbelo{" "}
                <span className="font-semibold mx-1">entre el 17/06 y el 19/06</span>
              </p>

              {/* Cantidad + Añadir al carrito */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center border border-gray-300 rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="text"
                    readOnly
                    value={quantity}
                    className="w-12 h-10 text-center focus:outline-none"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(q => q + 1)}
                    className="h-10 w-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleAddToCart}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" /> Añadir al Carrito
                </Button>
              </div>

              <p className="text-sm text-green-600 mb-6 font-medium flex items-center">
                <Package className="h-4 w-4 mr-1.5" />
                {productData.disponible || "En stock"}
              </p>

              {/* Accordion */}
              <Accordion type="single" collapsible className="w-full space-y-1">
                <AccordionItem value="detalles" className="border-b">
                  <AccordionTrigger className="text-base font-medium py-3.5 flex justify-between items-center text-gray-700 hover:text-gray-900">
                    Detalles del Producto
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 pt-2 pb-4">
                    <div
                      dangerouslySetInnerHTML={{ __html: productData.descripcion }}
                    />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="envio" className="border-b">
                  <AccordionTrigger className="text-base font-medium py-3.5 flex justify-between items-center text-gray-700 hover:text-gray-900">
                    Envío y Devoluciones
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-gray-600 pt-2 pb-4">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: "Sujeto a nuestros términos y condiciones",
                      }}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
