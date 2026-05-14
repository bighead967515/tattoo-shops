import { describe, expect, it } from "vitest";
import {
  hasActiveFilterValues,
  normalizeFilterText,
  type FilterState,
} from "../../frontend/client/src/components/ArtistFilters";

function baseFilters(): FilterState {
  return {
    shopName: "",
    styles: [],
    minRating: 0,
    minExperience: 0,
    city: "",
    state: "",
  };
}

describe("ArtistFilters logic", () => {
  it("trims filter text consistently", () => {
    expect(normalizeFilterText("  Delta Ink  ")).toBe("Delta Ink");
    expect(normalizeFilterText("   ")).toBe("");
  });

  it("does not consider whitespace-only text as active filters", () => {
    const filters = {
      ...baseFilters(),
      shopName: "   ",
      city: "\t",
      state: "  ",
    };

    expect(hasActiveFilterValues(filters)).toBe(false);
  });

  it("considers non-empty shopName as an active filter", () => {
    const filters = {
      ...baseFilters(),
      shopName: "  Ink Haven ",
    };

    expect(hasActiveFilterValues(filters)).toBe(true);
  });

  it("considers style/rating/experience as active filters", () => {
    expect(
      hasActiveFilterValues({
        ...baseFilters(),
        styles: ["Realism"],
      }),
    ).toBe(true);

    expect(
      hasActiveFilterValues({
        ...baseFilters(),
        minRating: 4,
      }),
    ).toBe(true);

    expect(
      hasActiveFilterValues({
        ...baseFilters(),
        minExperience: 3,
      }),
    ).toBe(true);
  });
});
