import Image from "next/image"
import Link from "next/link"

interface PlantProductCardProps {
  /** Acepta null: si el producto no tiene imagen, se usa el placeholder. */
  imageUrl: string | null
  name: string
  description: string
  price: number
  originalPrice?: number
  isNew?: boolean
  currency?: string
  href?: string
}

export default function PlantProductCard({
  imageUrl,
  name,
  description,
  price,
  originalPrice,
  isNew,
  currency = "€",
  href = "#",
}: PlantProductCardProps) {
  return (
    <Link
      href={href}
      className="group block transition-all duration-300 ease-out hover:shadow-2xl rounded-lg overflow-hidden transform hover:-translate-y-1"
    >
      <div className="relative bg-gray-100 rounded-t-lg overflow-hidden aspect-[3/4] mb-0">
        {" "}
        {/* Removed mb-4 */}
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {isNew && (
          <span className="absolute top-3 left-3 bg-white text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
            Nuevo
          </span>
        )}
      </div>
      <div className="p-4 bg-white rounded-b-lg">
        {" "}
        {/* Added padding here */}
        <h3 className="text-lg font-bold text-gray-800 mb-1 truncate group-hover:text-green-700 transition-colors">
          {name}
        </h3>
        <p className="text-sm text-gray-500 mb-2 h-10 overflow-hidden">{description}</p>{" "}
        {/* Fixed height for description */}
        <div className="flex items-baseline space-x-2">
          <p className="text-lg font-bold text-green-700">
            {price}
            {currency}
          </p>
          {originalPrice && (
            <p className="text-sm text-gray-400 line-through">
              {originalPrice}
              {currency}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}
