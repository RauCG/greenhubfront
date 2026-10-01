"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import VideoContentCard from "@/components/public/video-content-card"
import Footer from "@/components/footer-component"
import Link from "next/link"
import AdminSidebar from "@/components/admin/adminSidebar"
import Header from "@/components/header-component"

import { useIntersectionObserver } from "@/hooks/use-intersection-observer" // Import the hook
import { useAuth } from "@/context/AuthContext";  // Asegúrate de importar el hook useAuth

type ProductCardInfo = {
  imageSrc: string
  title: string
  linkText: string
  href: string
}

type VideoSectionInfo = {
  videoSrc: string
  title: string
  description: string
  primaryButtonText?: string
  secondaryButtonText?: string
  category?: string
  smallText?: string
  videoPoster?: string
  themeColor?: "green" | "pink" | "blue"
}

const productCardsData: ProductCardInfo[] = [
  {
    imageSrc: "/images/product/fittonia-nerve-plant.jpeg",
    title: "Fittonias Vibrantes",
    linkText: "Descubrir",
    href: "#",
  },
  {
    imageSrc: "/images/product/parlor-palm-plant.jpeg",
    title: "Palmas de Salón",
    linkText: "Ver colección",
    href: "#",
  },
  { imageSrc: "/images/product/zz-plant.jpeg", title: "Resistentes Plantas", linkText: "Explorar", href: "#" },
  {
    imageSrc: "/images/product/fittonia-decorative-pot.jpeg",
    title: "Fittonias Decorativas",
    linkText: "Comprar ahora",
    href: "#",
  },
]

const videoSectionsData: VideoSectionInfo[] = [
  {
    videoSrc: "https://cdn.pixabay.com/video/2020/12/03/58142-487508532_large.mp4",
    category: "Colección Exclusiva",
    title: "El Jardín Secreto Iluminado",
    description: "Descubre plantas raras que brillan con luz propia y transforman tu espacio.",
    primaryButtonText: "Explorar Magia",
    videoPoster: "/glowing-flowers-dark-background.webp",
    themeColor: "pink",
  },
  {
    videoSrc: "https://cdn.pixabay.com/video/2020/05/23/39891-423345767_large.mp4",
    category: "Frescura Diaria",
    title: "Rocío Matutino en tus Pétalos",
    description: "Nuestras flores más frescas, entregadas con el cuidado que merecen.",
    primaryButtonText: "Ver Flores Frescas",
    secondaryButtonText: "Suscripciones",
    videoPoster: "/water-drops-on-petals.webp",
    themeColor: "blue",
  },
  {
    videoSrc: "https://cdn.pixabay.com/video/2023/07/07/170456-843367898_large.mp4",
    category: "Corazón Verde",
    title: "Belleza Salvaje para tu Hogar",
    description:
      "Trae la serenidad del bosque a tu hogar con nuestra colección de plantas silvestres y arreglos naturales.",
    primaryButtonText: "Descubrir Colección",
    videoPoster: "/lush-forest-path.webp",
    themeColor: "green",
  },
  {
    videoSrc: "https://cdn.pixabay.com/video/2023/03/01/152800-803733110_large.mp4",
    category: "Floraciones Encantadas",
    title: "Donde los Sueños Florecen",
    description: "Una selección mística de flores que inspiran y cautivan la imaginación.",
    primaryButtonText: "Ver Arreglos",
    videoPoster: "/magical-sparkling-flowers.webp",
    themeColor: "pink",
  },
  {
    videoSrc: "https://cdn.pixabay.com/video/2017/08/07/11207-228904631_large.mp4",
    category: "Jardín Dorado",
    title: "Flores Besadas por el Sol",
    description: "Celebra la calidez y los colores vibrantes de las flores que aman el sol.",
    primaryButtonText: "Comprar Solares",
    secondaryButtonText: "Guía de Cuidados",
    videoPoster: "/golden-hour-flowers.webp",
    themeColor: "green",
  },
]

// Helper component for animated sections
const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: string }> = ({
  children,
  className,
  delay,
}) => {
  const { ref, hasBeenInView } = useIntersectionObserver({ triggerOnce: true, threshold: 0.1 })
  return (
    <div
      ref={ref}
      data-inview={hasBeenInView}
      className={`opacity-0 translate-y-8 transition-all duration-700 ease-out data-[inview=true]:opacity-100 data-[inview=true]:translate-y-0 ${className || ""}`}
      style={{ transitionDelay: delay }}
    >
      {children}
    </div>
  )
}

export default function MetaLandingPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const contentClass = !isSidebarOpen
    ? "w-full" // Full width if sidebar is not present
    : collapsed
      ? "ml-20" // Sidebar collapsed (small width)
      : "ml-64";


  const { isAuthenticated, isAdmin,user } = useAuth(); // Accede al contexto de autenticación
  // Antes se pedía con `dpr_2` (doble resolución) y servía ~48 MB. Ahora se
  // limita el ancho y se deja que Cloudinary comprima (f_auto, q_auto).
  const heroVideoUrl =
    "https://d.media.kavehome.com/video/upload/w_1280,f_auto,q_auto/v1748876467/home-page-videos/a-sumers-table-slide-desktop.es_ES.mp4"

  // Reproduce el hero solo mientras está en pantalla y lo pausa al hacer
  // scroll para no seguir decodificando vídeo innecesariamente.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    el.muted = true

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const playPromise = el.play()
          if (playPromise !== undefined) playPromise.catch(() => {})
        } else {
          el.pause()
        }
      },
      { threshold: 0.25 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      setIsSidebarOpen(true)
    }
  }, [isAuthenticated, isAdmin]);



  // El estado del carrito vive en <Header /> (suscripción propia a Firestore
  // o localStorage), así que esta página no necesita duplicarlo.

  return (
    
    <div className="min-h-screen bg-white text-gray-800 font-sans flex">
      <AdminSidebar
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        variant="permanent"
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className={`flex-1 ${contentClass} transition-all duration-300`}>
        {/* El carrito lo gestiona Header por dentro (suscripción propia a
            Firestore). Esta página ya no le pasa estado de carrito. */}
        <Header
          collapsed={collapsed}
          isSidebarOpen={isSidebarOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />


        <main className="relative h-screen overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-0 left-0 w-full h-full object-cover z-0"
            poster="/placeholder.svg?width=1920&height=1080"
          >
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-0" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 pt-[calc(1.75rem+4rem+2rem)] sm:pt-[calc(1.75rem+4rem)]">
            <AnimatedSection delay="0s">
              <h1
                className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-tight text-white"
                style={{ textShadow: "0 2px 6px rgba(0,0,0,0.5)" }}
              >
                Vida en Plena Floración
              </h1>
            </AnimatedSection>
            <AnimatedSection delay="0.2s">
              <p
                className="text-lg sm:text-xl text-white mb-10 max-w-lg sm:max-w-2xl"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
              >
                Descubre la belleza natural que transforma tu hogar. Flores frescas y plantas exuberantes, entregadas a tu
                puerta.
              </p>
            </AnimatedSection>
            <AnimatedSection
              delay="0.4s"
              className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4"
            >
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 text-lg rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
              >
                Comprar Colección
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-black/20 hover:bg-black/30 border-transparent backdrop-blur-sm text-white px-10 py-4 text-lg rounded-full font-semibold shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto"
              >
                Ideas de Regalo
              </Button>
            </AnimatedSection>
          </div>
        </main>

        <section className="py-16 sm:py-24 bg-gray-50 overflow-hidden">
          {" "}
          {/* Added overflow-hidden for animations */}
          <div className="container mx-auto px-4 text-center">
            <AnimatedSection>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-800">Explora Nuestro Jardín</h2>
              <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
                Encuentra todo lo que necesitas para llenar tu vida de naturaleza, desde ramos vibrantes hasta plantas que
                purifican tu aire.
              </p>
            </AnimatedSection>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-4xl mx-auto">
              {productCardsData.map((card, index) => (
                <AnimatedSection key={card.title} delay={`${index * 0.1}s`}>
                  <a
                    href={card.href}
                    className="bg-white p-4 sm:p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group flex flex-col items-center text-center border border-gray-200 hover:border-green-300 transform hover:-translate-y-1"
                  >
                    <img
                      src={card.imageSrc || "/placeholder.svg"}
                      alt={card.title}
                      className="h-16 sm:h-20 mb-4 sm:mb-5 rounded-md object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 sm:mb-2">{card.title}</h3>
                    <span className="text-xs sm:text-sm text-green-600 group-hover:underline font-medium">
                      {card.linkText}
                    </span>
                  </a>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24 bg-white overflow-hidden">
          {" "}
          {/* Added overflow-hidden */}
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-10 lg:mb-12">
              {videoSectionsData.slice(0, 2).map((section, index) => (
                <AnimatedSection key={`row1-${index}`} delay={`${index * 0.15}s`}>
                  <VideoContentCard
                    videoSrc={section.videoSrc}
                    title={section.title}
                    description={section.description}
                    primaryButtonText={section.primaryButtonText}
                    secondaryButtonText={section.secondaryButtonText}
                    category={section.category}
                    smallText={section.smallText}
                    videoPoster={
                      section.videoPoster || `/placeholder.svg?width=800&height=600&query=modern+plant+scene+${index + 1}`
                    }
                    themeColor={section.themeColor}
                  />
                </AnimatedSection>
              ))}
            </div>

            {videoSectionsData[2] && (
              <AnimatedSection className="mb-8 sm:mb-10 lg:mb-12" delay="0s">
                <VideoContentCard
                  key="row2-center"
                  videoSrc={videoSectionsData[2].videoSrc}
                  title={videoSectionsData[2].title}
                  description={videoSectionsData[2].description}
                  primaryButtonText={videoSectionsData[2].primaryButtonText}
                  secondaryButtonText={videoSectionsData[2].secondaryButtonText}
                  category={videoSectionsData[2].category}
                  smallText={videoSectionsData[2].smallText}
                  videoPoster={
                    videoSectionsData[2].videoPoster ||
                    `/placeholder.svg?width=1200&height=675&query=large+plant+centerpiece`
                  }
                  themeColor={videoSectionsData[2].themeColor}
                />
              </AnimatedSection>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
              {videoSectionsData.slice(3, 5).map((section, index) => (
                <AnimatedSection key={`row3-${index}`} delay={`${index * 0.15}s`}>
                  <VideoContentCard
                    videoSrc={section.videoSrc}
                    title={section.title}
                    description={section.description}
                    primaryButtonText={section.primaryButtonText}
                    secondaryButtonText={section.secondaryButtonText}
                    category={section.category}
                    smallText={section.smallText}
                    videoPoster={
                      section.videoPoster ||
                      `/placeholder.svg?width=800&height=600&query=modern+plant+arrangement+${index + 3}`
                    }
                    themeColor={section.themeColor}
                  />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  )
}
