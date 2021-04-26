import { makeAutoObservable } from "mobx"
import * as R from "ramda"
import { task } from "folktale/concurrency/task"
import Result from "folktale/result"

class Settings {
	muted
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

class Session {
	id
	publisherId

	constructor(id) {
		this.id = id
		makeAutoObservable(this)
	}

	setPublisherId(publisherId) {
		this.publisherId = publisherId
	}
}

class User {
	token
	username
	room
	settings

	constructor(token, username, room = -1) {
		this.token = token
		this.username = username
		this.room = room
		this.settings = new Settings(false)
		makeAutoObservable(this)
	}

	setSession(session) {
		this.session = session
	}

	setRoom(room) {
		this.room = room
	}
}

let userStore

function initializeStore(...args) {
	if (userStore) return
	userStore = new User(...args)
}

const cacheUserInStorage = (user, cache) => {
	const userInfo = R.pick(["token", "username", "room"], user)
	cache.setItem("user", JSON.stringify(userInfo))
}

function retrieveLocalStorage({ resolve }) {
	resolve(localStorage ? Result.Ok(localStorage) : Result.Error("Failed to cache user information"))
}

async function saveCurrentUser() {
	const storageResult = await task(retrieveLocalStorage).run().promise()
	cacheUserInStorage(userStore, storageResult.merge())
}

export { Session, userStore, initializeStore, saveCurrentUser }
