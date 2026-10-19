CREATE TYPE "public"."ledger_reason" AS ENUM('signup_bonus', 'bet', 'backbet', 'payout', 'refund', 'daily', 'rebuy', 'admin_adjust');--> statement-breakpoint
CREATE TABLE "ledger" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"delta" bigint NOT NULL,
	"balance_after" bigint NOT NULL,
	"reason" "ledger_reason" NOT NULL,
	"ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ledger_delta_not_zero" CHECK ("ledger"."delta" <> 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"balance" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_balance_not_negative" CHECK ("users"."balance" >= 0)
);
--> statement-breakpoint
ALTER TABLE "ledger" ADD CONSTRAINT "ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_user_id_created_at_index" ON "ledger" USING btree ("user_id","created_at");