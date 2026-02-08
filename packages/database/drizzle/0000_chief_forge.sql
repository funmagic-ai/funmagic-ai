CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"name" text,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"app_id" text,
	"api_key" text,
	"api_secret" text,
	"base_url" text,
	"webhook_secret" text,
	"config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"health_check_url" text,
	"last_health_check_at" timestamp,
	"is_healthy" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "admin_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"api_key" text,
	"api_secret" text,
	"base_url" text,
	"config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_providers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tool_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"translations" jsonb DEFAULT '{"en":{"displayName":"","description":""}}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tool_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"short_description" text,
	"thumbnail" text,
	"tool_type_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"translations" jsonb DEFAULT '{"en":{"title":"","description":"","shortDescription":""}}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "task_payloads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"input" jsonb,
	"output" jsonb,
	"provider_request" jsonb,
	"provider_response" jsonb,
	"provider_meta" jsonb,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "task_payloads_task_id_unique" UNIQUE("task_id")
);
--> statement-breakpoint
CREATE TABLE "task_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"step_id" text NOT NULL,
	"step_index" integer NOT NULL,
	"state" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"parent_task_id" uuid,
	"current_step_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"credits_cost" integer DEFAULT 0 NOT NULL,
	"bullmq_job_id" text,
	"queued_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "credit_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	"bonus_credits" integer DEFAULT 0,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"stripe_price_id" text,
	"stripe_product_id" text,
	"translations" jsonb DEFAULT '{"en":{"name":"","description":""}}'::jsonb NOT NULL,
	"is_popular" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"balance_after" integer NOT NULL,
	"description" text,
	"reference_type" text,
	"reference_id" uuid,
	"metadata" jsonb,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credit_transactions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"reserved_balance" integer DEFAULT 0,
	"lifetime_purchased" integer DEFAULT 0,
	"lifetime_used" integer DEFAULT 0,
	"lifetime_refunded" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "credits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"thumbnail" text NOT NULL,
	"link" text,
	"link_text" text DEFAULT 'Learn More' NOT NULL,
	"link_target" text DEFAULT '_self' NOT NULL,
	"type" text DEFAULT 'main' NOT NULL,
	"position" integer DEFAULT 0,
	"badge" text,
	"badge_color" text,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"bucket" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"module" text NOT NULL,
	"task_id" uuid,
	"post_id" uuid,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "admin_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"title" text,
	"openai_response_id" text,
	"google_session_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chat_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text,
	"quoted_image_ids" jsonb,
	"provider" text,
	"model" text,
	"images" jsonb,
	"input" jsonb,
	"status" text DEFAULT 'completed' NOT NULL,
	"progress" text,
	"error" text,
	"bullmq_job_id" text,
	"completed_at" timestamp,
	"raw_request" jsonb,
	"raw_response" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_tool_type_id_tool_types_id_fk" FOREIGN KEY ("tool_type_id") REFERENCES "public"."tool_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_payloads" ADD CONSTRAINT "task_payloads_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_steps" ADD CONSTRAINT "task_steps_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credits" ADD CONSTRAINT "credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_chats" ADD CONSTRAINT "admin_chats_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_messages" ADD CONSTRAINT "admin_messages_chat_id_admin_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."admin_chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_steps_task_id_idx" ON "task_steps" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_status_idx" ON "tasks" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "tasks_status_queued_at_idx" ON "tasks" USING btree ("status","queued_at");--> statement-breakpoint
CREATE INDEX "tasks_parent_task_id_idx" ON "tasks" USING btree ("parent_task_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_bucket_storage_key_idx" ON "assets" USING btree ("bucket","storage_key");--> statement-breakpoint
CREATE INDEX "admin_chats_admin_id_idx" ON "admin_chats" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_messages_chat_id_idx" ON "admin_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "admin_messages_bullmq_job_id_idx" ON "admin_messages" USING btree ("bullmq_job_id");--> statement-breakpoint
CREATE INDEX "admin_messages_status_idx" ON "admin_messages" USING btree ("status");