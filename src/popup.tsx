import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Centralized style imports
import "./styles/base.css";
import "./styles/chat.css";
import "./styles/input.css";
import "./styles/menu.css";
import "./styles/modal.css";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
