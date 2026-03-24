export interface TattooShop {
  id: number;
  name: string;
  city: string;
  address: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  email: string;
  specialties: string;
  rating: string;
  lat?: number;
  lng?: number;
}

export interface ArtistShopSource {
  id: number;
  shopName: string;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  specialties: string | null;
  styles: string | null;
  averageRating: string | null;
  totalReviews: number | null;
  lat: string | null;
  lng: string | null;
}

function toRatingString(
  averageRating: string | null,
  totalReviews: number | null,
): string {
  const parsedRating = averageRating ? parseFloat(averageRating) : NaN;
  const reviewCount = totalReviews ?? 0;

  if (!Number.isFinite(parsedRating) || parsedRating <= 0 || reviewCount <= 0) {
    return "";
  }

  return `${parsedRating.toFixed(1)}/5 (${reviewCount} ratings)`;
}

function parseCoordinate(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function mapArtistsToTattooShops(
  artists: ArtistShopSource[],
): TattooShop[] {
  return artists.map((artist) => ({
    id: artist.id,
    name: artist.shopName,
    city: [artist.city, artist.state].filter(Boolean).join(", "),
    address: artist.address ?? "",
    phone: artist.phone ?? "",
    website: artist.website ?? "",
    facebook: artist.facebook ?? "",
    instagram: artist.instagram ?? "",
    email: "",
    specialties: artist.specialties ?? artist.styles ?? "",
    rating: toRatingString(artist.averageRating, artist.totalReviews),
    lat: parseCoordinate(artist.lat),
    lng: parseCoordinate(artist.lng),
  }));
}

export function filterTattooShops(
  shops: TattooShop[],
  query: string,
): TattooShop[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return shops;

  return shops.filter(
    (shop) =>
      shop.city.toLowerCase().includes(normalized) ||
      shop.name.toLowerCase().includes(normalized),
  );
}

export async function loadTattooShops(): Promise<TattooShop[]> {
  try {
    const response = await fetch("/tattoo-shops.csv");

    if (!response.ok) {
      throw new Error(`Failed to load tattoo shops: ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.split("\n").slice(1); // Skip header

    const shops: TattooShop[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse CSV line (handling quoted fields with commas)
      const fields: string[] = [];
      let currentField = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          fields.push(currentField.trim());
          currentField = "";
        } else {
          currentField += char;
        }
      }
      fields.push(currentField.trim()); // Add last field

      const shop: TattooShop = {
        id: shops.length + 1,
        name: fields[0] || "",
        city: fields[1] || "",
        address: fields[2] || "",
        phone: fields[3] || "",
        website: fields[4] || "",
        facebook: fields[5] || "",
        instagram: fields[6] || "",
        email: fields[7] || "",
        specialties: fields[8] || "",
        rating: fields[9] || "",
      };

      if (shop.name) {
        shops.push(shop);
      }
    }

    return shops;
  } catch (error) {
    console.error("Error loading tattoo shops:", error);
    return [];
  }
}

export function parseRating(ratingString: string): {
  rating: number;
  count: number;
} {
  const match = ratingString.match(/([\d.]+)\/5\s*\((\d+)\s*ratings?\)/);
  if (match) {
    return {
      rating: parseFloat(match[1]),
      count: parseInt(match[2], 10),
    };
  }
  return { rating: 0, count: 0 };
}

export function getInitials(name: string): string {
  const words = name.split(" ").filter((w) => w.length > 0);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
