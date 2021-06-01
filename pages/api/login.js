import Cookies from "cookies"

async function loginClient(token) {
	return await fetch(`https://api.godcomplex.org/actions/login/${token}`, {
		credentials: "include",
	})
}

export default async function handler(req, res) {
	const requestToken = req.body.token
	const cookies = new Cookies(req, res)

	function handleSuccess(response) {
		const session = response.data

		// Set session cookie
		console.info("Assigning cookie")
		cookies.set("voice_session", JSON.stringify(session))

		// Respond with session
		res.status(200).json({ success: true, ...session })
	}

	function handleError(error) {
		console.error(`An error ocurred while logging in using token ${requestToken}:`, error)
		res.status(500).json({ success: false, message: `Failed to login using token ${requestToken}` })
	}

	// Create magic token
	await loginClient(requestToken).then(handleSuccess).catch(handleError)
}
