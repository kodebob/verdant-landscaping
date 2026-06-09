"use client";

import { useContext } from "react";
import { ConfigContext } from "@/context/ConfigContext";
import { businessConfig } from "@/config/businessConfig";

export function useBusinessConfig() {
  const ctx = useContext(ConfigContext);
  return ctx ?? businessConfig;
}
