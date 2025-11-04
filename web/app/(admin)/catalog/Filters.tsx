"use client";

import { FilterState } from "./types";

interface FiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableCategories: string[];
  availableSizes: string[];
  availableColors: string[];
  activeFiltersCount: number;
}

export default function Filters({
  filters,
  onFiltersChange,
  availableCategories,
  availableSizes,
  availableColors,
  activeFiltersCount,
}: FiltersProps) {
  const handleCategoryChange = (category: string) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? null : category,
    });
  };

  const handlePriceRangeChange = (priceRange: string) => {
    onFiltersChange({
      ...filters,
      priceRange: filters.priceRange === priceRange ? null : priceRange,
    });
  };

  const handleSizeToggle = (size: string) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    onFiltersChange({
      ...filters,
      sizes: newSizes,
    });
  };

  const handleColorToggle = (color: string) => {
    const newColors = filters.colors.includes(color)
      ? filters.colors.filter((c) => c !== color)
      : [...filters.colors, color];
    onFiltersChange({
      ...filters,
      colors: newColors,
    });
  };

  const handleBestSellersToggle = () => {
    onFiltersChange({
      ...filters,
      showBestSellers: !filters.showBestSellers,
    });
  };

  const handleOnSaleToggle = () => {
    onFiltersChange({
      ...filters,
      showOnSale: !filters.showOnSale,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      category: null,
      priceRange: null,
      sizes: [],
      colors: [],
      showBestSellers: false,
      showOnSale: false,
    });
  };

  const priceRanges = [
    { label: "Até R$ 100", value: "0-100" },
    { label: "R$ 100 - R$ 200", value: "100-200" },
    { label: "R$ 200 - R$ 300", value: "200-300" },
    { label: "R$ 300 - R$ 500", value: "300-500" },
    { label: "Acima de R$ 500", value: "500+" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
      {/* Header dos Filtros */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""} ativo{activeFiltersCount > 1 ? "s" : ""}
            </span>
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* Filtro de Categoria */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Categoria</h3>
          <div className="space-y-2">
            {availableCategories.map((category) => (
              <label
                key={category}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === category}
                  onChange={() => handleCategoryChange(category)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filtro de Preço */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Preço</h3>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <label
                key={range.value}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors"
              >
                <input
                  type="radio"
                  name="priceRange"
                  checked={filters.priceRange === range.value}
                  onChange={() => handlePriceRangeChange(range.value)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filtro de Tamanho */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Tamanho</h3>
          <div className="grid grid-cols-4 gap-2">
            {availableSizes.map((size) => (
              <label
                key={size}
                className={`flex items-center justify-center cursor-pointer border-2 rounded-md p-2 transition-colors ${
                  filters.sizes.includes(size)
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-gray-400 text-gray-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.sizes.includes(size)}
                  onChange={() => handleSizeToggle(size)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{size}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Filtro de Cor */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Cor</h3>
          <div className="flex flex-wrap gap-2">
            {availableColors.map((color) => (
              <label
                key={color}
                className={`flex items-center cursor-pointer border-2 rounded-md px-3 py-2 transition-colors ${
                  filters.colors.includes(color)
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="checkbox"
                  checked={filters.colors.includes(color)}
                  onChange={() => handleColorToggle(color)}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{
                      backgroundColor:
                        color === "Branco"
                          ? "#FFFFFF"
                          : color === "Preto"
                          ? "#000000"
                          : color === "Cinza"
                          ? "#808080"
                          : color === "Amarelo"
                          ? "#FFD700"
                          : color === "Azul"
                          ? "#0000FF"
                          : color === "Vermelho"
                          ? "#FF0000"
                          : color === "Verde"
                          ? "#008000"
                          : "#CCCCCC",
                    }}
                  />
                  <span className="text-sm text-gray-700">{color}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Filtros Outros */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Outros</h3>
          <div className="space-y-2">
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
              <input
                type="checkbox"
                checked={filters.showBestSellers}
                onChange={handleBestSellersToggle}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Mais vendidos</span>
            </label>
            <label className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
              <input
                type="checkbox"
                checked={filters.showOnSale}
                onChange={handleOnSaleToggle}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Em promoção</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

