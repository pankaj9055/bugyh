CREATE TABLE "daily_returns" (
	"id" text PRIMARY KEY NOT NULL,
	"investment_id" text NOT NULL,
	"user_id" text NOT NULL,
	"amount" text NOT NULL,
	"return_date" timestamp DEFAULT now() NOT NULL,
	"processed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "investment_plans" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"amount" text NOT NULL,
	"daily_return" text NOT NULL,
	"max_withdrawal_per_day" text NOT NULL,
	"duration_days" integer DEFAULT 20 NOT NULL,
	"tier" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"upi_id" text,
	"qr_code_url" text,
	"bank_account_number" text,
	"bank_ifsc" text,
	"bank_name" text,
	"account_holder_name" text,
	"deposit_instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"upi_id" text,
	"qr_code_url" text,
	"bank_account_number" text,
	"bank_ifsc" text,
	"bank_name" text,
	"account_holder_name" text,
	"instructions" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referred_user_id" text NOT NULL,
	"level" integer NOT NULL,
	"commission_rate" text NOT NULL,
	"total_earned" text DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_chats" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_type" text NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"amount" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"reference" text,
	"payment_method" text,
	"payment_screenshot" text,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_investments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" integer NOT NULL,
	"amount" text NOT NULL,
	"daily_return" text NOT NULL,
	"total_returned" text DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"balance" text DEFAULT '0' NOT NULL,
	"total_deposits" text DEFAULT '0' NOT NULL,
	"total_withdrawals" text DEFAULT '0' NOT NULL,
	"total_profit" text DEFAULT '0' NOT NULL,
	"current_tier" integer DEFAULT 1 NOT NULL,
	"referral_code" text NOT NULL,
	"referred_by" text,
	"profile_photo" text,
	"upi_id" text,
	"account_holder_name" text,
	"account_number" text,
	"ifsc_code" text,
	"bank_name" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
