"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

type HeaderMenuItem = {
  label: string;
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
};

type CustomerHeaderProps = {
  subtitle: string;
  title?: string;
  actions?: ReactNode;
  profileMenuItems?: HeaderMenuItem[];
  showLogoutButton?: boolean;
};

export function CustomerHeader({
  subtitle,
  title = "BAXEINWEAR",
  actions,
  profileMenuItems,
  showLogoutButton = true,
}: CustomerHeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const items = useMemo<HeaderMenuItem[]>(() => {
    const defaults: HeaderMenuItem[] = [
      {
        label: "Meus Pedidos",
        href: "/customer/orders",
      },
    ];

    if (!profileMenuItems || profileMenuItems.length === 0) {
      return defaults;
    }

    return profileMenuItems;
  }, [profileMenuItems]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleMenuSelect = (item: HeaderMenuItem) => {
    if (item.disabled) return;

    if (item.onSelect) {
      item.onSelect();
    } else if (item.href) {
      router.push(item.href);
    }

    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const profileInitial = (user?.nome ?? "Cliente").charAt(0).toUpperCase();
  
  // Determinar tipo de usuário e estilo
  const isLojista = user?.tipoPerfil === "lojista";
  const userTypeLabel = isLojista ? "Lojista" : "Cliente";
  const profileBgColor = isLojista ? "bg-purple-100" : "bg-blue-100";
  const profileTextColor = isLojista ? "text-purple-700" : "text-blue-700";

  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500 mb-1">{subtitle}</div>
            <div className="text-2xl font-bold text-black">{title}</div>
          </div>

          <div className="flex items-center gap-4">
            {actions}

            {showLogoutButton && (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-md transition-colors duration-200"
              >
                Sair
              </button>
            )}

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((state) => !state)}
                className="flex items-center gap-2 text-gray-900 focus:outline-none"
              >
                <div className={`w-8 h-8 rounded-full ${profileBgColor} flex items-center justify-center ${profileTextColor} font-semibold uppercase`}>
                  {profileInitial}
                </div>
                <div className="hidden sm:flex flex-col leading-tight text-left">
                  <span className="font-medium text-sm">
                    {user?.nome ?? "Cliente"}
                  </span>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">
                    {userTypeLabel}
                  </span>
                </div>
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-50">
                  {items.map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => handleMenuSelect(item)}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        item.disabled
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


