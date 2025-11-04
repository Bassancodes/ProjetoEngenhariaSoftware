import Image from "next/image";

export default function CatalogPage() {
  // Dados estáticos dos produtos (será substituído por API futuramente)
  const products = [
    {
      id: 1,
      name: "Calça Legging Feminina",
      price: 189.99,
      image: "/legging.png",
    },
    {
      id: 2,
      name: "Camiseta Básica Branca Algodão",
      price: 79.90,
      image: "/white-shirt.png",
    },
    {
      id: 3,
      name: "Jaqueta de Couro Masculina Clássica",
      price: 549.00,
      image: "/leather-jacket.png",
    },
    {
      id: 4,
      name: "Moletom Canguru com Capuz Cinza",
      price: 219.50,
      image: "/grey-sweatshirt.png",
    },
    {
      id: 5,
      name: "Camisa Polo Preta",
      price: 129.90,
      image: "/black-shirt.png",
    },
    {
      id: 6,
      name: "Bermuda Chino Amarela",
      price: 159.99,
      image: "/yellow-short.png",
    },
  ];

  // Função para formatar preço em reais
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header Fixo */}
      <header className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Lado Esquerdo - Logo */}
            <div className="flex items-center gap-8">
              <div>
                <div className="text-xs text-gray-500 mb-1">BAXEIN WEAR - Product Catalog</div>
                <div className="text-2xl font-bold text-gray-800">BAXEINWEAR</div>
              </div>
            </div>

            {/* Lado Direito - Ações */}
            <div className="flex items-center gap-4">
              {/* Botão Sair */}
              <button className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200">
                Sair
              </button>

              {/* Barra de Busca */}
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar produtos"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>

              {/* Botão Filtrar */}
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200">
                Filtrar
              </button>

              {/* Carrinho */}
              <div className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors duration-200">
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span className="font-medium">Carrinho</span>
              </div>

              {/* Usuário */}
              <div className="flex items-center gap-2 text-gray-700">
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
        {/* Título Principal */}
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-12">
          Nossos Produtos
        </h1>

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col"
            >
              {/* Imagem do Produto */}
              <div className="w-full h-64 bg-gray-100 relative overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>

              {/* Informações do Produto */}
              <div className="p-6 flex flex-col flex-grow">
                {/* Nome do Produto */}
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {product.name}
                </h3>

                {/* Preço */}
                <div className="mb-4 flex-grow">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(product.price)}
                  </p>
                </div>

                {/* Botão Adicionar ao Carrinho */}
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200">
                  Adicionar ao Carrinho
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
