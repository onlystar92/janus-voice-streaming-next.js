import { makeAutoObservable } from "mobx"
import * as R from "ramda"

// clientUUIDNotMatch :: String -> Boolean
const clientUUIDNotMatch = R.complement(R.propEq("uuid"))

// notNull :: Any -> Boolean
const notNull = R.complement(R.isNil)

class Client {
	uuid
	username
	volume
	talking
	stream
	node

	constructor(volume = 100, talking = false) {
		this.volume = volume
		this.talking = talking
		makeAutoObservable(this)
	}

	setUUID(uuid) {
		this.uuid = uuid
	}

	setUsername(username) {
		this.username = username
	}

	setRoom(room) {
		this.room = room
	}

	setStream(stream) {
		this.stream = stream
	}

	setNode(node) {
		this.node = node
	}

	setVolume(voume) {
		this.volume = voume
	}
}

class ClientStore {
	clients

	constructor() {
		this.clients = []
		makeAutoObservable(this)
	}

	addClient(client) {
		this.clients = R.append(client, this.clients)
	}

	removeClient(uuid) {
		this.clients = R.filter(clientUUIDNotMatch(uuid), this.clients)
	}

	findByUUID(uuid) {
		return this.clients.find(R.propEq("uuid", uuid))
	}

	contains(uuid) {
		return notNull(this.findByUUID(uuid))
	}
}

const clientStore = new ClientStore()
export default clientStore
export { Client }
