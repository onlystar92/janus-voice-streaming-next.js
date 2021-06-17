import { makeAutoObservable } from "mobx"
import * as R from "ramda"
import { requestConfigUpdate } from "../util/switchboard/switchboard-client"
import { sendDataMessage } from "../util/janus/janus-client"

class Settings {
	muted
	defen
	inputVolume
	outputVolume
	preferredInput
	preferredOutput

	constructor(muted) {
		this.muted = muted
		this.inputVolume = 1
		this.outputVolume = 1
		this.preferredInput = "Default"
		this.preferredOutput = "Default"
		makeAutoObservable(this)
	}

	setMuted(muted) {
		//Send a request to update the config. The listener will handle actually updating the value
		requestConfigUpdate("muted", muted)
	}

	setDefen(defen) {
		//Send a request to update the config. The listener will handle actually updating the value
		requestConfigUpdate("deafen", defen)
	}

	setInputVolume(volume) {
		this.inputVolume = volume
	}

	setOutputVolume(volume) {
		this.outputVolume = volume
	}

	setPreferredInput(preferredInput) {
		this.preferredInput = preferredInput
	}

	setPreferredOutput(preferredOutput) {
		this.preferredOutput = preferredOutput
	}
}

class User {
	uuid
	token
	username
	room
	settings
	session
	audioContext
	pendingListen // Array of feeds pending to be listened
	listening // Array of feeds being listened to

	constructor() {
		this.settings = new Settings(false)
		this.pendingListen = []
		this.listening = []
		makeAutoObservable(this)
	}

	addUserToPending(user) {
		this.pendingListen = [...this.pendingListen, user]
	}

	removeUserFromPending(user) {
		this.pendingListen = R.filter(R.complement(R.equals(user)), this.pendingListen)
	}

	addUserToListening(user) {
		this.listening = [...this.listening, user]
	}

	removeUserFromListening(user) {
		this.listening = R.filter(R.complement(R.equals(user)), this.listening)
	}

	clearListener() {
		this.pendingListen = []
		this.listening = []
	}

	setToken(token) {
		this.token = token
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

	setAudioContext(audioContext) {
		this.audioContext = audioContext
	}

	setSession(session) {
		this.session = session
	}
}

const userStore = new User()
export default userStore
