// components/widget-wraper-component.tsx
"use client";

import dynamic from "next/dynamic";

// El widget del webchat se carga solo en el cliente (inyecta un <script> externo),
// así que lo diferimos para no penalizar la carga inicial del resto de la app.
const WidgetManager = dynamic(() => import("./ia-component"), { ssr: false });

export default function WidgetManagerWrapper() {
  // Ya no hace falta `key={pathname}`: WidgetManager gestiona el propio ciclo de
  // vida del script según la ruta, sin necesidad de remontarlo en cada navegación.
  return <WidgetManager />;
}