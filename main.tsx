import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Import both themes, the default one is automatically applied
// The kids theme will be toggled via a button
import "./kids-theme.css";

createRoot(document.getElementById("root")!).render(<App />);
