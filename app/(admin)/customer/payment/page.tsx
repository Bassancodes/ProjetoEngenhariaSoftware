"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { CustomerHeader } from "@/components/CustomerHeader";

// Componente de fallback para o Suspense
function PaymentPageSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <CustomerHeader
        subtitle="BAXEIN WEAR - Pagamento"
        profileMenuItems={[
          { label: "Meu Carrinho", href: "/customer/cart" },
          { label: "Checkout", href: "/customer/checkout" },
          { label: "Meus Pedidos", href: "/customer/orders" },
          { label: "Catálogo", href: "/customer/catalog" },
        ]}
      />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <div className="h-10 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-72 h-72 bg-gray-200 rounded-lg animate-pulse mb-6"></div>
            <div className="h-20 bg-gray-200 rounded-lg w-full max-w-md animate-pulse"></div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
            <div className="space-y-4 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="h-32 bg-gray-200 rounded mb-6 animate-pulse"></div>
            <div className="space-y-3">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente interno que usa useSearchParams
function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [shipping, setShipping] = useState(15.0);
  const [orderNumber] = useState(() => `PED-${Date.now()}`);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const subtotal = getTotalPrice();
  const total = subtotal + shipping;

  // Recuperar orderId e shipping da URL
  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    const shippingParam = searchParams.get("shipping");
    
    if (orderIdParam) {
      setOrderId(Number(orderIdParam));
    }
    
    if (shippingParam) {
      setShipping(Number(shippingParam));
    }
  }, [searchParams]);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Redirecionar se o carrinho estiver vazio
  useEffect(() => {
    if (isAuthenticated && items.length === 0 && !paymentConfirmed) {
      router.push("/customer/checkout");
    }
  }, [items, router, paymentConfirmed, isAuthenticated]);

  const handleSimulatePayment = async () => {
    if (!orderId || !user?.id || isProcessingPayment) {
      alert("Erro: Informações do pedido não encontradas.");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuarioId: user.id,
          action: "confirm_payment",
          payment: {
            valor: total,
            frete: shipping,
            tipoPagamento: "PIX",
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message =
          typeof data.error === "string"
            ? data.error
            : "Não foi possível confirmar o pagamento. Tente novamente.";
        alert(message);
        return;
      }

      setPaymentConfirmed(true);
      // Limpar carrinho após 3 segundos e redirecionar
      setTimeout(() => {
        clearCart();
        router.push("/customer/catalog");
      }, 3000);
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      alert("Erro ao confirmar pagamento. Verifique sua conexão e tente novamente.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Não renderizar nada enquanto verifica autenticação ou redireciona
  if (isLoading || !isAuthenticated || (items.length === 0 && !paymentConfirmed)) {
    return null;
  }

  // Gerar dados do pagamento PIX simulado
  // Em produção, isso viria de uma API de pagamento
  const paymentData = JSON.stringify({
    type: "PIX",
    orderNumber: orderNumber,
    amount: total.toFixed(2),
    merchant: "BAXEINWEAR",
    description: `Pedido ${orderNumber} - ${items.length} item(ns)`,
    timestamp: new Date().toISOString(),
  });

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen bg-white">
        <CustomerHeader
          subtitle="BAXEIN WEAR - Pagamento Confirmado"
          profileMenuItems={[
            { label: "Meus Pedidos", href: "/customer/orders" },
            { label: "Catálogo", href: "/customer/catalog" },
          ]}
        />

        {/* Conteúdo Principal - Confirmação */}
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-12 h-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Pagamento Confirmado!
              </h1>
              <p className="text-lg text-gray-600 mb-2">
                Seu pedido foi processado com sucesso.
              </p>
              <p className="text-sm text-gray-500">
                Número do pedido: <span className="font-semibold">{orderNumber}</span>
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-gray-600 mb-4">
                Você será redirecionado para o catálogo em instantes...
              </p>
            </div>

            <Link
              href="/customer/catalog"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 rounded-md transition-colors duration-200"
            >
              Voltar ao Catálogo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <CustomerHeader
        subtitle="BAXEIN WEAR - Pagamento"
        profileMenuItems={[
          { label: "Meu Carrinho", href: "/customer/cart" },
          { label: "Checkout", href: "/customer/checkout" },
          { label: "Meus Pedidos", href: "/customer/orders" },
          { label: "Catálogo", href: "/customer/catalog" },
        ]}
      />

      {/* Conteúdo Principal */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Finalizar Pagamento
          </h1>
          <p className="text-gray-600">
            Escaneie o QR code abaixo para realizar o pagamento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna Esquerda - QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="mb-6 bg-white p-6 rounded-lg border-2 border-gray-300 shadow-sm flex items-center justify-center">
              <QRCodeSVG
                value={paymentData}
                size={280}
                level="H"
                includeMargin={true}
                style={{ width: "100%", height: "auto", maxWidth: "280px" }}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <p className="text-sm text-blue-900 text-center">
                <strong>Instruções:</strong> Abra o app do seu banco ou carteira digital, 
                escaneie o QR code acima e confirme o pagamento.
              </p>
            </div>
          </div>

          {/* Coluna Direita - Resumo do Pedido */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Resumo do Pedido
            </h2>

            {/* Lista de Produtos */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex items-start gap-3 pb-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Qtde: {item.quantity} | {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
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

            {/* Informações do Pedido */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Número do pedido:</strong> {orderNumber}
              </p>
              <p className="text-xs text-gray-500">
                Este é um pagamento simulado. O QR code contém dados do pedido 
                em formato JSON para demonstração.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="space-y-3">
              <Link
                href="/customer/checkout"
                className="block w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                Voltar ao Checkout
              </Link>
              <button
                onClick={handleSimulatePayment}
                disabled={isProcessingPayment}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
              >
                {isProcessingPayment ? "Processando..." : "Confirmar Pagamento"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Componente principal que envolve PaymentContent em Suspense
export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentPageSkeleton />}>
      <PaymentContent />
    </Suspense>
  );
}

