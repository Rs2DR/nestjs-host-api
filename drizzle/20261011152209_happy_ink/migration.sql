CREATE TYPE "rental_status" AS ENUM('pending_payment', 'active', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('pending', 'succeeded', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL UNIQUE,
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_name_not_empty_check" CHECK (length(trim("name")) > 0),
	CONSTRAINT "users_email_not_empty_check" CHECK (length(trim("email")) > 0),
	CONSTRAINT "users_password_hash_not_empty_check" CHECK (length("password_hash") > 0)
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"fcm_token" varchar(500) NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_devices_fcm_token_not_empty_check" CHECK (length(trim("fcm_token")) > 0)
);
--> statement-breakpoint
CREATE TABLE "rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"server_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"status" "rental_status" DEFAULT 'pending_payment'::"rental_status" NOT NULL,
	"hours" integer NOT NULL,
	"hourly_rate" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_expires_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rentals_hours_positive_check" CHECK ("hours" > 0),
	CONSTRAINT "rentals_hourly_rate_positive_check" CHECK ("hourly_rate" > 0),
	CONSTRAINT "rentals_total_amount_positive_check" CHECK ("total_amount" > 0),
	CONSTRAINT "rentals_currency_lowercase_check" CHECK ("currency" = lower("currency")),
	CONSTRAINT "rentals_pending_has_expiry_check" CHECK ("status" <> 'pending_payment' OR "payment_expires_at" IS NOT NULL),
	CONSTRAINT "rentals_active_has_dates_check" CHECK ("status" <> 'active' OR (
        "started_at" IS NOT NULL AND
        "ends_at" IS NOT NULL AND
        "ends_at" > "started_at"
      ))
);
--> statement-breakpoint
CREATE TABLE "servers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"slug" varchar(120) NOT NULL UNIQUE,
	"name" varchar(255) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"cpu_model" varchar(255) NOT NULL,
	"cpu_cores" integer NOT NULL,
	"ram_gb" integer NOT NULL,
	"storage_gb" integer NOT NULL,
	"storage_type" varchar(32) DEFAULT 'NVMe SSD' NOT NULL,
	"bandwidth_mbps" integer NOT NULL,
	"hourly_rate" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'eur' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "servers_name_not_empty_check" CHECK (length(trim("name")) > 0),
	CONSTRAINT "servers_slug_not_empty_check" CHECK (length(trim("slug")) > 0),
	CONSTRAINT "servers_latitude_range_check" CHECK ("latitude" >= -90 AND "latitude" <= 90),
	CONSTRAINT "servers_longitude_range_check" CHECK ("longitude" >= -180 AND "longitude" <= 180),
	CONSTRAINT "servers_cpu_cores_positive_check" CHECK ("cpu_cores" > 0),
	CONSTRAINT "servers_ram_positive_check" CHECK ("ram_gb" > 0),
	CONSTRAINT "servers_storage_positive_check" CHECK ("storage_gb" > 0),
	CONSTRAINT "servers_bandwidth_positive_check" CHECK ("bandwidth_mbps" > 0),
	CONSTRAINT "servers_hourly_rate_positive_check" CHECK ("hourly_rate" > 0),
	CONSTRAINT "servers_currency_lowercase_check" CHECK ("currency" = lower("currency"))
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"rental_id" uuid NOT NULL UNIQUE,
	"stripe_payment_intent_id" varchar(255) UNIQUE,
	"stripe_refund_id" varchar(255) UNIQUE,
	"amount" integer NOT NULL,
	"currency" varchar(3) NOT NULL,
	"status" "payment_status" DEFAULT 'pending'::"payment_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_amount_positive_check" CHECK ("amount" > 0),
	CONSTRAINT "payments_currency_lowercase_check" CHECK ("currency" = lower("currency"))
);
--> statement-breakpoint
CREATE TABLE "server_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"server_id" uuid NOT NULL,
	"slot_number" integer NOT NULL,
	"label" varchar(100) NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "server_slots_server_number_unique" UNIQUE("server_id","slot_number"),
	CONSTRAINT "server_slots_number_positive_check" CHECK ("slot_number" > 0),
	CONSTRAINT "server_slots_label_not_empty_check" CHECK (length(trim("label")) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rentals_one_open_rental_per_slot_unique" ON "rentals" ("slot_id") WHERE "status" IN ('pending_payment', 'active');--> statement-breakpoint
CREATE INDEX "rentals_user_created_idx" ON "rentals" ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "rentals_status_end_time_idx" ON "rentals" ("status","ends_at");--> statement-breakpoint
CREATE INDEX "servers_is_active_idx" ON "servers" ("is_active");--> statement-breakpoint
CREATE INDEX "payments_status_created_idx" ON "payments" ("status","created_at");--> statement-breakpoint
CREATE INDEX "server_slots_server_id_idx" ON "server_slots" ("server_id");--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_server_id_servers_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_slot_id_server_slots_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "server_slots"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_rental_id_rentals_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "server_slots" ADD CONSTRAINT "server_slots_server_id_servers_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE;