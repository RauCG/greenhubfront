"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  doc,
  Timestamp
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
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface User {
  id: string;
  bio: string;
  createdAt: string;    // ISO string
  displayName: string;
  email: string;
  emailVerified: boolean;
  lastLogin: string;    // ISO string
  photoURL: string;
  role: string;
  username: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // filtros
  const [sortField, setSortField] = useState<keyof User>("displayName");
  const [filterRole, setFilterRole] = useState<string>("");

  // paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(users.length / itemsPerPage);

  // CRUD dialogs
  const [isFormOpen, setFormOpen] = useState(false);
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // estado del formulario
  const emptyForm = {
    displayName: "",
    email: "",
    emailVerified: false,
    role: "user",
    username: "",
    bio: ""
  };
  const [formValues, setFormValues] = useState(emptyForm);

  // Helper para formatear fecha
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
  };

  // Fetch usuarios y convertir Timestamp ➔ ISO
  async function fetchUsers() {
    setLoading(true);
    let q = query(collection(db, "users"), orderBy(sortField));
    if (filterRole) {
      q = query(q, where("role", "==", filterRole));
    }

    const snap = await getDocs(q);
    const data = snap.docs.map(d => {
      const raw = d.data() as any;
      return {
        id: d.id,
        bio: raw.bio,
        displayName: raw.displayName,
        email: raw.email,
        emailVerified: raw.emailVerified,
        role: raw.role,
        username: raw.username,
        photoURL: raw.photoURL || "/log.webp",
        createdAt:
          raw.createdAt instanceof Timestamp
            ? raw.createdAt.toDate().toISOString()
            : raw.createdAt,
        lastLogin:
          raw.lastLogin instanceof Timestamp
            ? raw.lastLogin.toDate().toISOString()
            : raw.lastLogin,
      } as User;
    });

    setUsers(data);
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, [sortField, filterRole]);

  // resetear página cuando cambian los usuarios
  useEffect(() => {
    setCurrentPage(1);
  }, [users]);

  // Abrir diálogo Añadir
  function openAdd() {
    setEditingUser(null);
    setFormValues(emptyForm);
    setFormOpen(true);
  }

  // Abrir diálogo Editar
  function openEdit(user: User) {
    setEditingUser(user);
    setFormValues({
      displayName: user.displayName,
      email: user.email,
      emailVerified: user.emailVerified,
      role: user.role,
      username: user.username,
      bio: user.bio
    });
    setFormOpen(true);
  }

  // Guardar (añadir o editar)
  async function handleSave() {
    if (editingUser) {
      const ref = doc(db, "users", editingUser.id);
      await updateDoc(ref, { ...formValues });
    } else {
      await addDoc(collection(db, "users"), {
        ...formValues,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        photoURL: ""
      });
    }
    setFormOpen(false);
    fetchUsers();
  }

  // Abrir confirmación borrado
  function openDelete(id: string) {
    setDeletingUserId(id);
    setDeleteOpen(true);
  }

  // Confirmar y ejecutar borrado
  async function handleConfirmDelete() {
    if (!deletingUserId) return;
    await deleteDoc(doc(db, "users", deletingUserId));
    setDeleteOpen(false);
    fetchUsers();
  }

  // usuarios de la página actual
  const paginatedUsers = users.slice(
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
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <Header
          collapsed={collapsed}
          isSidebarOpen={isSidebarOpen}
          isMobileMenuOpen={false}
          setIsMobileMenuOpen={() => {}}
        />
        <div className="p-6 pt-28">
          {/* filtros y botón añadir */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-4">
              <select
                className="border p-2 rounded"
                value={sortField}
                onChange={e => setSortField(e.target.value as keyof User)}
              >
                <option value="displayName">Nombre</option>
                <option value="lastLogin">Último login</option>
                <option value="createdAt">Fecha creación</option>
              </select>
              <select
                className="border p-2 rounded"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
              >
                <option value="">Todos los roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>
            <Button onClick={openAdd} className="flex items-center bg-green-600 text-white">
              <Plus className="mr-2" /> Añadir usuario
            </Button>
          </div>

          {/* tabla */}
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full table-auto border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border-b text-left">Foto</th>
                    <th className="p-2 border-b text-left">Nombre</th>
                    <th className="p-2 border-b text-left">Email</th>
                    <th className="p-2 border-b text-left">Verificado</th>
                    <th className="p-2 border-b text-left">Rol</th>
                    <th className="p-2 border-b text-left">Creado</th>
                    <th className="p-2 border-b text-left">Último login</th>
                    <th className="p-2 border-b text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map(u => (
                    <tr key={u.id} className="odd:bg-green-50 hover:bg-gray-100">
                      <td className="p-2">
                        <Image
                          src={u.photoURL || "/log.webp"}
                          onError={e => { e.currentTarget.src = "/log.webp"; }}
                          alt={u.displayName}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full"
                        />
                      </td>
                      <td className="p-2">{u.displayName}</td>
                      <td className="p-2">{u.email}</td>
                      <td className="p-2">{u.emailVerified ? "Sí" : "No"}</td>
                      <td className="p-2">{u.role}</td>
                      <td className="p-2">{formatDate(u.createdAt)}</td>
                      <td className="p-2">{formatDate(u.lastLogin)}</td>
                      <td className="p-2 flex space-x-2">
                        <button onClick={() => openEdit(u)} className="p-1 hover:text-blue-600">
                          <Pencil />
                        </button>
                        <button onClick={() => openDelete(u.id)} className="p-1 hover:text-red-600">
                          <Trash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* paginación */}
              <div className="flex justify-between items-center mt-4">
                <div>
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(cp => Math.max(cp - 1, 1))}
                  >
                    Anterior
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${
                        page === currentPage ? "bg-green-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(cp => Math.min(cp + 1, totalPages))}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Dialog Añadir / Editar */}
          <Dialog
            open={isFormOpen}
            onOpenChange={open => {
              setFormOpen(open);
              if (!open) setFormValues(emptyForm);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Editar usuario" : "Añadir usuario"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="displayName">Nombre</Label>
                  <Input
                    id="displayName"
                    value={formValues.displayName}
                    onChange={e => setFormValues(v => ({ ...v, displayName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formValues.email}
                    onChange={e => setFormValues(v => ({ ...v, email: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    id="emailVerified"
                    type="checkbox"
                    checked={formValues.emailVerified}
                    onChange={e => setFormValues(v => ({ ...v, emailVerified: e.currentTarget.checked }))}
                  />
                  <Label htmlFor="emailVerified">Verificado</Label>
                </div>
                <div>
                  <Label htmlFor="role">Rol</Label>
                  <select
                    id="role"
                    className="border p-2 rounded w-full"
                    value={formValues.role}
                    onChange={e => setFormValues(v => ({ ...v, role: e.target.value }))}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formValues.username}
                    onChange={e => setFormValues(v => ({ ...v, username: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={formValues.bio}
                    onChange={e => setFormValues(v => ({ ...v, bio: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter className="space-x-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSave}>Guardar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Confirmar Borrado */}
          <Dialog
            open={isDeleteOpen}
            onOpenChange={open => {
              setDeleteOpen(open);
              if (!open) setDeletingUserId(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar usuario?</DialogTitle>
              </DialogHeader>
              <p>Esta acción no se puede deshacer. ¿Seguro que quieres borrar este usuario?</p>
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
