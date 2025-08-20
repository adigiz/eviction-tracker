import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; // Import CSS directly

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("App render failed:", error);
  // Show error on page
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red;">
      <h1>React App Failed to Render</h1>
      <p>Error: ${error}</p>
      <pre>${error.stack}</pre>
    </div>
  `;
}
