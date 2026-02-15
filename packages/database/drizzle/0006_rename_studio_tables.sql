-- Rename admin_chats -> studio_projects
ALTER TABLE "admin_chats" RENAME TO "studio_projects";

-- Rename admin_messages -> studio_generations
ALTER TABLE "admin_messages" RENAME TO "studio_generations";

-- Rename column chat_id -> project_id
ALTER TABLE "studio_generations" RENAME COLUMN "chat_id" TO "project_id";

-- Rename indexes
ALTER INDEX "admin_chats_admin_id_idx" RENAME TO "studio_projects_admin_id_idx";
ALTER INDEX "admin_messages_chat_id_idx" RENAME TO "studio_generations_project_id_idx";
ALTER INDEX "admin_messages_bullmq_job_id_idx" RENAME TO "studio_generations_bullmq_job_id_idx";
ALTER INDEX "admin_messages_status_idx" RENAME TO "studio_generations_status_idx";

-- Rename constraints
ALTER TABLE "studio_projects" RENAME CONSTRAINT "admin_chats_admin_id_users_id_fk" TO "studio_projects_admin_id_users_id_fk";
ALTER TABLE "studio_generations" RENAME CONSTRAINT "admin_messages_chat_id_admin_chats_id_fk" TO "studio_generations_project_id_studio_projects_id_fk";
