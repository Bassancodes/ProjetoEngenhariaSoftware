"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar automaticamente para o catálogo
    router.push("/customer/catalog");
  }, [router]);

  // Mostrar loading enquanto redireciona
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Bem-vindo ao BAXEIN WEAR</h1>
        <p className="text-gray-900 mb-8">Redirecionando para o catálogo...</p>
      </div>
    </div>
  );
}

