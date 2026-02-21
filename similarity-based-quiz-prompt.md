You are working on an existing multiplayer quiz application.

The system already supports:


**New!Click to edit**

* Quiz → Question → Option structure
* Game sessions with players
* PlayerAnswer persistence
* Trivia quiz gameplay flow
* Leaderboard and result computation for trivia
* Admin panel to create quizzes and questions
* Real-time multiplayer flow
* Question has a `type` field (TRIVIA, SIMILARITY, MAJORITY)
* Correct answers exist only for TRIVIA questions (via CorrectAnswer table)

We are now implementing **Similarity Quiz Mode** without breaking existing trivia functionality.

This is an extension feature, not a rewrite.

---

## GOAL

Implement a new quiz mode called **Similarity Quiz** with the following behavior:

* Questions are of type SIMILARITY
* No correct answers exist
* Questions are not grouped under a quiz entity
* Questions are randomly generated from database based on type
* Gameplay flow remains same as trivia (round progression, timers, answer submission)
* Leaderboard is NOT shown
* Player panel remains available (mute, actions, etc.)
* End result screen focuses on similarity insights

---

## BACKEND REQUIREMENTS

1. Question Management

* SIMILARITY questions exist independently (not attached to quizId)
* Admin must be able to create SIMILARITY questions
* Validation: SIMILARITY questions must NOT require correct answer
* Existing trivia validation must remain unchanged

2. Random Question Generator API

Create API:

GET /similarity-questions?count=10

Behavior:

* Fetch random questions where type = SIMILARITY
* Include options
* Respect count param (max 20)
* Default count = 10

3. Game Session Mode

Extend GameSession to support mode:

TRIVIA
SIMILARITY

Behavior:

* When SIMILARITY mode is selected, questions come from generator API
* No leaderboard computation during gameplay
* Answers still stored normally in PlayerAnswer

4. Similarity Computation Service

At session end:

Compute pairwise similarity:

For each pair of players:

* similarityCount = number of questions where both selected same option

Store in memory or response object (no DB persistence required for now)

Also compute:

* soulmate → highest similarity pair
* lone wolf → player with lowest avg similarity
* most popular picker → player who chose most majority options
* chaos picker → player with most unique answers

Additionally compute per-player similarity ranking (for private view).

---

## FRONTEND REQUIREMENTS

1. Quiz Creation Flow

Add quiz card:

Create Similarity Quiz

Config:

* Question count selector (max 20)
* No category selection for now (future extensible)
* Mode = SIMILARITY

2. Gameplay Screen

Reuse existing quiz UI:

* Question display
* Option selection
* Timer
* Player panel

Replace:

* Leaderboard component with just players list

3. Results Screen (Progressive Reveal)

Structure:

Screen 1 → Most matched pairs, by similarity

Screen 2 → Public stats:

Lone wolf → player who matched least

Soulmate → highest pair match

Most popular option picker

Chaos picker → most unique answers

Screen 3+ → Question-wise reveal


Question reveal UI:

* Show question text
* Show options
* Under each option show players who selected it
* Use compact avatar/dot representation
* Clicking option opens player details modal show all players who selected that option
* Ensure scalability to 20 players
* One question per screen (pagination)

5. Private Player Insight (Only visible to current player)

Final screen:

"You matched most with"

List:

* players sorted by similarity count

Must be local-only view.

---

## UX CONSTRAINTS

* Maintain existing visual style
* Keep UI minimal and readable
* Avoid large scrolling lists
* Prefer progressive reveal and pagination
* Maintain real-time responsiveness except result browsing
* Do not degrade trivia mode

---

## ARCHITECTURAL CONSTRAINTS

* No schema changes required 
* Do not introduce breaking changes
* Keep logic modular
* Similarity evaluation must be mode-driven
* Trivia evaluation must remain untouched

---

## DELIVERABLES

Implement:

* Backend APIs
* Similarity computation service
* Admin SIMILARITY question support where admin should able to add just questions with options without any parent quiz like for trivia  add check that trivia question must have correct answer and similarity question must not have correct answer
* also add script for adding similarity questions in bulk via JSON
* Session mode extension
* Frontend creation flow
* Results visualization UI
* Player-specific insight panel

Ensure clean separation of evaluation strategies between TRIVIA and SIMILARITY modes.
