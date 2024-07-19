import {
  FICTIONAL_PLACES,
  INTERGALACTIC_ADJECTIVES,
} from "../constants/rooms.constant.js";
import { customAlphabet, urlAlphabet } from "nanoid";

export function generateRandomRoomId() {
  const fictionalPlacesLength = FICTIONAL_PLACES.length;
  const intergalacticAdjectivesLength = INTERGALACTIC_ADJECTIVES.length;

  const randomFictionalPlace =
    FICTIONAL_PLACES[Math.floor(Math.random() * fictionalPlacesLength)];
  const randomIntergalacticAdjective =
    INTERGALACTIC_ADJECTIVES[
      Math.floor(Math.random() * intergalacticAdjectivesLength)
    ];
  const nanoid = customAlphabet(urlAlphabet, 7);
  return `${randomIntergalacticAdjective}-${randomFictionalPlace}-${nanoid()}`;
}
