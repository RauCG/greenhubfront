'use client';

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/services/firebaseConfig";
import AdminSidebar from "@/components/admin/adminSidebar";
import Header from "@/components/header-component";
import { Plus, Pencil, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import * as Slider from "@radix-ui/react-slider";

interface Product {
  nombre: string;
  descripcion: string;
  imagen: string[];
  precio: number;
  originalPrice?: number;
  destacado: boolean;
  categoria_principal: string;
  stock: number;
}

interface AdminProduct extends Product {
  id: string;
  categoryPath: string;
}

interface FormValues {
  nombre: string;
  descripcion: string;
  imagenUrls: string;
  precio: number;
  originalPrice: number;
  destacado: boolean;
  categoria: string;
  stock: number;
}

export default function ProductsAdminPage() {
  const categories = [
    "herramientas",
    "arboles",
    "decoracion",
    "fertilizantes",
    "macetas",
    "plantas",
    "semillas",
  ];

  const emptyForm: FormValues = {
    nombre: "",
    descripcion: "",
    imagenUrls: "",
    precio: 0,
    originalPrice: 0,
    destacado: false,
    categoria: categories[0],
    stock: 0,
  };

  // --- Estados generales ---
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<boolean | undefined>(
    undefined
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Dialogs CRUD
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<FormValues>(emptyForm);

  // Layout (sidebar/header)
  const [collapsed, setCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const formatPrice = (p: number) => p;

  // --- Fetch de productos ---
  async function fetchProducts() {
    setLoading(true);
    const all: AdminProduct[] = [];
    for (const cat of categories) {
      const snap = await getDocs(collection(db, "productos", cat, "tipos"));
      snap.forEach((d) => {
        const data = d.data() as Product;
        all.push({
          id: d.id,
          nombre: data.nombre,
          descripcion: data.descripcion,
          imagen: data.imagen || ["/log.webp"],
          precio: data.precio,
          originalPrice: data.originalPrice,
          destacado: data.destacado,
          categoria_principal: data.categoria_principal,
          stock: data.stock || 0,
          categoryPath: cat,
        });
      });
    }
    setProducts(all);
    setLoading(false);
  }

  // --- Filtros locales ---
  useEffect(() => {
    let f = products;
    if (filterCategory !== "all") {
      f = f.filter((p) => p.categoryPath === filterCategory);
    }
    if (availabilityFilter !== undefined) {
      f = f.filter((p) =>
        availabilityFilter ? p.stock > 0 : p.stock === 0
      );
    }
    f = f.filter(
      (p) => p.precio >= priceRange[0] && p.precio <= priceRange[1]
    );
    setFilteredProducts(f);
  }, [products, filterCategory, availabilityFilter, priceRange]);

  // Reset página al cambiar el conjunto filtrado
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredProducts]);

  // Inicializar fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // --- Handlers diálogos ---
  function openAdd() {
    setEditingProduct(null);
    setFormValues(emptyForm);
    setFormOpen(true);
  }
  function openEdit(p: AdminProduct) {
    setEditingProduct(p);
    setFormValues({
      nombre: p.nombre,
      descripcion: p.descripcion,
      imagenUrls: p.imagen.join(", "),
      precio: p.precio,
      originalPrice: p.originalPrice ?? 0,
      destacado: p.destacado,
      categoria: p.categoryPath,
      stock: p.stock,
    });
    setFormOpen(true);
  }
  function openDelete(id: string) {
    setDeletingProductId(id);
    setDeleteOpen(true);
  }

  // Guardar (add o update)
  async function handleSave() {
    const urls = formValues.imagenUrls
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingProduct) {
      const ref = doc(
        db,
        "productos",
        editingProduct.categoryPath,
        "tipos",
        editingProduct.id
      );
      await updateDoc(ref, {
        nombre: formValues.nombre,
        descripcion: formValues.descripcion,
        imagen: urls,
        precio: formValues.precio,
        originalPrice: formValues.originalPrice,
        destacado: formValues.destacado,
        categoria_principal: formValues.categoria,
        stock: formValues.stock,
      });
    } else {
      await addDoc(
        collection(db, "productos", formValues.categoria, "tipos"),
        {
          nombre: formValues.nombre,
          descripcion: formValues.descripcion,
          imagen: urls,
          precio: formValues.precio,
          originalPrice: formValues.originalPrice,
          destacado: formValues.destacado,
          categoria_principal: formValues.categoria,
          stock: formValues.stock,
        }
      );
    }

    setFormOpen(false);
    fetchProducts();
  }

  // Confirmar borrado
  async function handleConfirmDelete() {
    if (!deletingProductId) return;
    const prod = products.find((p) => p.id === deletingProductId);
    if (prod) {
      await deleteDoc(
        doc(db, "productos", prod.categoryPath, "tipos", prod.id)
      );
    }
    setDeleteOpen(false);
    fetchProducts();
  }

  // Items de la página actual
  const paginated = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        variant="permanent"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Header
          collapsed={collapsed}
          isSidebarOpen={isSidebarOpen}
          isMobileMenuOpen={false}
          setIsMobileMenuOpen={() => {}}
        />
        <div className="p-6 pt-28">
          {/* — Filtros y Añadir — */}
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Categoría */}
            <div>
              <Label>Categoría</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-40">
                  {filterCategory === "all"
                    ? "Todas"
                    : filterCategory.charAt(0).toUpperCase() +
                      filterCategory.slice(1)}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Disponibilidad */}
            <div>
              <Label>Disponibilidad</Label>
              <Select
                value={
                  availabilityFilter === undefined
                    ? "all"
                    : availabilityFilter
                    ? "con-stock"
                    : "sin-stock"
                }
                onValueChange={(val) =>
                  setAvailabilityFilter(
                    val === "all" ? undefined : val === "con-stock"
                  )
                }
              >
                <SelectTrigger className="w-40">
                  {availabilityFilter === undefined
                    ? "Todos"
                    : availabilityFilter
                    ? "Con stock"
                    : "Sin stock"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="con-stock">Con stock</SelectItem>
                  <SelectItem value="sin-stock">Sin stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Slider Precio */}
            <div className="flex-1 min-w-[200px]">
              <Label>Precio (€)</Label>
              <Slider.Root
                className="relative flex w-full select-none touch-none items-center mt-2"
                min={0}
                max={300}
                step={10}
                value={priceRange}
                onValueChange={(val) =>
                  setPriceRange(val as [number, number])
                }
              >
                <Slider.Track className="bg-gray-300 relative h-1 w-full grow rounded-full">
                  <Slider.Range className="absolute h-full bg-green-600 rounded-full" />
                </Slider.Track>
                <Slider.Thumb className="block h-4 w-4 bg-white border-2 border-green-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600" />
                <Slider.Thumb className="block h-4 w-4 bg-white border-2 border-green-600 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600" />
              </Slider.Root>
              <div className="flex justify-between text-sm mt-1">
                <span>€{formatPrice(priceRange[0])}</span>
                <span>€{formatPrice(priceRange[1])}</span>
              </div>
            </div>
            {/* Botón Añadir */}
            <div className="self-end">
              <Button
                onClick={openAdd}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="mr-2" /> Añadir producto
              </Button>
            </div>
          </div>

          {/* — Tabla de productos — */}
          {loading ? (
            <p>Cargando productos...</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    {[
                      "Imagen",
                      "Nombre",
                      "Precio",
                      "Precio orig.",
                      "Destacado",
                      "Categoría",
                      "Stock",
                      "Acciones",
                    ].map((h) => (
                      <th key={h} className="p-2 border-b text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((p) => (
                    <tr key={p.id} className="odd:bg-green-50 hover:bg-gray-100">
                      <td className="p-2">
                        <Image
                          src={p.imagen[0] || "/log.webp"}
                          onError={(e) => {
                            e.currentTarget.src = "/log.webp";
                          }}
                          alt={p.nombre}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded"
                        />
                      </td>
                      <td className="p-2">{p.nombre}</td>
                      <td className="p-2">€{formatPrice(p.precio)}</td>
                      <td className="p-2">
                        {p.originalPrice != null
                          ? `€${formatPrice(p.originalPrice)}`
                          : "—"}
                      </td>
                      <td className="p-2">{p.destacado ? "Sí" : "No"}</td>
                      <td className="p-2">
                        {p.categoryPath.charAt(0).toUpperCase() +
                          p.categoryPath.slice(1)}
                      </td>
                      <td className="p-2">{p.stock}</td>
                      <td className="p-2 flex space-x-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1 hover:text-blue-600"
                        >
                          <Pencil />
                        </button>
                        <button
                          onClick={() => openDelete(p.id)}
                          className="p-1 hover:text-red-600"
                        >
                          <Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* — Paginación — */}
              <div className="flex justify-between items-center mt-4">
                <div>
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((cp) => Math.max(cp - 1, 1))}
                  >
                    Anterior
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                          page === currentPage
                            ? "bg-green-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((cp) => Math.min(cp + 1, totalPages))
                    }
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* — Dialog Añadir/Editar — */}
          <Dialog
            open={isFormOpen}
            onOpenChange={(open) => {
              setFormOpen(open);
              if (!open) setFormValues(emptyForm);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar producto" : "Añadir producto"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* ... Campos del formValues ... */}
              </div>
              <DialogFooter className="space-x-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSave}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* — Dialog Confirmar Borrado — */}
          <Dialog
            open={isDeleteOpen}
            onOpenChange={(open) => {
              setDeleteOpen(open);
              if (!open) setDeletingProductId(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar producto?</DialogTitle>
              </DialogHeader>
              <p>
                Esta acción no se puede deshacer. ¿Seguro que quieres borrar
                este producto?
              </p>
              <DialogFooter className="space-x-2 mt-4">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button variant="destructive" onClick={handleConfirmDelete}>
                  Borrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
