import React from "react";
import ReactDOM from "react-dom/client";
import "../Popup/index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "../../@/components/ThemeProvider.tsx";
import { getConfig } from "../../@/lib/config.ts";

const queryClient = new QueryClient();

getConfig().then((config) => {
  ReactDOM.createRoot(document.getElementById("options")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <App initialConfig={config} />
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
});
