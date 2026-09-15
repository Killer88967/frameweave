import { AdapterRegistry } from "../detection/adapterRegistry.js";

import { NextAdapter } from "./nextAdapter.js";
import { ReactAdapter } from "./reactAdapter.js";
import { TailwindAdapter } from "./tailwindAdapter.js";

export function createDefaultAdapterRegistry(): AdapterRegistry {
  const registry = new AdapterRegistry();

  registry.register(new NextAdapter());
  registry.register(new ReactAdapter());
  registry.register(new TailwindAdapter());

  return registry;
}
