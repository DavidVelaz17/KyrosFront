import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone: un build autocontenido (solo los node_modules realmente usados en
  // runtime) pensado para copiarse tal cual a la imagen final de Docker sin cargar el resto del
  // repo ni las devDependencies. Ver Dockerfile.
  output: "standalone",
  // Desactivado: rompe silenciosamente los inputs no controlados de react-hook-form
  // (register() sin watch()) — los valores del DOM dejan de llegar al resolver de
  // zod y el formulario reporta "requerido" en todos los campos aunque estén llenos.
  // Reproducido y confirmado en create-group-modal.tsx (2026-07-10).
  reactCompiler: false,
  // Permite acceder al servidor de desarrollo desde otros dispositivos de la red local
  // (celular, otra computadora) usando la IP de esta máquina. Si la IP cambia (DHCP),
  // hay que actualizarla aquí.
  allowedDevOrigins: ["192.168.1.148"],
  // El service worker (public/sw.js) nunca debe quedarse cacheado por el navegador, para que cada
  // despliegue lo actualice; y solo puede cargar scripts del propio dominio. Ver la guía
  // "progressive-web-apps" de Next.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
