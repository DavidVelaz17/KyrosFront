import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Desactivado: rompe silenciosamente los inputs no controlados de react-hook-form
  // (register() sin watch()) — los valores del DOM dejan de llegar al resolver de
  // zod y el formulario reporta "requerido" en todos los campos aunque estén llenos.
  // Reproducido y confirmado en create-group-modal.tsx (2026-07-10).
  reactCompiler: false,
};

export default nextConfig;
