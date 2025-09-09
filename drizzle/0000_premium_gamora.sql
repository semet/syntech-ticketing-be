CREATE TABLE "assignees" (
	"id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "assignees_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
    id text PRIMARY KEY,
    title text NOT NULL,
    description text NOT NULL,
    link text NOT NULL,
    status integer DEFAULT 1 NOT NULL,
    whitelabel_id text NOT NULL,
    category_id text,
    reporter_id text NOT NULL,
    assignee_id text,
    priority integer DEFAULT 3 NOT NULL,
    created_at timestamp DEFAULT now() NOT NULL,
    updated_at timestamp DEFAULT now() NOT NULL,
    finished_at timestamp
);

-- Create sequence for numeric IDs
CREATE SEQUENCE issues_seq;

-- Trigger function to populate id
CREATE OR REPLACE FUNCTION issues_id_trigger()
RETURNS trigger AS $$
BEGIN
    IF NEW.id IS NULL THEN
        NEW.id := 'TS' || nextval('issues_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
CREATE TRIGGER issues_before_insert
BEFORE INSERT ON issues
FOR EACH ROW
EXECUTE FUNCTION issues_id_trigger();
--> statement-breakpoint
CREATE TABLE "reporters" (
	"id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reporters_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "white_labels" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"whitelabel_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
