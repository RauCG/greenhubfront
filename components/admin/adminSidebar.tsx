"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext"; // Usamos el hook de autenticación
import { Home, ShoppingCart, BarChart, PersonStanding,ChevronLeft,ChevronRight  } from "lucide-react"; // Importa los íconos
import Link from "next/link";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
  // Nota: `variant` no se usa en el cuerpo del componente (el sidebar es un
  // div propio, no un MUI Drawer), pero se mantiene en la firma porque quien
  // lo renderiza lo pasa. Aceptamos los tres valores que usan los callers.
  variant: "permanent" | "persistent" | "temporary";
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}

export default function AdminSidebar({
  open,
  onClose,
  variant,
  collapsed,
  setCollapsed,
}: AdminSidebarProps) {
  const { isAuthenticated, isAdmin } = useAuth(); // Usamos el hook de autenticación
  const pathname = usePathname();

  const [sidebarVisible, setSidebarVisible] = useState(false); // Para controlar la visibilidad del sidebar
  
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setSidebarVisible(true); // Solo mostrar el sidebar si el usuario está autenticado y es admin
    } else {
      setSidebarVisible(false); // Si no es admin o no está autenticado, ocultar el sidebar
    }
  }, [isAuthenticated, isAdmin]);

  // Lista de ítems con texto, ruta e íconos
  const menuItems = [
    { text: "Página principal", link: "/home", icon: <Home /> },
    { text: "Pedidos", link: "/admin/pedidos", icon: <ShoppingCart /> },
    { text: "Estadísticas", link: "/admin/estadisticas", icon: <BarChart /> },
    { text: "Productos", link: "/admin/productos", icon: <ShoppingCart /> },
    { text: "Usuarios", link: "/admin/usuarios", icon: <PersonStanding /> },
  ];

return (
    sidebarVisible && (
      <div
        className={`${
          open ? "block" : "hidden"
        } fixed top-0 left-0 bg-white shadow-md h-full overflow-y-auto transition-all duration-300 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          <h2
            className={`font-semibold text-lg ${collapsed ? "hidden" : ""} border-l-4 pl-2 border-green-600`}
          >
            Panel de Administración
          </h2>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 flex items-center justify-center"
          >
            {collapsed ? (
              <div className="py-2">
              <ChevronRight  />
              </div>
            ) : (
              <ChevronLeft />
            )}
          </button>
        </div>

        <div className="mt-4 space-y-6 px-4">
          {menuItems.map((item, index) => (
            <Link href={item.link} key={item.text}>
            <div
              key={item.text}
              className={`${
                pathname === item.link 
                  ? "bg-green-100 text-green-600"
                  : "text-gray-700"
              } hover:bg-green-100 hover:text-green-600 p-2 rounded-md transition-colors duration-300 flex items-center my-4`}
            >
              <div className="mr-2">{item.icon}</div>
              {!collapsed && <span>{item.text}</span>}
            </div>
            </Link>
          ))}
        </div>
      </div>
    )
  );
}
