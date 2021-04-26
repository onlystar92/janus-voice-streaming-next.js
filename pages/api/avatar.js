async function fetchUserInfo(name) {
	const response = await fetch(`https://api.ashcon.app/mojang/v2/user/${name}`)
	return await response.json()
}

function createAvatarLink(texturesLink) {
	return `https://api.mineskin.org/render/head?url=${texturesLink}`
}

export default async function handler(req, res) {
	const { user } = req.query

	if (!user) {
		res.status(400).json({ success: false, message: "No user parameter provided" })
		return
	}

	const userInfo = await fetchUserInfo(user)

	if (!userInfo) {
		res.status(500).json({ success: false, message: "Failed to fetch user unique id" })
		return
	}

	const avatar = createAvatarLink(userInfo.textures.skin.url)
	res.status(200).json({ success: true, avatar })
}
