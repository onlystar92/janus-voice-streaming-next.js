import DefaultClient from "./default-client"

function User(token) {
	this.getToken = function () {
		return token
	}

	const client = new DefaultClient(this)
	const janusClient = client.getJanusClient()
	let session

	this.createSession = async function () {
		session = await janusClient.createSession()
		return session
	}

	this.destroySession = async function () {
		await janusClient.destroySession(session.id)
	}

	this.getSession = function () {
		return session
	}

	this.getClient = function () {
		return client
	}
}

export default User
