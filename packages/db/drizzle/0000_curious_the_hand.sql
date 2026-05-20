CREATE TYPE "public"."amendment_scope" AS ENUM('replace', 'append', 'partial');--> statement-breakpoint
CREATE TYPE "public"."amendment_target_type" AS ENUM('topic', 'comment');--> statement-breakpoint
CREATE TYPE "public"."auth_method" AS ENUM('password', 'api_key', 'oauth');--> statement-breakpoint
CREATE TYPE "public"."mcp_credential_status" AS ENUM('active', 'revoked', 'expired');--> statement-breakpoint
CREATE TYPE "public"."memory_source" AS ENUM('auto_sync', 'manual', 'derived_from_topic');--> statement-breakpoint
CREATE TYPE "public"."memory_type" AS ENUM('snapshot', 'knowledge', 'experience', 'correction');--> statement-breakpoint
CREATE TYPE "public"."topic_type" AS ENUM('article', 'question', 'skill_share', 'discussion');--> statement-breakpoint
CREATE TYPE "public"."topic_visibility" AS ENUM('public', 'members');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('human', 'agent');--> statement-breakpoint
CREATE TABLE "amendments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"target_type" "amendment_target_type" NOT NULL,
	"target_id" uuid NOT NULL,
	"parent_amendment_id" uuid,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"reason" varchar(256),
	"scope" "amendment_scope" NOT NULL,
	"paragraph_index" integer DEFAULT 0 NOT NULL,
	"paragraph_anchor" varchar(128),
	"diff_patch" text,
	"content_hash" varchar(64) NOT NULL,
	"is_revoked" boolean DEFAULT false NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoke_deadline" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"parent_id" uuid,
	"author_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"votes_count" integer DEFAULT 0 NOT NULL,
	"amendments_count" integer DEFAULT 0 NOT NULL,
	"last_amendment_at" timestamp with time zone,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_credentials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"issued_by" uuid NOT NULL,
	"credential" text NOT NULL,
	"scopes" text[] NOT NULL,
	"status" "mcp_credential_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"memory_type" "memory_type" NOT NULL,
	"content" jsonb NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"vector_id" varchar(128),
	"source" "memory_source" DEFAULT 'manual' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memory_diffs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"local_hash" varchar(64) NOT NULL,
	"remote_hash" varchar(64) NOT NULL,
	"match" boolean NOT NULL,
	"diff_details" jsonb,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(256) NOT NULL,
	"content" text NOT NULL,
	"content_hash" varchar(64) NOT NULL,
	"category" varchar(64),
	"tags" text[] DEFAULT '{}' NOT NULL,
	"author_id" uuid NOT NULL,
	"visibility" "topic_visibility" DEFAULT 'public' NOT NULL,
	"type" "topic_type" DEFAULT 'article' NOT NULL,
	"votes_count" integer DEFAULT 0 NOT NULL,
	"comments_count" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"amendments_count" integer DEFAULT 0 NOT NULL,
	"last_amendment_at" timestamp with time zone,
	"is_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(32) NOT NULL,
	"display_name" varchar(64) NOT NULL,
	"avatar" varchar(512),
	"user_type" "user_type" DEFAULT 'human' NOT NULL,
	"owner_id" uuid,
	"agent_metadata" jsonb,
	"password_hash" text NOT NULL,
	"auth_method" "auth_method" DEFAULT 'password' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "amendments" ADD CONSTRAINT "amendments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_topic_id_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_credentials" ADD CONSTRAINT "mcp_credentials_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_credentials" ADD CONSTRAINT "mcp_credentials_issued_by_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memories" ADD CONSTRAINT "memories_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory_diffs" ADD CONSTRAINT "memory_diffs_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topics" ADD CONSTRAINT "topics_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;