


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;




ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."difficulty_level" AS ENUM (
    'Easy',
    'Medium',
    'Hard'
);


ALTER TYPE "public"."difficulty_level" OWNER TO "postgres";


CREATE TYPE "public"."question_type" AS ENUM (
    'TRIVIA',
    'SIMILARITY',
    'MAJORITY'
);


ALTER TYPE "public"."question_type" OWNER TO "postgres";


CREATE TYPE "public"."status" AS ENUM (
    'draft',
    'published',
    'testing'
);


ALTER TYPE "public"."status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."correct_options" (
    "question_id" integer NOT NULL,
    "correct_option_id" integer NOT NULL
);


ALTER TABLE "public"."correct_options" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_categories" (
    "category_id" smallint NOT NULL,
    "category_name" character varying(100) NOT NULL
);


ALTER TABLE "public"."quiz_categories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quiz_categories_category_id_seq"
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."quiz_categories_category_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quiz_categories_category_id_seq" OWNED BY "public"."quiz_categories"."category_id";



CREATE TABLE IF NOT EXISTS "public"."quiz_options" (
    "option_id" integer NOT NULL,
    "question_id" integer NOT NULL,
    "option_text" character varying(255),
    "image_url" character varying(255),
    "audio_url" character varying(255)
);


ALTER TABLE "public"."quiz_options" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quiz_options_option_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."quiz_options_option_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quiz_options_option_id_seq" OWNED BY "public"."quiz_options"."option_id";



CREATE TABLE IF NOT EXISTS "public"."quiz_question_relationships" (
    "quiz_id" integer NOT NULL,
    "question_id" integer NOT NULL
);


ALTER TABLE "public"."quiz_question_relationships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quiz_questions" (
    "question_id" integer NOT NULL,
    "question_text" character varying(500) NOT NULL,
    "category_id" integer,
    "image_url" character varying(255),
    "audio_url" character varying(255),
    "difficulty" "public"."difficulty_level",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "success_rate" numeric,
    "visits" integer,
    "qtype" "public"."question_type" DEFAULT 'TRIVIA'::"public"."question_type" NOT NULL
);


ALTER TABLE "public"."quiz_questions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quiz_questions_question_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."quiz_questions_question_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quiz_questions_question_id_seq" OWNED BY "public"."quiz_questions"."question_id";



CREATE TABLE IF NOT EXISTS "public"."quizzes" (
    "quiz_id" integer NOT NULL,
    "quiz_name" character varying(100) NOT NULL,
    "description" character varying(500),
    "calculated_difficulty" "public"."difficulty_level",
    "cover_image_url" character varying(255),
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "contestants_count" smallint DEFAULT 0,
    "visits" integer,
    "success_rate" numeric,
    "status" "public"."status" DEFAULT 'testing'::"public"."status"
);


ALTER TABLE "public"."quizzes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."quizzes_quiz_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."quizzes_quiz_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."quizzes_quiz_id_seq" OWNED BY "public"."quizzes"."quiz_id";



ALTER TABLE ONLY "public"."quiz_categories" ALTER COLUMN "category_id" SET DEFAULT "nextval"('"public"."quiz_categories_category_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quiz_options" ALTER COLUMN "option_id" SET DEFAULT "nextval"('"public"."quiz_options_option_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quiz_questions" ALTER COLUMN "question_id" SET DEFAULT "nextval"('"public"."quiz_questions_question_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."quizzes" ALTER COLUMN "quiz_id" SET DEFAULT "nextval"('"public"."quizzes_quiz_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."correct_options"
    ADD CONSTRAINT "correct_options_pkey" PRIMARY KEY ("question_id");



ALTER TABLE ONLY "public"."quiz_categories"
    ADD CONSTRAINT "quiz_categories_category_name_key" UNIQUE ("category_name");



ALTER TABLE ONLY "public"."quiz_categories"
    ADD CONSTRAINT "quiz_categories_pkey" PRIMARY KEY ("category_id");



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "quiz_options_pkey" PRIMARY KEY ("option_id");



ALTER TABLE ONLY "public"."quiz_question_relationships"
    ADD CONSTRAINT "quiz_question_relationships_pkey" PRIMARY KEY ("quiz_id", "question_id");



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("question_id");



ALTER TABLE ONLY "public"."quizzes"
    ADD CONSTRAINT "quizzes_pkey" PRIMARY KEY ("quiz_id");



ALTER TABLE ONLY "public"."correct_options"
    ADD CONSTRAINT "correct_options_correct_option_id_fkey" FOREIGN KEY ("correct_option_id") REFERENCES "public"."quiz_options"("option_id");



ALTER TABLE ONLY "public"."correct_options"
    ADD CONSTRAINT "correct_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("question_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_options"
    ADD CONSTRAINT "quiz_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("question_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_question_relationships"
    ADD CONSTRAINT "quiz_question_relationships_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("question_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_question_relationships"
    ADD CONSTRAINT "quiz_question_relationships_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("quiz_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quiz_questions"
    ADD CONSTRAINT "quiz_questions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."quiz_categories"("category_id") ON DELETE SET NULL;



ALTER TABLE "public"."correct_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_options" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_question_relationships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quiz_questions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."quizzes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT ALL ON SCHEMA "public" TO PUBLIC;





GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";




GRANT ALL ON TABLE "public"."correct_options" TO "anon";
GRANT ALL ON TABLE "public"."correct_options" TO "authenticated";
GRANT ALL ON TABLE "public"."correct_options" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_categories" TO "anon";
GRANT ALL ON TABLE "public"."quiz_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quiz_categories_category_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_categories_category_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_categories_category_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_options" TO "anon";
GRANT ALL ON TABLE "public"."quiz_options" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_options" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quiz_options_option_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_options_option_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_options_option_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_question_relationships" TO "anon";
GRANT ALL ON TABLE "public"."quiz_question_relationships" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_question_relationships" TO "service_role";



GRANT ALL ON TABLE "public"."quiz_questions" TO "anon";
GRANT ALL ON TABLE "public"."quiz_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."quiz_questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quiz_questions_question_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quiz_questions_question_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quiz_questions_question_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."quizzes" TO "anon";
GRANT ALL ON TABLE "public"."quizzes" TO "authenticated";
GRANT ALL ON TABLE "public"."quizzes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."quizzes_quiz_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."quizzes_quiz_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."quizzes_quiz_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


drop extension if exists "pg_net";


