--
-- PostgreSQL database dump
--

-- Dumped from database version 14.5
-- Dumped by pg_dump version 16.3

-- Started on 2024-11-11 10:34:29

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

--
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- TOC entry 831 (class 1247 OID 54746)
-- Name: difficulty_level; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.difficulty_level AS ENUM (
    'Easy',
    'Medium',
    'Hard'
);


ALTER TYPE public.difficulty_level OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 54839)
-- Name: correct_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.correct_options (
    question_id integer NOT NULL,
    correct_option_id integer NOT NULL
);


ALTER TABLE public.correct_options OWNER TO postgres;

--
-- TOC entry 210 (class 1259 OID 54754)
-- Name: quiz_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_categories (
    category_id smallint NOT NULL,
    category_name character varying(100) NOT NULL
);


ALTER TABLE public.quiz_categories OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 54753)
-- Name: quiz_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_categories_category_id_seq
    AS smallint
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_categories_category_id_seq OWNER TO postgres;

--
-- TOC entry 3374 (class 0 OID 0)
-- Dependencies: 209
-- Name: quiz_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_categories_category_id_seq OWNED BY public.quiz_categories.category_id;


--
-- TOC entry 216 (class 1259 OID 54826)
-- Name: quiz_options; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_options (
    option_id integer NOT NULL,
    question_id integer NOT NULL,
    option_text character varying(255),
    image_url character varying(255),
    audio_url character varying(255)
);


ALTER TABLE public.quiz_options OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 54825)
-- Name: quiz_options_option_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_options_option_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_options_option_id_seq OWNER TO postgres;

--
-- TOC entry 3375 (class 0 OID 0)
-- Dependencies: 215
-- Name: quiz_options_option_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_options_option_id_seq OWNED BY public.quiz_options.option_id;


--
-- TOC entry 218 (class 1259 OID 54854)
-- Name: quiz_question_relationships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_question_relationships (
    quiz_id integer NOT NULL,
    question_id integer NOT NULL
);


ALTER TABLE public.quiz_question_relationships OWNER TO postgres;

--
-- TOC entry 214 (class 1259 OID 54810)
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_questions (
    question_id integer NOT NULL,
    question_text character varying(500) NOT NULL,
    category_id integer,
    image_url character varying(255),
    audio_url character varying(255),
    difficulty public.difficulty_level,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    success_rate numeric,
    visits integer
);


ALTER TABLE public.quiz_questions OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 54809)
-- Name: quiz_questions_question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_questions_question_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_questions_question_id_seq OWNER TO postgres;

--
-- TOC entry 3376 (class 0 OID 0)
-- Dependencies: 213
-- Name: quiz_questions_question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_questions_question_id_seq OWNED BY public.quiz_questions.question_id;


--
-- TOC entry 212 (class 1259 OID 54763)
-- Name: quizzes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quizzes (
    quiz_id integer NOT NULL,
    quiz_name character varying(100) NOT NULL,
    description character varying(500),
    calculated_difficulty public.difficulty_level,
    cover_image_url character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    contestants_count smallint DEFAULT 0,
    visits integer,
    success_rate numeric
);


ALTER TABLE public.quizzes OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 54762)
-- Name: quizzes_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quizzes_quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quizzes_quiz_id_seq OWNER TO postgres;

--
-- TOC entry 3377 (class 0 OID 0)
-- Dependencies: 211
-- Name: quizzes_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quizzes_quiz_id_seq OWNED BY public.quizzes.quiz_id;


--
-- TOC entry 3190 (class 2604 OID 54757)
-- Name: quiz_categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_categories ALTER COLUMN category_id SET DEFAULT nextval('public.quiz_categories_category_id_seq'::regclass);


--
-- TOC entry 3198 (class 2604 OID 54829)
-- Name: quiz_options option_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_options ALTER COLUMN option_id SET DEFAULT nextval('public.quiz_options_option_id_seq'::regclass);


--
-- TOC entry 3195 (class 2604 OID 54813)
-- Name: quiz_questions question_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN question_id SET DEFAULT nextval('public.quiz_questions_question_id_seq'::regclass);


--
-- TOC entry 3191 (class 2604 OID 54766)
-- Name: quizzes quiz_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes ALTER COLUMN quiz_id SET DEFAULT nextval('public.quizzes_quiz_id_seq'::regclass);


--
-- TOC entry 3366 (class 0 OID 54839)
-- Dependencies: 217
-- Data for Name: correct_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (7, 27);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (8, 29);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (9, 33);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (10, 117);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (11, 122);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (12, 127);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (13, 131);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (14, 133);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (15, 138);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (16, 142);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (17, 146);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (18, 149);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (19, 154);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (20, 158);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (21, 164);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (22, 167);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (23, 169);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (24, 174);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (25, 177);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (26, 182);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (27, 187);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (28, 190);
INSERT INTO public.correct_options (question_id, correct_option_id) VALUES (29, 194);


--
-- TOC entry 3359 (class 0 OID 54754)
-- Dependencies: 210
-- Data for Name: quiz_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.quiz_categories (category_id, category_name) VALUES (1, 'Anime and Manga');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (2, 'Art');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (3, 'Books');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (4, 'Fashion and Style');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (5, 'Food and Drink');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (6, 'Gaming');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (7, 'Geography');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (8, 'History');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (9, 'Internet Memes and Trends');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (10, 'Literature');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (11, 'Math');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (12, 'Movies and TV');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (13, 'Music');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (14, 'Pop Culture');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (15, 'Programming');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (16, 'Science');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (17, 'Sports');
INSERT INTO public.quiz_categories (category_id, category_name) VALUES (18, 'Other');


--
-- TOC entry 3365 (class 0 OID 54826)
-- Dependencies: 216
-- Data for Name: quiz_options; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (117, 10, 'O(log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (118, 10, 'O(n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (119, 10, 'O(n^2)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (120, 10, 'O(1)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (121, 11, 'Queue', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (122, 11, 'Stack', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (123, 11, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (124, 11, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (32, 8, 'JavaScript', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (33, 9, 'Relaxing', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (34, 9, 'Happy', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (35, 9, 'Sad', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (36, 9, 'Suspense', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (141, 16, 'Stack', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (142, 16, 'Queue', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (144, 16, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (145, 17, 'O(n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (146, 17, 'O(1)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (147, 17, 'O(log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (148, 17, 'O(n log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (149, 18, 'AVL Tree', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (150, 18, 'Binary Tree', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (151, 18, 'Heap', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (152, 18, 'Trie', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (153, 19, 'Queue', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (154, 19, 'Stack', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (155, 19, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (156, 19, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (157, 20, 'Merge Sort', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (161, 21, 'O(n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (170, 23, 'Queue', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (177, 25, 'O(n^2)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (183, 26, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (184, 26, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (185, 27, 'Queue', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (186, 27, 'Stack', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (187, 27, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (188, 27, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (189, 28, 'O(n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (190, 28, 'O(log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (191, 28, 'O(n log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (192, 28, 'O(n + m)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (193, 29, 'Queue', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (194, 29, 'Stack', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (195, 29, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (196, 29, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (134, 14, 'Kruskal''s Algorithm', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (168, 22, 'Insertion Sort', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (28, 7, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (167, 22, 'Quick Sort', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (163, 21, 'O(n log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (128, 12, '64', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (133, 14, 'Dijkstra''s Algorithm', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (138, 15, 'O(n log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (178, 25, 'O(n log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (29, 8, 'Java', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (176, 24, 'O(sqrt(n))', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (127, 12, '63', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (129, 13, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (143, 16, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (175, 24, 'O(n log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (182, 26, 'Queue', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (140, 15, 'O(log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (171, 23, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (165, 22, 'Merge Sort', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (25, 7, 'Stack', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (159, 20, 'Quick Sort', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (135, 14, 'Prim''s Algorithm', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (174, 24, 'O(log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (180, 25, 'O(log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (179, 25, 'O(n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (158, 20, 'Radix Sort', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (160, 20, 'Heap Sort', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (166, 22, 'Bubble Sort', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (136, 14, 'Floyd-Warshall Algorithm', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (137, 15, 'O(n^2)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (181, 26, 'Stack', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (173, 24, 'O(n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (131, 13, 'Heap', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (172, 23, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (164, 21, 'O(n + m)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (27, 7, 'Array', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (169, 23, 'Stack', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (126, 12, '32', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (31, 8, 'Python', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (132, 13, 'Tree', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (139, 15, 'O(n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (30, 8, 'C++', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (162, 21, 'O(log n)', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (125, 12, '31', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (130, 13, 'Linked List', NULL, NULL);
INSERT INTO public.quiz_options (option_id, question_id, option_text, image_url, audio_url) VALUES (26, 7, 'Queue', NULL, NULL);


--
-- TOC entry 3367 (class 0 OID 54854)
-- Dependencies: 218
-- Data for Name: quiz_question_relationships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (1, 7);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (1, 8);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (1, 9);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 10);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 11);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 12);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 13);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 14);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 15);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 16);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 17);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 18);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 19);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 20);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 21);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 22);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 23);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 24);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 25);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 26);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 27);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 28);
INSERT INTO public.quiz_question_relationships (quiz_id, question_id) VALUES (2, 29);


--
-- TOC entry 3363 (class 0 OID 54810)
-- Dependencies: 214
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (7, 'Which is one below?', 11, NULL, NULL, 'Easy', '2024-06-30 11:57:47.955443', '2024-06-30 11:57:47.955443', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (8, 'Which programming language icon is this?', 15, 'https://picsum.photos/640/360', NULL, 'Hard', '2024-06-30 11:57:47.955443', '2024-06-30 11:57:47.955443', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (9, 'From which song this tune is from?', 13, NULL, 'https://quiz-peers-storage.s3.amazonaws.com/quiz-questions-audio/relaxing-145038.mp3', 'Medium', '2024-06-30 11:57:47.955443', '2024-06-30 11:57:47.955443', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (10, 'What is the time complexity of binary search?', 15, NULL, NULL, 'Easy', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (11, 'Which data structure uses LIFO?', 15, NULL, NULL, 'Easy', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (12, 'What is the maximum number of nodes in a binary tree of height 5?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (13, 'What is the best data structure for implementing a priority queue?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (14, 'Which algorithm is used for finding the shortest path in a graph?', 15, NULL, NULL, 'Hard', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (15, 'What is the best-case time complexity of quicksort?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (16, 'Which data structure is used in BFS?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (17, 'What is the time complexity of inserting an element into a hash table?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (18, 'Which of the following is a balanced binary tree?', 15, NULL, NULL, 'Hard', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (19, 'What data structure is used to perform recursion?', 15, NULL, NULL, 'Easy', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (20, 'Which algorithm is used for sorting in linear time?', 15, NULL, NULL, 'Hard', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (21, 'What is the space complexity of a DFS algorithm?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (22, 'Which of the following is not a stable sorting algorithm?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (23, 'Which data structure is used for depth-first search?', 15, NULL, NULL, 'Easy', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (24, 'What is the height of a complete binary tree with n nodes?', 15, NULL, NULL, 'Hard', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (25, 'What is the worst-case time complexity of bubble sort?', 15, NULL, NULL, 'Easy', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (26, 'Which data structure is used in the implementation of BFS?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (27, 'Which data structure is ideal for implementing a circular buffer?', 15, NULL, NULL, 'Medium', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (28, 'What is the time complexity of searching an element in a balanced BST?', 15, NULL, NULL, 'Hard', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);
INSERT INTO public.quiz_questions (question_id, question_text, category_id, image_url, audio_url, difficulty, created_at, updated_at, success_rate, visits) VALUES (29, 'Which data structure is used in the implementation of a stack?', 15, NULL, NULL, 'Easy', '2024-07-13 19:59:29.415775', '2024-07-13 19:59:29.415775', NULL, NULL);


--
-- TOC entry 3361 (class 0 OID 54763)
-- Dependencies: 212
-- Data for Name: quizzes; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.quizzes (quiz_id, quiz_name, description, calculated_difficulty, cover_image_url, created_at, updated_at, contestants_count, visits, success_rate) VALUES (1, 'First sample quiz', 'This is first quiz created for testing purpose', NULL, 'https://picsum.photos/640/360', '2024-06-30 01:50:43.434649', '2024-06-30 01:50:43.434649', 12, NULL, 90);
INSERT INTO public.quizzes (quiz_id, quiz_name, description, calculated_difficulty, cover_image_url, created_at, updated_at, contestants_count, visits, success_rate) VALUES (2, 'Data Structures and Algorithms fun way', 'A fun and educational quiz to test your knowledge on data structures and algorithms.', 'Medium', 'https://picsum.photos/640/360', '2024-07-13 20:42:07.650562', '2024-07-13 20:42:07.650562', 34, NULL, 80);


--
-- TOC entry 3378 (class 0 OID 0)
-- Dependencies: 209
-- Name: quiz_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_categories_category_id_seq', 18, true);


--
-- TOC entry 3379 (class 0 OID 0)
-- Dependencies: 215
-- Name: quiz_options_option_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_options_option_id_seq', 196, true);


--
-- TOC entry 3380 (class 0 OID 0)
-- Dependencies: 213
-- Name: quiz_questions_question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_questions_question_id_seq', 29, true);


--
-- TOC entry 3381 (class 0 OID 0)
-- Dependencies: 211
-- Name: quizzes_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quizzes_quiz_id_seq', 2, true);


--
-- TOC entry 3210 (class 2606 OID 54843)
-- Name: correct_options correct_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.correct_options
    ADD CONSTRAINT correct_options_pkey PRIMARY KEY (question_id);


--
-- TOC entry 3200 (class 2606 OID 54761)
-- Name: quiz_categories quiz_categories_category_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_categories
    ADD CONSTRAINT quiz_categories_category_name_key UNIQUE (category_name);


--
-- TOC entry 3202 (class 2606 OID 54759)
-- Name: quiz_categories quiz_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_categories
    ADD CONSTRAINT quiz_categories_pkey PRIMARY KEY (category_id);


--
-- TOC entry 3208 (class 2606 OID 54833)
-- Name: quiz_options quiz_options_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_pkey PRIMARY KEY (option_id);


--
-- TOC entry 3212 (class 2606 OID 54858)
-- Name: quiz_question_relationships quiz_question_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_question_relationships
    ADD CONSTRAINT quiz_question_relationships_pkey PRIMARY KEY (quiz_id, question_id);


--
-- TOC entry 3206 (class 2606 OID 54819)
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (question_id);


--
-- TOC entry 3204 (class 2606 OID 54772)
-- Name: quizzes quizzes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quizzes
    ADD CONSTRAINT quizzes_pkey PRIMARY KEY (quiz_id);


--
-- TOC entry 3215 (class 2606 OID 54849)
-- Name: correct_options correct_options_correct_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.correct_options
    ADD CONSTRAINT correct_options_correct_option_id_fkey FOREIGN KEY (correct_option_id) REFERENCES public.quiz_options(option_id);


--
-- TOC entry 3216 (class 2606 OID 54844)
-- Name: correct_options correct_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.correct_options
    ADD CONSTRAINT correct_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 3214 (class 2606 OID 54834)
-- Name: quiz_options quiz_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 3217 (class 2606 OID 54864)
-- Name: quiz_question_relationships quiz_question_relationships_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_question_relationships
    ADD CONSTRAINT quiz_question_relationships_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(question_id) ON DELETE CASCADE;


--
-- TOC entry 3218 (class 2606 OID 54859)
-- Name: quiz_question_relationships quiz_question_relationships_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_question_relationships
    ADD CONSTRAINT quiz_question_relationships_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(quiz_id) ON DELETE CASCADE;


--
-- TOC entry 3213 (class 2606 OID 54820)
-- Name: quiz_questions quiz_questions_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.quiz_categories(category_id) ON DELETE SET NULL;


--
-- TOC entry 3373 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


-- Completed on 2024-11-11 10:34:29

--
-- PostgreSQL database dump complete
--

