import Image from "next/image";

export function ProductImage({
  src,
  alt,
  colourHex,
  className = "",
  sizes = "160px",
  priority = false,
  anchor = "top",
}: {
  src: string;
  alt: string;
  colourHex: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  anchor?: "top" | "center"; // "top" for model shots, "center" for product-only shots
}) {
  return (
    // Tinted with the product colour while the photo loads.
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: `${colourHex}33` }}>
      {src && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`animate-fade-in object-cover ${anchor === "top" ? "object-top" : "object-center"}`}
        />
      )}
    </div>
  );
}
