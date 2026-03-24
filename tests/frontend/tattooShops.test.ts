import { describe, expect, it } from "vitest";
import {
  filterTattooShops,
  mapArtistsToTattooShops,
  parseRating,
} from "../../frontend/client/src/lib/tattooShops";

describe("Tattoo shop mapping and filtering", () => {
  it("maps DB artist rows into finder shop cards", () => {
    const shops = mapArtistsToTattooShops([
      {
        id: 11,
        shopName: "Ink Harbor",
        city: "New Orleans",
        state: "LA",
        address: "123 Royal St",
        phone: "555-0101",
        website: "https://inkharbor.example",
        facebook: null,
        instagram: "@inkharbor",
        specialties: "Realism,Traditional",
        styles: null,
        averageRating: "4.55",
        totalReviews: 12,
        lat: "29.9511",
        lng: "-90.0715",
      },
    ]);

    expect(shops).toHaveLength(1);
    expect(shops[0].id).toBe(11);
    expect(shops[0].name).toBe("Ink Harbor");
    expect(shops[0].city).toBe("New Orleans, LA");
    expect(shops[0].rating).toBe("4.5/5 (12 ratings)");
    expect(shops[0].lat).toBeCloseTo(29.9511);
    expect(shops[0].lng).toBeCloseTo(-90.0715);
  });

  it("falls back to styles when specialties are missing", () => {
    const shops = mapArtistsToTattooShops([
      {
        id: 22,
        shopName: "Bayou Ink",
        city: "Baton Rouge",
        state: "LA",
        address: null,
        phone: null,
        website: null,
        facebook: null,
        instagram: null,
        specialties: null,
        styles: "Blackwork, Japanese",
        averageRating: null,
        totalReviews: 0,
        lat: null,
        lng: null,
      },
    ]);

    expect(shops[0].specialties).toBe("Blackwork, Japanese");
    expect(shops[0].rating).toBe("");
  });

  it("filters by shop name or city case-insensitively", () => {
    const shops = [
      {
        id: 1,
        name: "Ink Harbor",
        city: "New Orleans, LA",
        address: "",
        phone: "",
        website: "",
        facebook: "",
        instagram: "",
        email: "",
        specialties: "",
        rating: "",
      },
      {
        id: 2,
        name: "Pelican Studio",
        city: "Lafayette, LA",
        address: "",
        phone: "",
        website: "",
        facebook: "",
        instagram: "",
        email: "",
        specialties: "",
        rating: "",
      },
    ];

    expect(filterTattooShops(shops, "harbor")).toHaveLength(1);
    expect(filterTattooShops(shops, "lafaYEtte")).toHaveLength(1);
    expect(filterTattooShops(shops, "")).toHaveLength(2);
  });

  it("parses rendered rating strings for card display", () => {
    const parsed = parseRating("4.8/5 (37 ratings)");
    expect(parsed.rating).toBe(4.8);
    expect(parsed.count).toBe(37);
  });
});
