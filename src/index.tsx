// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { ThemeProvider } from "@0xsequence/design-system";
// import "@0xsequence/design-system/styles.css";
import { KitProvider } from "@0xsequence/kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
// import { createConfig} from '@wagmi/core'

import { config } from "./config";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

const queryClient = new QueryClient();

function Dapp() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <KitProvider
          config={{ defaultTheme: "light", signIn: { showEmailInput: false } }}
        >
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </KitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Dapp />
    </ThemeProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
