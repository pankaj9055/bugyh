ALTER TABLE "transactions" ADD COLUMN "transaction_number" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deposit_balance" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profit_balance" text DEFAULT '0' NOT NULL;