import {
  FICTIONAL_PLACES,
  INTERGALACTIC_ADJECTIVES,
} from "../constants/rooms.constant.js";
import { customAlphabet, urlAlphabet } from "nanoid";

export async function generateRandomRoomId() {
  const fictionalPlacesLength = FICTIONAL_PLACES.length - 1;
  const intergalacticAdjectivesLength = INTERGALACTIC_ADJECTIVES.length - 1;

  const randomFictionalPlace =
    fictionalPlacesLength[Math.floor(Math.random() * fictionalPlacesLength)];
  const randomIntergalacticAdjective =
    intergalacticAdjectivesLength[
      Math.floor(Math.random() * intergalacticAdjectivesLength)
    ];
  const nanoid = customAlphabet(urlAlphabet, 7);

  return `${randomIntergalacticAdjective}-${randomFictionalPlace}-${nanoid()}`;
}
