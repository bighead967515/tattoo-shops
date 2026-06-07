CREATE TABLE "invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"shopName" varchar(255) NOT NULL,
	"state" varchar(100),
	"inviteCode" varchar(128) NOT NULL,
	"sentAt" timestamp DEFAULT now() NOT NULL,
	"openedAt" timestamp,
	"registeredAt" timestamp,
	"status" varchar(50) DEFAULT 'sent' NOT NULL,
	"userId" integer,
	CONSTRAINT "invitations_inviteCode_unique" UNIQUE("inviteCode")
);
--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;