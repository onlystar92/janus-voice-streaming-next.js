const { types } = require("mobx-state-tree")

const User = types
	.model("User", {
		client: types.optional(types.string, ""),
		token: types.optional(types.string, ""),
		username: types.optional(types.string, ""),
		room: types.optional(types.integer, -1),
	})
	.actions(self => ({
		setSession(session) {
			self.session = session
		},
		setUsername(username) {
			self.username = username
		},
		setRoom(room) {
			self.room = room
		},
		setToken(token) {
			self.token = token
		},
	}))

let userStore

function initializeStore(initialState = {}) {
	if (userStore) {
		console.info("User store is already initialized")
		return
	}

	userStore = User.create(initialState)
}

function saveCurrentSnapshot() {
	try {
		if (!localStorage) {
			console.error("No localStorage available. Failed to save snapshot:", snapshot)
			return
		}

		console.info("Saving store to local storage")
		localStorage.setItem("user", JSON.stringify(userStore))
	} catch (error) {
		console.error("Failed to save snapshot to localStorage:", error)
	}
}

export { userStore, initializeStore, saveCurrentSnapshot }
