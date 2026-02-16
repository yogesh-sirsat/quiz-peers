// Note: In a real-world scenario, you might want to duplicate these constants 
// or have a shared package to avoid relative imports from server to client,
// but for this project structure, we will just duplicate the minimal logic here 
// or fetch them. Since we can't easily import from server in Vite client without 
// configuration, I will duplicate the lists for client-side generation.

const FICTIONAL_CHARACTERS = [
  "wario", "donkey kong", "link", "samus", "yoshi", "kirby", "fox", "ness", "pikachu", "luigi",
  "captain falcon", "jigglypuff", "peach", "bowser", "mario", "zelda", "Sherlock Holmes", "Dr Watson",
  "James Bond", "Darth Vader", "Luke Skywalker", "Princess Leia", "Han Solo", "Chewbacca", "Yoda",
  "Superman", "Batman", "Wonder Woman", "Spider Man", "Iron Man", "Captain America", "Thor", "Hulk",
  "Harry Potter", "Hermione Granger", "Ron Weasley", "Jon Snow", "Daenerys Targaryen"
];

const ANIMAL_NAMES = [
  "Lion", "Tiger", "Elephant", "Giraffe", "Zebra", "Monkey", "Gorilla", "Bear", "Wolf", "Fox",
  "Dog", "Cat", "Eagle", "Hawk", "Owl", "Parrot", "Dolphin", "Whale", "Shark", "Penguin"
];

const ADJECTIVES = [
  "Brave", "Strong", "Wise", "Clever", "Loyal", "Honest", "Kind", "Gentle", "Fierce", "Proud",
  "Curious", "Adventurous", "Creative", "Determined", "Energetic", "Friendly", "Funny", "Generous",
  "Happy", "Jolly", "Lucky", "Mighty", "Noble", "Polite", "Quick", "Smart", "Super", "Wild"
];

const COLORS = [
  "Red", "Orange", "Yellow", "Green", "Blue", "Purple", "Pink", "Black", "White", "Gold", "Silver"
];

const PREFIXES = [...ADJECTIVES, ...COLORS];
const POSTFIXES = [...FICTIONAL_CHARACTERS, ...ANIMAL_NAMES];

export function generateClientSidePlayerName() {
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const postfix = POSTFIXES[Math.floor(Math.random() * POSTFIXES.length)];
  return `${prefix} ${postfix}`;
}
