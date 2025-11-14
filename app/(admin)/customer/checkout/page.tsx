"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { CustomerHeader } from "@/components/CustomerHeader";

interface CheckoutFormData {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  shippingOption: "pac" | "sedex";
}

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { items, getTotalPrice } = useCart();
  const [formData, setFormData] = useState<CheckoutFormData>({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    nomeCompleto: "",
    email: "",
    telefone: "",
    shippingOption: "pac",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === "cep") {
      setFormData((prev) => ({
        ...prev,
        [name]: formatCEP(value),
      }));
    } else if (name === "telefone") {
      setFormData((prev) => ({
        ...prev,
        [name]: formatPhone(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCEPSearch = async () => {
    const cepNumbers = formData.cep.replace(/\D/g, "");
    if (cepNumbers.length !== 8) {
      alert("CEP deve ter 8 dígitos");
      return;
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`);
      const data = await response.json();

      if (data.erro) {
        alert("CEP não encontrado");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        uf: data.uf || "",
      }));
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      alert("Erro ao buscar CEP. Tente novamente.");
    }
  };

  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const subtotal = getTotalPrice();
  const shipping = formData.shippingOption === "pac" ? 15.0 : 25.0;
  const total = subtotal + shipping;

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirecionar se o carrinho estiver vazio
  useEffect(() => {
    if (isAuthenticated && items.length === 0) {
      router.push("/customer/cart");
    }
  }, [items, router, isAuthenticated]);

  // Não renderizar nada enquanto verifica autenticação ou redireciona
  if (isLoading || !isAuthenticated || items.length === 0) {
    return null;
  }

  const handleGoToPayment = async () => {
    if (!user?.id || isCreatingOrder) {
      return;
    }

    // Validar campos obrigatórios do endereço
    if (!formData.cep || !formData.logradouro || !formData.numero || 
        !formData.bairro || !formData.cidade || !formData.uf || 
        !formData.nomeCompleto || !formData.email || !formData.telefone) {
      alert("Por favor, preencha todos os campos obrigatórios do endereço de entrega.");
      return;
    }

    // Validar formato de CEP (8 dígitos)
    const cepNumbers = formData.cep.replace(/\D/g, "");
    if (cepNumbers.length !== 8) {
      alert("CEP deve ter 8 dígitos.");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("Por favor, insira um email válido.");
      return;
    }

    // Validar UF (2 caracteres)
    if (formData.uf.trim().length !== 2) {
      alert("UF deve ter 2 caracteres.");
      return;
    }

    setIsCreatingOrder(true);

    try {
      // Preparar objeto de endereço de entrega
      const enderecoEntrega = {
        cep: formData.cep.trim(),
        logradouro: formData.logradouro.trim(),
        numero: formData.numero.trim(),
        complemento: formData.complemento.trim() || "",
        bairro: formData.bairro.trim(),
        cidade: formData.cidade.trim(),
        uf: formData.uf.trim().toUpperCase(),
        nomeCompleto: formData.nomeCompleto.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim(),
      };

      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          usuarioId: user.id,
          enderecoEntrega: enderecoEntrega,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          typeof data.error === "string"
            ? data.error
            : "Não foi possível criar o pedido. Tente novamente.";
        alert(message);
        return;
      }

      router.push("/customer/payment");
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      alert("Erro ao criar pedido. Verifique sua conexão e tente novamente.");
    } finally {
      setIsCreatingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <CustomerHeader
        subtitle="BAXEIN WEAR - Fazer Pedido (Checkout)"
        profileMenuItems={[
          { label: "Meu Carrinho", href: "/customer/cart" },
          { label: "Meus Pedidos", href: "/customer/orders" },
          { label: "Catálogo", href: "/customer/catalog" },
        ]}
      />

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Formulário */}
          <div className="lg:col-span-2 space-y-8">
            {/* Endereço de Entrega */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Endereço de Entrega
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                {/* CEP */}
                <div>
                  <label
                    htmlFor="cep"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    CEP
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleInputChange}
                      placeholder="00000-000"
                      maxLength={9}
                      className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                    <button
                      type="button"
                      onClick={handleCEPSearch}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-6 py-2 rounded-md transition-colors duration-200"
                    >
                      Buscar
                    </button>
                  </div>
                </div>

                {/* Logradouro */}
                <div>
                  <label
                    htmlFor="logradouro"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Logradouro
                  </label>
                  <input
                    type="text"
                    id="logradouro"
                    name="logradouro"
                    value={formData.logradouro}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                {/* Número e Complemento */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="numero"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Número
                    </label>
                    <input
                      type="text"
                      id="numero"
                      name="numero"
                      value={formData.numero}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="complemento"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Complemento
                    </label>
                    <input
                      type="text"
                      id="complemento"
                      name="complemento"
                      value={formData.complemento}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                </div>

                {/* Bairro, Cidade e UF */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="bairro"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Bairro
                    </label>
                    <input
                      type="text"
                      id="bairro"
                      name="bairro"
                      value={formData.bairro}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="cidade"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Cidade
                    </label>
                    <input
                      type="text"
                      id="cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="uf"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      UF
                    </label>
                    <input
                      type="text"
                      id="uf"
                      name="uf"
                      value={formData.uf}
                      onChange={handleInputChange}
                      maxLength={2}
                      className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-black"
                    />
                  </div>
                </div>

                {/* Nome Completo, E-mail e Telefone */}
                <div>
                  <label
                    htmlFor="nomeCompleto"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="nomeCompleto"
                    name="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-blue-500 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefone"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Telefone
                  </label>
                  <input
                    type="text"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleInputChange}
                    placeholder="(00) 00000-0000"
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
              </div>
            </div>

            {/* Opções de Entrega */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Opções de Entrega
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingOption"
                    value="pac"
                    checked={formData.shippingOption === "pac"}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">
                      Econômico (PAC) - {formatPrice(15.0)}
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="shippingOption"
                    value="sedex"
                    checked={formData.shippingOption === "sedex"}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">
                      Expresso (SEDEX) - {formatPrice(25.0)}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Resumo do Pedido
                </h2>
                <Link
                  href="/customer/cart"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Editar Carrinho
                </Link>
              </div>

              {/* Lista de Produtos */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-md relative overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-900 mt-1">
                        Qtde: {item.quantity} | {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Resumo Financeiro */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-900">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-900">
                  <span>Frete</span>
                  <span className="font-medium">{formatPrice(shipping)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-3">
                <Link
                  href="/customer/cart"
                  className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors duration-200"
                >
                  Voltar ao Carrinho
                </Link>
                <button
                  type="button"
                  onClick={handleGoToPayment}
                  disabled={isCreatingOrder}
                  className="w-full text-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                >
                  {isCreatingOrder ? "Criando pedido..." : "Ir para Pagamento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
