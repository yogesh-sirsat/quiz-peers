CREATE DATABASE quiz_peers
WITH
    OWNER = postgres ENCODING = 'UTF8' CONNECTION
LIMIT
    = -1 IS_TEMPLATE = False;

CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'testing');
CREATE TYPE question_type AS ENUM ("TRIVIA", "SIMILARITY", "MAJORITY");

CREATE TABLE
    quiz_categories (
        category_id SMALLSERIAL PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL UNIQUE
    );

INSERT INTO
    quiz_categories (category_name)
VALUES
    ('Anime and Manga'),
    ('Art'),
    ('Books'),
    ('Fashion and Style'),
    ('Food and Drink'),
    ('Gaming'),
    ('Geography'),
    ('History'),
    ('Internet Memes and Trends'),
    ('Literature'),
    ('Math'),
    ('Movies and TV'),
    ('Music'),
    ('Pop Culture'),
    ('Programming'),
    ('Science'),
    ('Sports'),
    ('Other') ON CONFLICT (category_name) DO NOTHING;

CREATE TABLE
    quizzes (
        quiz_id SERIAL PRIMARY KEY,
        quiz_name VARCHAR(100) NOT NULL,
        description VARCHAR(500),
        calculated_difficulty difficulty_level,
        cover_image_url VARCHAR(255),
        status quiz_status DEFAULT 'published',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE
    quiz_questions (
        question_id SERIAL PRIMARY KEY,
        question_text VARCHAR(500) NOT NULL,
        category_id INT,
        image_url VARCHAR(255),
        audio_url VARCHAR(255),
        difficulty difficulty_level,
        qtype question_type DEFAULT 'TRIVIA',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES quiz_categories (category_id) ON DELETE SET NULL,
    );

CREATE TABLE
    quiz_options (
        option_id SERIAL PRIMARY KEY,
        question_id INT NOT NULL,
        option_text VARCHAR(255),
        image_url VARCHAR(255),
        audio_url VARCHAR(255),
        FOREIGN KEY (question_id) REFERENCES quiz_questions (question_id) ON DELETE CASCADE
    );

-- Additional table to manage correct options per question
CREATE TABLE
    correct_options (
        question_id INT PRIMARY KEY,
        correct_option_id INT NOT NULL,
        FOREIGN KEY (question_id) REFERENCES quiz_questions (question_id) ON DELETE CASCADE,
        FOREIGN KEY (correct_option_id) REFERENCES quiz_options (option_id)
    );

CREATE TABLE
    quiz_question_relationships (
        quiz_id INT NOT NULL,
        question_id INT NOT NULL,
        PRIMARY KEY (quiz_id, question_id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes (quiz_id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES quiz_questions (question_id) ON DELETE CASCADE
    );