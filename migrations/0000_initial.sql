CREATE TABLE "applied_weeks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"week_number" integer NOT NULL,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"adjustments" jsonb NOT NULL,
	CONSTRAINT "applied_weeks_user_id_week_number_unique" UNIQUE("user_id","week_number")
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"current_quantity" numeric NOT NULL,
	"unit" text NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"purchase_date" timestamp,
	"notes" text,
	CONSTRAINT "inventory_user_id_product_name_unique" UNIQUE("user_id","product_name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"metric_key" text NOT NULL,
	"metric_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_metrics_metric_key_unique" UNIQUE("metric_key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"lawn_size" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "weekly_schedule" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_number" integer NOT NULL,
	"month" text NOT NULL,
	"week_of_month" integer NOT NULL,
	"is_rest_week" integer DEFAULT 0 NOT NULL,
	"application_days" jsonb DEFAULT '[]' NOT NULL,
	"general_notes" text,
	CONSTRAINT "weekly_schedule_week_number_unique" UNIQUE("week_number")
);
--> statement-breakpoint
ALTER TABLE "applied_weeks" ADD CONSTRAINT "applied_weeks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");