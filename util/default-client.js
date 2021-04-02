import { Janus as JanusClient } from "janus-videoroom-client"

function DefaultClient(user) {
	const client = new JanusClient({ url: "wss://api.godcomplex.org/janus", token: user.getToken() })

	// Add event handlers
	client.onConnected(async () => {
		console.info("Client connected to janus")

		try {
			console.info("Creating client session")
			this.session = await user.createSession()

			console.info("Executing success callback")
			await this.onSuccess(this.session)
		} catch (err) {
			console.error(err.name + ": " + err.message)
		}
	})

	client.onDisconnected(async () => {
		if (this.session != null) {
			console.info("Destroying session")
			await this.session.destroy()
		}

		console.info("Client disconnected")
	})

	client.onError(err => {
		console.error("An error ouccurred on the client:", err)
	})

	// Add connect function
	this.connect = async function () {
		await client.connect()
	}

	this.onConnectSuccess = function (callback) {
		this.onSuccess = callback
	}

	this.getJanusClient = function () {
		return client
	}
}

export default DefaultClient
