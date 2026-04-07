import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getAllShops, searchShops } from "./db";

export const shopRouter = router({
  // Get all shops from the shops table.
  getAll: publicProcedure.query(async () => {
    try {
      return await getAllShops();
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch shops",
      });
    }
  }),

  // Search shops by name, city, or state.
  search: publicProcedure
    .input(
      z.object({
        searchTerm: z.string().trim(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await searchShops(input.searchTerm);
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to search shops",
        });
      }
    }),

  // Get all unique cities for filter dropdowns.
  getCities: publicProcedure.query(async () => {
    try {
      const allShops = await getAllShops();
      const uniqueCities = Array.from(
        new Set(
          allShops
            .map((shop) => shop.city)
            .filter((city): city is string => typeof city === "string" && city.length > 0),
        ),
      );
      return uniqueCities.sort((a, b) => a.localeCompare(b));
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch cities",
      });
    }
  }),
});