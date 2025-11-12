// frontend/src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";  // tu componente completo con lógica
import "./style.css";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
