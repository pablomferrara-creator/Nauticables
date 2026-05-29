import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

async function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    await navigator.serviceWorker.register("/sw.js");
  }
}

void registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

