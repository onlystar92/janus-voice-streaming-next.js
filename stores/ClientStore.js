import { action, makeAutoObservable } from "mobx"
import * as R from "ramda"

// addClient :: (Client, [Client]) -> [Client]
const addClient = (client, list) => R.append(client, list)

// removeClient :: (Client, [Client]) -> [Client]
const removeClient = (client, list) => R.filter(clientIdNotMatch(client.id), list)

// clientIdNotMatch :: String -> Boolean
const clientIdNotMatch = R.complement(R.propEq("id"))

// notNull :: Any -> Boolean
const notNull = R.complement(R.isNil)

class Client {
	id
	username
	volume
	talking
	stream

	constructor(id, username, volume = 100, talking = false) {
		this.id = id
		this.username = username
		this.volume = volume
		this.talking = talking
		makeAutoObservable(this)
	}

	setStream(stream) {
		this.stream = stream
	}

	setVolume(voume) {
		this.volume = voume
	}
}

class ClientStore {
	clients

	constructor() {
		makeAutoObservable(this)
		this.clients = []
	}

	addClient(client) {
		this.clients = addClient(client, this.clients)
	}

	removeClient(client) {
		this.clients = removeClient(client, this.clients)
	}

	getClient(id) {
		return this.clients.find(R.propEq("id", id))
	}

	contains(id) {
		const client = this.getClient(id)
		return notNull(client)
	}
}

const clientStore = new ClientStore()
export default clientStore

export { Client }
