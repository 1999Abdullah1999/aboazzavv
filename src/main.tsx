import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { LayoutProvider } from "./contexts/LayoutContext";

createRoot(document.getElementById("root")!).render(
  <LayoutProvider>
    <App />
  </LayoutProvider>
);
