import { PLAYER_NAMES_POSTFIX, PLAYER_NAMES_PREFIX } from "../constants/players.constant";

export function generateRandomPlayerName() {
  const playersNamesPrefixLength = PLAYER_NAMES_PREFIX.length;
  const playersNamesPostfixLength = PLAYER_NAMES_POSTFIX.length;

  const randomPlayerNamePrefix = PLAYER_NAMES_PREFIX[Math.floor(Math.random() * playersNamesPrefixLength)];
  const randomPlayerNamePostfix = PLAYER_NAMES_POSTFIX[Math.floor(Math.random() * playersNamesPostfixLength)];
  return `${randomPlayerNamePrefix} ${randomPlayerNamePostfix}`;
}

