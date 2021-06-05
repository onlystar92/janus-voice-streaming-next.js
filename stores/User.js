import { makeAutoObservable } from "mobx"
import * as R from "ramda"

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
		this.muted = muted
	}

	setDefen(defen) {
		this.defen = defen
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
	listening // Array of feeds being listened to by user
	alreadyListening

	constructor() {
		this.settings = new Settings(false)
		this.listening = []
		this.alreadyListening = []
		makeAutoObservable(this)
	}

	listenToUser(user) {
		this.listening = [...this.listening, user]
	}

	stopListeningToUser(user) {
		this.listening = R.filter(R.complement(R.equals(user)), this.listening)
	}

	listenAlready(user) {
		this.alreadyListening = [...this.alreadyListening, user]
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
