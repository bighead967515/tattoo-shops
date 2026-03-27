import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { supabaseAdmin } from "./_core/supabase";
import { publicProcedure, router } from "./_core/trpc";

export const shopRouter = router({
  // Search shops by name, city, or state.
  search: publicProcedure
    .input(
      z.object({
        searchTerm: z.string().trim().min(2),
      }),
    )
    .query(async ({ input }) => {
      const term = input.searchTerm.trim();
      const { data, error } = await supabaseAdmin
        .from("shops")
        .select("id, shop_name, address, city, state")
        .or(
          `shop_name.ilike.%${term}%,city.ilike.%${term}%,state.ilike.%${term}%`,
        )
        .limit(20);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data ?? [];
    }),

  // Get all unique cities for filter dropdowns.
  getCities: publicProcedure.query(async () => {
    const { data, error } = await supabaseAdmin
      .from("shops")
      .select("city")
      .not("city", "is", null);

    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }

    const uniqueCities = Array.from(
      new Set(
        (data ?? [])
          .map((shop) => shop.city)
          .filter((city): city is string => typeof city === "string"),
      ),
    );

    return uniqueCities.sort((a, b) => a.localeCompare(b));
  }),
});