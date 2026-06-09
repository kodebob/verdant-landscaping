"use client";

import { createContext } from "react";
import { businessConfig } from "@/config/businessConfig";

export type BusinessConfig = typeof businessConfig;

export const ConfigContext = createContext<BusinessConfig | null>(null);

export function ConfigProvider({
  config,
  children,
}: {
  config: BusinessConfig;
  children: React.ReactNode;
}) {
  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}
