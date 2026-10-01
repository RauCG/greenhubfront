import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Nota: `eslint.ignoreDuringBuilds` y `typescript.ignoreBuildErrors` ya no son
  // opciones de next.config en Next 16. `next build` no ejecuta lint; el lint
  // se lanza con `npm run lint` (ESLint CLI) y los tipos con `npm run typecheck`.

  images: {
    // Antes: `unoptimized: true` (desactivaba por completo la optimización y
    // servía los originales de ~2 MB tal cual). Ya está activo de nuevo.
    remotePatterns: [
      // Imágenes de producto servidas desde Firebase Storage
      { protocol: 'https', hostname: 'firebasestorage.app' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      // Hosts externos referenciados en los datos de ejemplo
      { protocol: 'https', hostname: 'cdn.jsdelivr.net' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
      { protocol: 'https', hostname: 'd.media.kavehome.com' },
      { protocol: 'https', hostname: 'www.vecteezy.com' },
      { protocol: 'https', hostname: 'pxhere.com' },
      { protocol: 'https', hostname: 'agrospray.com.ar' },
      { protocol: 'https', hostname: 'curiosfera-recetas.com' },
      { protocol: 'https', hostname: 'nuestraflora.com' },
      { protocol: 'https', hostname: 'primiciadiario.com' },
      { protocol: 'https', hostname: 'tienda.grupomundoverde.mx' },
      { protocol: 'https', hostname: 'www.frutamare.com' },
      { protocol: 'https', hostname: 'www.gardencultura.com' },
      { protocol: 'https', hostname: 'www.herramientas.com' },
      { protocol: 'https', hostname: 'www.ikea.com' },
      { protocol: 'https', hostname: 'www.jardineriaon.com' },
      { protocol: 'https', hostname: 'www.leroymerlin.es' },
      { protocol: 'https', hostname: 'www.martillos.com' },
      { protocol: 'https', hostname: 'www.plantas.com' },
      { protocol: 'https', hostname: 'www.semillas.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
    // 4 h por defecto en Next 16 (antes 60 s): evita reoptimizar sin necesidad.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },

  experimental: {
    // Evita enviar el paquete entero de lucide-react al cliente.
    optimizePackageImports: [
      'lucide-react',
      '@mui/material',
      '@mui/icons-material',
      'date-fns',
    ],
  },

  turbopack: {},
}

export default nextConfig