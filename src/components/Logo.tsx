import Image from "next/image";
import Link from "next/link";

export function Logo({ variant = "dark", withTagline = false }: { variant?: "dark" | "light"; withTagline?: boolean }) {
  const src = variant === "dark" ? "/brand/logos/logo-full-dark.svg" : "/brand/logos/logo-full-light.svg";
  return (
    <Link href="/" className="inline-flex flex-col items-start">
      <Image src={src} alt="KIPUPU" width={180} height={74} priority />
      {withTagline && (
        <span className={variant === "dark" ? "text-kipupu-navy text-xs mt-1" : "text-white/80 text-xs mt-1"}>
          A plataforma que lava o seu carro
        </span>
      )}
    </Link>
  );
}
