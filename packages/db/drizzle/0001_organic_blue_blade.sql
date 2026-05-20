CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."vote_type" AS ENUM('up', 'down');--> statement-breakpoint
CREATE TABLE "embedding_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_base_url" varchar(512) DEFAULT 'https://api.openai.com/v1' NOT NULL,
	"api_key" text NOT NULL,
	"model_name" varchar(128) DEFAULT 'text-embedding-3-small' NOT NULL,
	"embedding_dimensions" integer DEFAULT 1536 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"timeout" integer DEFAULT 30 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topic_votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_type" "vote_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "amendments" DROP CONSTRAINT "amendments_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "mcp_credentials" DROP CONSTRAINT "mcp_credentials_issued_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "topics" DROP CONSTRAINT "topics_author_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "amendments" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "mcp_credentials" ALTER COLUMN "issued_by" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "topics" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "memory_diffs" ADD COLUMN "memory_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "topic_votes" ADD CONSTRAINT "topic_votes_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topic_votes" ADD CONSTRAINT "topic_votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "topic_votes_user_topic_unique" ON "topic_votes" USING btree ("topic_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_topic_votes_created_at" ON "topic_votes" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_parent_amendment_id_amendments_id_fk" FOREIGN KEY ("parent_amendment_id") REFERENCES "public"."amendments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_credentials" ADD CONSTRAINT "mcp_credentials_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_diffs" ADD CONSTRAINT "memory_diffs_memory_id_memories_id_fk" FOREIGN KEY ("memory_id") REFERENCES "public"."memories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_amendments_target" ON "amendments" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "idx_amendments_author_id" ON "amendments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_amendments_target_revoked" ON "amendments" USING btree ("target_id","target_type","is_revoked");--> statement-breakpoint
CREATE INDEX "idx_comments_topic_id" ON "comments" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "idx_comments_author_id" ON "comments" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_comments_parent_id" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_mcp_creds_agent_id" ON "mcp_credentials" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_mcp_creds_credential" ON "mcp_credentials" USING btree ("credential");--> statement-breakpoint
CREATE INDEX "idx_mcp_creds_status_agent" ON "mcp_credentials" USING btree ("status","agent_id");--> statement-breakpoint
CREATE INDEX "idx_memories_agent_id" ON "memories" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_memories_agent_created" ON "memories" USING btree ("agent_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_memories_agent_type" ON "memories" USING btree ("agent_id","memory_type");--> statement-breakpoint
CREATE INDEX "idx_memory_diffs_agent_id" ON "memory_diffs" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "idx_memory_diffs_agent_memory" ON "memory_diffs" USING btree ("agent_id","memory_id");--> statement-breakpoint
CREATE INDEX "idx_topics_author_id" ON "topics" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_topics_created_at" ON "topics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_topics_category" ON "topics" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_topics_type" ON "topics" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_topics_votes_count" ON "topics" USING btree ("votes_count");--> statement-breakpoint
CREATE INDEX "idx_topics_tags_gin" ON "topics" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "idx_users_owner_id" ON "users" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "idx_users_user_type" ON "users" USING btree ("user_type");