// src/components/Icon.jsx
export default function Icon({ name, size = 22, className = "" }) {
  const iconMap = {
    success: ✔️",
    warning: "⚠️",
    error: "❌",
    info: "ℹ️",
    phone: "📱",
    authenticator: "🔐",
    check: "🟢",
    cross: "🔴",
    device: "💼",
    user: "👤",
    star: "⭐",
  };

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{ fontSize: size }}
    >
      {iconMap[name] || "❓"}
    </span>
  );
}