'use client';

import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/services/firebaseConfig";
import AdminSidebar from "@/components/admin/adminSidebar";
import Header from "@/components/header-component";
import Footer from "@/components/footer-component";
import PlantProductCard from "@/components/public/plant-product-card";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@radix-ui/react-label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import * as Slider from '@radix-ui/react-slider';
import { useAuth } from "@/context/AuthContext";

interface Product {
  nombre: string;
  descripcion: string;
  imagen: string[];
  precio: number;
  originalPrice?: number;
  destacado: boolean;
  categoria_principal: string;
  stock: number;
  categoryFolder: string;
}

export default function PlantasPage() {
  
  const router = useRouter();
  const { isAuthenticated, isAdmin, user } = useAuth();

  // sidebar + header
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // productos
  const [plantProducts, setPlantProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // filtros
  const [categoria, setCategoria] = useState<string>("todo");
  const [availabilityFilter, setAvailabilityFilter] = useState<boolean>();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);

  // filtro por nombre desde parámetro "producto"
  const searchParams = useSearchParams();
  const rawProductoFiltro = searchParams.get("producto") || "";
  const productoFiltro = decodeURIComponent(
    rawProductoFiltro.replace(/\+/g, " ")
  ).trim().toLowerCase();

  // Abrir sidebar admin
  useEffect(() => {
    if (isAuthenticated && isAdmin) setIsSidebarOpen(true);
  }, [isAuthenticated, isAdmin]);

  // Cargar todos los productos
  useEffect(() => {
    async function fetchData() {
      const collections = [
        "arboles",
        "macetas",
        "plantas",
        "semillas",
        "decoracion",
        "fertilizantes",
        "herramientas",
      ];
      const all: Product[] = [];
      // Promise.all: las 7 categorías se piden en paralelo en lugar de una
      // detrás de otra (7 idas y vueltas -> 1).
      const snaps = await Promise.all(
        collections.map((colName) =>
          getDocs(collection(db, "productos", colName, "tipos"))
        )
      );
      snaps.forEach((snap, i) => {
        const colName = collections[i];
        snap.forEach((d) => {
          const data = d.data() as any;
          all.push({
            nombre: data.nombre,
            descripcion: data.descripcion,
            imagen: data.imagen || [],
            precio: data.precio,
            originalPrice: data.originalPrice,
            destacado: data.destacado,
            categoria_principal: data.categoria_principal,
            stock: data.stock || 0,
            categoryFolder: colName,
          });
        });
      });
      setPlantProducts(all);
    }
    fetchData();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    let f = [...plantProducts];

    if (categoria !== "todo") {
      f = f.filter((p) => p.categoryFolder === categoria);
    }
    if (availabilityFilter !== undefined) {
      f = f.filter((p) =>
        availabilityFilter ? p.stock > 0 : p.stock === 0
      );
    }
    f = f.filter((p) => p.precio >= priceRange[0] && p.precio <= priceRange[1]);

    if (productoFiltro) {
      f = f.filter((p) =>
        p.nombre.toLowerCase().includes(productoFiltro)
      );
    }

    setFilteredProducts(f);
  }, [plantProducts, categoria, availabilityFilter, priceRange, productoFiltro]);

  // Handlers filtros
  const handleFilterChange = (cat: string) => setCategoria(cat);
  const handleAvailabilityChange = (val: string) =>
    setAvailabilityFilter(
      val === "con-stock" ? true : val === "sin-stock" ? false : undefined
    );
  const handlePriceChange = (val: number[]) =>
    setPriceRange(val as [number, number]);

  // Limpiar todos los filtros
  const clearFilters = () => {
    setCategoria("todo");
    setAvailabilityFilter(undefined);
    setPriceRange([0, 1000]);
    // limpia URL
    router.push("/products");
  };

  // El estado del carrito vive en <Header />.

  // Layout según sidebar
  const contentClass = !isSidebarOpen
    ? "w-full"
    : collapsed
    ? "ml-20"
    : "ml-64";

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
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
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <main className="pt-[calc(1.75rem+4rem)]">
          {/* ... sección Hero ... */}

          {/* Filtros */}
          <section className="py-12 sm:py-16 lg:py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">

              {/* Filtros categoría y disponibilidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 sm:mb-12">
                {/* Categoría */}
                <div className="flex flex-col space-y-4">
                  <Label htmlFor="filter" className="text-sm text-gray-600">
                    Filtrar por categoría:
                  </Label>
                  <Select
                    value={categoria}
                    onValueChange={handleFilterChange}
                  >
                    <SelectTrigger
                      id="filter"
                      className="border border-gray-300 rounded-md py-2 px-4 w-full"
                    >
                      <span>
                        {categoria === "todo"
                          ? "Todas"
                          : categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Todas</SelectItem>
                      <SelectItem value="arboles">Árboles</SelectItem>
                      <SelectItem value="macetas">Macetas</SelectItem>
                      <SelectItem value="plantas">Plantas</SelectItem>
                      <SelectItem value="semillas">Semillas</SelectItem>
                      <SelectItem value="decoracion">Decoración</SelectItem>
                      <SelectItem value="fertilizantes">Fertilizantes</SelectItem>
                      <SelectItem value="herramientas">Herramientas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Disponibilidad */}
                <div className="flex flex-col space-y-4">
                  <Label htmlFor="availability" className="text-sm text-gray-600">
                    Disponibilidad:
                  </Label>
                  <Select
                    value={
                      availabilityFilter === undefined
                        ? ""
                        : availabilityFilter
                        ? "con-stock"
                        : "sin-stock"
                    }
                    onValueChange={handleAvailabilityChange}
                  >
                    <SelectTrigger
                      id="availability"
                      className="border border-gray-300 rounded-md py-2 px-4 w-full"
                    >
                      <span>
                        {availabilityFilter === undefined
                          ? "Selecciona disponibilidad"
                          : availabilityFilter
                          ? "Con stock"
                          : "Sin stock"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="con-stock">Con stock</SelectItem>
                      <SelectItem value="sin-stock">Sin stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Slider de precios + botón Limpiar */}
              <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
                <div className="w-full lg:w-1/2">
                  <Label htmlFor="price-range" className="text-sm text-gray-600 mb-2 block">
                    Rango de precios
                  </Label>
                   <Slider.Root
                    className="relative flex w-full touch-none select-none items-center"
                    value={priceRange}
                    onValueChange={handlePriceChange}
                    max={300}
                    step={10}
                    min={0}
                  >
                    {/* TRACK */}
                    <Slider.Track className="bg-gray-300 relative h-1 w-full grow rounded-full">
                      <Slider.Range className="absolute h-full bg-green-600 rounded-full" />
                    </Slider.Track>
                    {/* THUMBS */}
                    <Slider.Thumb className="block h-4 w-4 rounded-full bg-white border-2 border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600" />
                    <Slider.Thumb className="block h-4 w-4 rounded-full bg-white border-2 border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600" />
                  </Slider.Root>
                  <div className="flex justify-between text-sm mt-1">
                    <span>€{priceRange[0]}</span>
                    <span>€{priceRange[1]}</span>
                  </div>
                </div>
                <button
                  onClick={clearFilters}
                  className="mt-4 lg:mt-0 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md"
                >
                  Limpiar filtros
                </button>
              </div>

              {/* Grid de productos */}
              {filteredProducts.length === 0 ? (
                <div className="text-center text-lg text-gray-300">
                  ¡Ups! No hay productos que coincidan.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                  {filteredProducts.map((prod) => (
                    <PlantProductCard
                      key={prod.nombre}
                      imageUrl={prod.imagen[0] || null}
                      name={prod.nombre}
                      description={prod.descripcion}
                      price={prod.precio}
                      originalPrice={prod.originalPrice}
                      isNew={prod.destacado}
                      href={`/products/info?categoria=${encodeURIComponent(
                        prod.categoryFolder
                      )}&producto=${encodeURIComponent(prod.nombre)}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
