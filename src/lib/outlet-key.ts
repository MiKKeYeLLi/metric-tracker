/**
 * The matching key for an outlet name: "TechCabal", "Tech Cabal" and "techcabal." all become "techcabal".
 * Mirrored in SQL by migration 20261018055754_add_press_outlets.
 */
export function outletKey(name: string) {
  return name.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}
