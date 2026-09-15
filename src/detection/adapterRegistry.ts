import type { DetectionContext, TechnologyAdapter } from "./types.js";
import type { TechnologyProfile } from "../profile/types.js";

export class AdapterRegistry {
  private readonly adapters = new Map<
    TechnologyProfile["name"],
    TechnologyAdapter
  >();

  register(adapter: TechnologyAdapter): void {
    if (this.adapters.has(adapter.name)) {
      throw new Error(
        `An adapter named "${adapter.name}" is already registered.`,
      );
    }

    this.adapters.set(adapter.name, adapter);
  }

  get(name: TechnologyProfile["name"]): TechnologyAdapter | undefined {
    return this.adapters.get(name);
  }

  getAll(): TechnologyAdapter[] {
    return [...this.adapters.values()];
  }

  async detectAll(context: DetectionContext): Promise<TechnologyProfile[]> {
    const results = await Promise.all(
      this.getAll().map((adapter) => adapter.detect(context)),
    );

    return results.filter(
      (technology): technology is TechnologyProfile => technology !== undefined,
    );
  }
}
