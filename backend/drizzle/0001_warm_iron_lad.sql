CREATE TABLE "shops" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shops_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"shop_name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"phone" text,
	"email" text,
	"is_verified" boolean DEFAULT false,
	"is_claimed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "idx_shops_name" ON "shops" USING btree ("shop_name");--> statement-breakpoint
CREATE INDEX "idx_shops_city" ON "shops" USING btree ("city");