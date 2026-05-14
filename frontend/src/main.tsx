import React from "react";
import ReactDOM from "react-dom/client";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App";
import { wagmiConfig } from "./config/wagmi";
import { AppModeProvider } from "./lib/mode";
import "./index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#c77a2a",
            borderRadius: "small",
          })}
        >
          <AppModeProvider>
            <BrowserRouter>
              <App />
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    background: "#1c1917",
                    color: "#faf7f2",
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "14px",
                    borderRadius: "2px",
                    border: "1px solid #292524",
                  },
                }}
              />
            </BrowserRouter>
          </AppModeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
