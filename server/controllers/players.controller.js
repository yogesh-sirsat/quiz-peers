// export async function getRandomPlayerName(req, res, next) {
//   try {
//     const { isRoomPublic } = req.query;
//     const playerName = generateRandomPlayerName(isRoomPublic);
//     res.send({ playerName });
//   } catch (error) {
//     next(error);
//   }
// }

// export async function checkPlayerNameExists(req, res, next) {
//   try {
//     const { playerName, roomId, isRoomPublic } = req.body;
//     const playerNameExists = checkPlayerNameExists(playerName, roomId, isRoomPublic);
//     res.send({ playerNameExists });
//   } catch (error) {
//     next(error);
//   }
// }
