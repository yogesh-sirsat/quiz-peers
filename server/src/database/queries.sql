INSERT INTO
    quiz_questions (
        question_text,
        category_id,
        difficulty,
        image_url,
        audio_url
    )
VALUES
    ('Which is one below?', 11, 'Easy'),
    (
        'Which programming language icon is this?',
        15,
        'Hard',
        'https://picsum.photos/640/360'
    ),
    (
        'From which song this tune is from?',
        13,
        'Medium',
,
        'https://quiz-peers-storage.s3.amazonaws.com/quiz-questions-audio/relaxing-145038.mp3'
    );

INSERT INTO
    quiz_options (question_id, option_text, image_url, audio_url)
values
    (1, '3'),
    (1, '4'),
    (1, '1'),
    (1, '5'),
    (2, 'Python'),
    (2, 'Java'),
    (2, 'C++'),
    (2, 'JavaScript'),
    (3, 'Relaxing'),
    (3, 'Happy'),
    (3, 'Sad'),
    (3, 'Suspense');

INSERT INTO
    correct_options (question_id, correct_option_id)
VALUES
    (1, 3),
    (2, 1),
    (3, 1);

INSERT INTO
    quiz_question_relationships (quiz_id, question_id)
VALUES
    (1, 1),
    (1, 2),
    (1, 3);

SELECT
    qz.quiz_id,
    qz.quiz_name,
    qz.cover_image_url,
    qz.created_at,
    qz.contestants_count,
    qz.success_rate,
    Count(qq.question_id) questions_count,
    array_agg (DISTINCT qc.category_name) categories 
FROM
    quizzes qz
    LEFT JOIN quiz_question_relationships qqr ON qz.quiz_id = qqr.quiz_id
    LEFT JOIN quiz_questions qq ON qqr.question_id = qq.question_id
    JOIN quiz_categories qc ON qq.category_id = qc.category_id
GROUP BY
    qz.quiz_id


INSERT INTO quiz_options (question_id, option_text)
VALUES(5, 'Dijkstra\'s Algorithm ESCAPE '\')
