import { PLACES, TAXONOMIES } from "../../../../packages/catalog/seed.js";
import type { CatalogRepository } from "../../../../packages/application/discovery.js";
export class SandboxCatalog implements CatalogRepository {
  async all() {
    return structuredClone(PLACES);
  }
  async byId(id: string) {
    return structuredClone(PLACES.find((place) => place.id === id));
  }
  async taxonomies() {
    return structuredClone(TAXONOMIES);
  }
}
