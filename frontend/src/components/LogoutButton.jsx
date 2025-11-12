import React from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const handleLogout = () => {
    // Limpieza completa de sesión
    localStorage.clear();
    sessionStorage.clear();

    // Redirección federada de logout con retorno al portal
    const logoutUrl =
      "https://login.microsoftonline.com/common/oauth2/v2.0/logout?post_logout_redirect_uri=" +
      encodeURIComponent(window.location.origin);

    window.location.href = logoutUrl;
  };

  const confirmLogout = () => {
    if (confirm("¿Desea cerrrar la sesión?")) {
      handleLogout();
    }
  };

  return (
    <button
      onClick={confirmLogout}
      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl shadow-md hover:bg-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      title="Sign out securely"
    >
      <LogOut size={18} />
      <span>Sign out</span>
    </button>
  );
}
