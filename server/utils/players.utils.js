import { PLAYER_NAMES_PREFIX, PLAYER_NAMES_POSTFIX } from "../constants/players.constant.js";

export function generateRandomPlayerName() {
  const playersNamesPrefixLength = PLAYER_NAMES_PREFIX.length;
  const playersNamesPostfixLength = PLAYER_NAMES_POSTFIX.length;

  const randomPlayerNamePrefix = PLAYER_NAMES_PREFIX[Math.floor(Math.random() * playersNamesPrefixLength)];
  const randomPlayerNamePostfix = PLAYER_NAMES_POSTFIX[Math.floor(Math.random() * playersNamesPostfixLength)];
  return `${randomPlayerNamePrefix} ${randomPlayerNamePostfix}`;
}
