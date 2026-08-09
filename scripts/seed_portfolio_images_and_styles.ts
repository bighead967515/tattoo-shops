import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { artists, portfolioImages, shops } from "../backend/drizzle/schema.js";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Seeding portfolio images and styles for 10 profiles...");

  // 10 Profiles data with styles, specialties, ratings, and image URLs
  const profilesData = [
    {
      artistId: 1,
      shopName: "Iron & Ink Studio",
      city: "Los Angeles",
      state: "CA",
      styles: "Realism, Black & Grey, Portrait",
      specialties: "Portraits, Wildlife, Dark Fantasy",
      bio: "Award-winning black and grey realism studio in downtown LA specializing in portraits and high-contrast realism.",
      averageRating: "4.90",
      totalReviews: 48,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=800&q=80",
          caption: "Black & Grey Lion Realism Sleeve",
          style: "Realism",
        },
        {
          imageUrl: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=800&q=80",
          caption: "Detailed Portrait Work",
          style: "Portrait",
        },
      ],
    },
    {
      artistId: 2,
      shopName: "Sakura Tattoo Collective",
      city: "San Francisco",
      state: "CA",
      styles: "Japanese, Irezumi, Neo-Traditional",
      specialties: "Full Sleeves, Back Pieces, Japanese Motifs",
      bio: "Specializing in traditional Japanese Irezumi back pieces, dragon sleeves, and wave motifs with vibrant ink work.",
      averageRating: "4.95",
      totalReviews: 62,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=800&q=80",
          caption: "Traditional Japanese Dragon Sleeve",
          style: "Japanese",
        },
        {
          imageUrl: "https://images.unsplash.com/photo-1590246814884-570a1d5bd751?auto=format&fit=crop&w=800&q=80",
          caption: "Cherry Blossom & Waves Back Piece",
          style: "Irezumi",
        },
      ],
    },
    {
      artistId: 3,
      shopName: "Blackwork & Beyond",
      city: "Austin",
      state: "TX",
      styles: "Blackwork, Geometric, Dotwork",
      specialties: "Mandala, Sacred Geometry, Ornamentation",
      bio: "Precision geometric blackwork, sacred geometry, and heavy blackwork tattoos in the heart of Austin.",
      averageRating: "4.85",
      totalReviews: 39,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1550537687-c91072c4792d?auto=format&fit=crop&w=800&q=80",
          caption: "Geometric Mandala Shoulder Piece",
          style: "Geometric",
        },
        {
          imageUrl: "https://images.unsplash.com/photo-1568515045052-f9a854d7e607?auto=format&fit=crop&w=800&q=80",
          caption: "Full Arm Blackwork & Dotwork Pattern",
          style: "Blackwork",
        },
      ],
    },
    {
      artistId: 4,
      shopName: "Watercolor Dreams Tattoo",
      city: "Miami",
      state: "FL",
      styles: "Watercolor, Color, Floral",
      specialties: "Fluid Watercolor Splatters, Animals, Botanicals",
      bio: "Expressive watercolor tattoos featuring vivid color splashes, floral bouquets, and whimsical wildlife.",
      averageRating: "4.88",
      totalReviews: 31,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=800&q=80",
          caption: "Watercolor Phoenix Forearm Tattoo",
          style: "Watercolor",
        },
        {
          imageUrl: "https://images.unsplash.com/photo-1562962230-16e4623d36e6?auto=format&fit=crop&w=800&q=80",
          caption: "Vivid Botanical Floral Splatters",
          style: "Floral",
        },
      ],
    },
    {
      artistId: 5,
      shopName: "Old Town Tattoo",
      city: "Chicago",
      state: "IL",
      styles: "Traditional American, Old School, Flash",
      specialties: "Americana, Bold Outlines, Eagles & Ships",
      bio: "Classic bold outlines, bright solid colors, and timeless American traditional flash tattoos in Chicago.",
      averageRating: "4.92",
      totalReviews: 55,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=800&q=80",
          caption: "Traditional Eagle & Panther Flash",
          style: "Traditional American",
        },
      ],
    },
    {
      artistId: 6,
      shopName: "Fine Line Studio NYC",
      city: "New York",
      state: "NY",
      styles: "Fine Line, Minimalist, Single Needle",
      specialties: "Micro Tattoos, Script, Delicate Line Art",
      bio: "Manhattan studio specializing in hyper-delicate single needle fine line tattoos and minimal typography.",
      averageRating: "4.96",
      totalReviews: 74,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1590246814884-570a1d5bd751?auto=format&fit=crop&w=800&q=80",
          caption: "Micro Fine Line Butterfly & Cursive",
          style: "Fine Line",
        },
      ],
    },
    {
      artistId: 7,
      shopName: "Neon Skull Tattoo",
      city: "Seattle",
      state: "WA",
      styles: "New School, Pop Culture, Color",
      specialties: "Cartoon, Anime, Horror, Vibrant Ink",
      bio: "Custom new school tattoo art in Seattle with exaggerated proportions, graffiti flair, and vibrant pop culture icons.",
      averageRating: "4.80",
      totalReviews: 28,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1550537687-c91072c4792d?auto=format&fit=crop&w=800&q=80",
          caption: "Neon Cyberpunk Skull Chest Tattoo",
          style: "New School",
        },
      ],
    },
    {
      artistId: 8,
      shopName: "Heritage Ink Atlanta",
      city: "Atlanta",
      state: "GA",
      styles: "Realism, Cultural, Black & Grey",
      specialties: "Afrocentric Portraits, Melanin Rich Skin Shading",
      bio: "Celebrated studio specializing in rich black & grey realism and custom cultural homage pieces.",
      averageRating: "4.94",
      totalReviews: 43,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1568515045052-f9a854d7e607?auto=format&fit=crop&w=800&q=80",
          caption: "Cultural Portrait Realism",
          style: "Realism",
        },
      ],
    },
    {
      artistId: 19,
      shopName: "Vic'S Art For Life",
      city: "Juneau",
      state: "AK",
      styles: "Traditional, Wildlife, Blackwork",
      specialties: "Alaskan Wildlife, Bears, Nordic Runes",
      bio: "Juneau's premier custom studio crafting bold wildlife pieces and traditional Northern wilderness art.",
      averageRating: "4.87",
      totalReviews: 22,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=800&q=80",
          caption: "Grizzly Bear Wilderness Forearm Piece",
          style: "Wildlife",
        },
      ],
    },
    {
      artistId: 20,
      shopName: "Ultimate Body Piercing & Tattoo",
      city: "Anchorage",
      state: "AK",
      styles: "Neo-Traditional, Black & Grey, Chicano",
      specialties: "Custom Lettering, Dark Realism, Custom Sleeves",
      bio: "Anchorage full-service shop offering custom neo-traditional artwork, Chicano lettering, and dark blackwork.",
      averageRating: "4.82",
      totalReviews: 19,
      images: [
        {
          imageUrl: "https://images.unsplash.com/photo-1611501275019-9b5cda994e8d?auto=format&fit=crop&w=800&q=80",
          caption: "Chicano Script & Rose Tattoo",
          style: "Chicano",
        },
      ],
    },
  ];

  for (const item of profilesData) {
    // 1. Update artist details
    await db
      .update(artists)
      .set({
        shopName: item.shopName,
        city: item.city,
        state: item.state,
        styles: item.styles,
        specialties: item.specialties,
        bio: item.bio,
        averageRating: item.averageRating,
        totalReviews: item.totalReviews,
        isApproved: true,
        isHidden: false,
      })
      .where(eq(artists.id, item.artistId));

    // 2. Insert portfolio images
    for (const img of item.images) {
      const key = `seed/${item.artistId}/${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
      await db.insert(portfolioImages).values({
        artistId: item.artistId,
        imageUrl: img.imageUrl,
        imageKey: key,
        caption: img.caption,
        style: img.style,
        aiStyles: JSON.stringify([img.style]),
        aiTags: JSON.stringify([img.style.toLowerCase(), item.city.toLowerCase()]),
        qualityScore: 95,
      });
    }

    console.log(`Seeded portfolio and styles for artist ID ${item.artistId} (${item.shopName})`);
  }

  console.log("Successfully seeded portfolio images into 10 profiles!");
  await client.end();
}

main().catch(console.error);
