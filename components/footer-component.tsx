import Link from "next/link"
import Image from "next/image"
import { Globe, ChevronDown, Instagram, Facebook, Linkedin, XIcon, Youtube, PinIcon as Pinterest } from "lucide-react"

const footerSections = [
  {
    title: "Sobre GreenHub",
    links: [
      { text: "Nuestra Historia", href: "#" },
      { text: "Compromiso Sostenible", href: "#" },
      { text: "Encuentra una Tienda", href: "#" },
      { text: "Trabaja con Nosotros", href: "#" },
    ],
  },
  {
    title: "Ayuda y Contacto",
    links: [
      { text: "Preguntas Frecuentes (FAQ)", href: "#" },
      { text: "Envíos y Devoluciones", href: "#" },
      { text: "Estado de tu Pedido", href: "#" },
      { text: "Contáctanos", href: "#" },
    ],
  },
  {
    title: "Colaboraciones",
    links: [
      { text: "Prensa y Embajadores", href: "#" },
      { text: "Profesionales y Empresas", href: "#", new: true },
      { text: "Programa de Afiliados", href: "#" },
      { text: "¿Eres Proveedor?", href: "#" },
    ],
  },
  {
    title: "Tu Cuenta",
    links: [
      { text: "Suscríbete al Newsletter", href: "#" },
      { text: "Regístrate", href: "#" },
      { text: "Iniciar Sesión", href: "#" },
    ],
  },
]

const socialLinks = [
  { Icon: Instagram, href: "#", name: "Instagram" },
  { Icon: Facebook, href: "#", name: "Facebook" },
  { Icon: Pinterest, href: "#", name: "Pinterest" },
  { Icon: Linkedin, href: "#", name: "LinkedIn" },
  { Icon: XIcon, href: "#", name: "X (Twitter)" },
  { Icon: Youtube, href: "#", name: "Youtube" },
]

const paymentMethods = [
  { src: "/payment-methods/visa.webp", alt: "Visa" },
  { src: "/payment-methods/mastercard.webp", alt: "Mastercard" },
  { src: "/payment-methods/amex.webp", alt: "American Express" },
  { src: "/payment-methods/paypal.webp", alt: "PayPal" },
  { src: "/payment-methods/klarna.webp", alt: "Klarna" },
  { src: "/payment-methods/apple-pay.webp", alt: "Apple Pay" },
  { src: "/payment-methods/google-pay.webp", alt: "Google Pay" },
]

const legalLinks = [
  { text: "Aviso Legal", href: "#" },
  { text: "Términos y Condiciones", href: "#" },
  { text: "Política de Privacidad", href: "#" },
  { text: "Política de Cookies", href: "#" },
  { text: "Certificado FSC®", href: "#" },
  { text: "Canal Ético", href: "#" },
  { text: "Configurar Cookies", href: "#" },
]

export default function Footer() {
  return (
    <footer className="bg-green-700 text-white pt-16 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top section: Links and Newsletter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.text}>
                    <Link
                      href={link.href}
                      className="text-sm text-green-100 hover:text-white hover:underline transition-colors"
                    >
                      {link.text}
                      {link.new && (
                        <span className="ml-2 bg-pink-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-sm">
                          Nuevo
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider mb-4">Únete a Nuestra Comunidad Floral</h4>
            <p className="text-sm text-green-100 mb-4">
              Recibe inspiración, ofertas exclusivas y novedades sobre el mundo de las plantas y flores.
            </p>
            <form className="space-y-3">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="w-full px-4 py-2.5 rounded-md border border-green-500 bg-green-600 text-white placeholder-green-300 focus:outline-none focus:border-white focus:ring-1 focus:ring-white text-sm"
              />
              <button
                type="submit"
                className="w-full bg-white text-green-700 font-semibold py-2.5 px-4 rounded-md hover:bg-green-50 transition-colors text-sm"
              >
                Suscribirme Ahora
              </button>
            </form>
            <div className="mt-6 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-green-200" />
              <span className="text-sm text-green-100 mr-1">España</span>
              <span className="text-green-400 mr-1">|</span>
              <button className="text-sm text-green-100 hover:text-white flex items-center">
                Español
                <ChevronDown className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        </div>

        {/* Separator */}
        <hr className="border-green-600 mb-8" />

        {/* Middle section: Social Media and Payment Methods */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <Link
                key={social.name}
                href={social.href}
                aria-label={social.name}
                className="text-green-200 hover:text-white transition-colors"
              >
                <social.Icon className="h-6 w-6" />
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap justify-center items-center gap-3">
            {paymentMethods.map((method) => (
              <div key={method.alt} className="bg-white p-1 rounded-sm h-6 flex items-center">
                <Image
                  src={method.src || "/placeholder.svg"}
                  alt={method.alt}
                  width={32}
                  height={20}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Separator */}
        <hr className="border-green-600 mb-8" />

        {/* Bottom section: Legal Links and Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-green-200 gap-4">
          <nav className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.text} href={link.href} className="hover:text-white hover:underline transition-colors">
                {link.text}
              </Link>
            ))}
          </nav>
          <p className="text-center md:text-right">
            &copy; {new Date().getFullYear()} GreenHub. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
