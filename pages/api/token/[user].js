async function createMagicToken(username) {
	const response = await fetch(`https://api.godcomplex.org/debug/api/magicToken/create/${username}`)
	return await response.json()
}

export default async function handler(req, res) {
	const { user } = req.query

	function handleSuccess({ data: { token } }) {
		console.info("Token created:", token)
		res.status(200).json({ success: true, token })
	}

	function handleError(error) {
		console.error(`An error ocurred while generating a magic token for ${user}:`, error)
		res.status(500).json({ success: false, message: "Failed to create magic token" })
	}

	// Create magic token
	await createMagicToken(user).then(handleSuccess).catch(handleError)
}
