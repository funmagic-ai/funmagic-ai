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
ALTER TABLE "task_payloads" ADD CONSTRAINT "task_payloads_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_steps" ADD CONSTRAINT "task_steps_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "task_steps_task_id_idx" ON "task_steps" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "tasks_user_id_status_idx" ON "tasks" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "tasks_status_queued_at_idx" ON "tasks" USING btree ("status","queued_at");--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "parent_task_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "step_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "step_index";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "input";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "output";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "error";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "provider_request";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "provider_response";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "provider_meta";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "attempt_count";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "max_attempts";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "current_step_id";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "current_step_index";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "awaiting_confirmation";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "step_states";