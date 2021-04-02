import Cookies from "cookies"

async function loginClient(token) {
	const response = await fetch(`https://api.godcomplex.org/debug/actions/login/${token}`)
	return await response.json()
}

export default async function handler(req, res) {
	const requestToken = req.body.token
	const cookies = new Cookies(req, res)

	function handleSuccess(response) {
		const { player, token, room = -1 } = response.data
		const session = { player, token, room }

		// Set session cookie
		console.info("Assigning cookie")
		cookies.set("voice_session", JSON.stringify(session))

		// Respond with session
		res.status(200).json({ success: true, ...session })
	}

	function handleError(error) {
		console.error(`An error ocurred while logging in using token ${token}:`, error)
		res.status(500).json({ success: false, message: `Failed to login using token ${token}` })
	}

	// Create magic token
	await loginClient(requestToken).then(handleSuccess).catch(handleError)
}
