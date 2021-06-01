async function movePlayerToRoom(player, room) {
	const response = await fetch(
		`https://api.godcomplex.org/debug/api/players/${player}/move/${room}`,
	)
	return await response.json()
}

export default async function handler(req, res) {
	const { player, room } = req.body

	function handleSuccess(response) {
		console.info(`Moved player ${player} to room ${room}:`, response)
		res.status(200).json({ success: true })
	}

	function handleError(error) {
		console.error(`An error ocurred while logging in using token ${token}:`, error)
		res.status(500).json({ success: false, message: `Failed to login using token ${token}` })
	}

	await movePlayerToRoom(player, room).then(handleSuccess).catch(handleError)
}
