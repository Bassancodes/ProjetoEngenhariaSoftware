"use client";

import Image from "next/image";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, getTotalPrice } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const subtotal = getTotalPrice();
  const shipping = 25.0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-white">
      {/* Header Fixo */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo - Logo */}
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs text-gray-900 mb-1">
                  BAXEIN WEAR - Carrinho
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  BAXEINWEAR
                </div>
              </div>
            </div>

            {/* Lado Direito - Ações */}
            <div className="flex items-center gap-4">
              {/* Botão Sair */}
              <button className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200">
                Sair
              </button>

              {/* Usuário */}
              <div className="flex items-center gap-2 text-gray-900">
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="font-medium">CLIENTE</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seção do Carrinho - Ocupa 2 colunas */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Seu Carrinho
            </h1>

            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="bg-white border border-gray-200 rounded-lg p-6 flex items-start gap-4"
                  >
                    {/* Imagem do Produto */}
                    <div className="w-24 h-24 bg-gray-100 rounded-md relative overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>

                    {/* Informações do Produto */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-900 mb-2">
                        Tamanho: {item.selectedSize}, Cor: {item.selectedColor}
                      </p>
                      <p className="text-lg font-semibold text-gray-900 mb-4">
                        {formatPrice(item.price)}
                      </p>

                      {/* Controle de Quantidade */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            onClick={() =>
                              updateQuantity(item.cartItemId, item.quantity - 1)
                            }
                            className="px-3 py-1 text-gray-900 hover:bg-gray-100 transition-colors"
                          >
                            -
                          </button>
                          <span className="px-4 py-1 min-w-[3rem] text-center text-black">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.cartItemId, item.quantity + 1)
                            }
                            className="px-3 py-1 text-gray-900 hover:bg-gray-100 transition-colors text-black"
                          >
                            +
                          </button>
                        </div>

                        {/* Preço Total do Item */}
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Botão Remover */}
                    <button
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-2"
                      aria-label="Remover item"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Seu carrinho está vazio
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  Adicione produtos ao carrinho para continuar.
                </p>
                <Link
                  href="/customer/catalog"
                  className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Voltar ao Catálogo
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar - Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Resumo do Pedido
              </h2>

              {items.length > 0 ? (
                <>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between text-gray-900">
                      <span>Subtotal</span>
                      <span className="font-medium">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-900">
                      <span>Frete Estimado</span>
                      <span className="font-medium">{formatPrice(shipping)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-4 flex justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href="/customer/catalog"
                      className="block w-full text-center border-2 border-blue-300 text-blue-600 font-medium py-3 px-4 rounded-md hover:bg-blue-50 transition-colors duration-200"
                    >
                      Voltar ao Catálogo
                    </Link>
                    <Link
                      href="/customer/checkout"
                      className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
                    >
                      Ir para Fazer Pedido
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">
                    Adicione itens ao carrinho para ver o resumo
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
