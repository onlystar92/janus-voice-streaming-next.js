import { useRouter } from "next/router"
import { observer } from "mobx-react-lite"
import { initializeStore, saveCurrentSnapshot } from "stores/UserStore"

async function loginClient(token) {
	const response = await fetch("/api/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ token }),
	})
	return await response.json()
}

async function createMagicToken(username) {
	const response = await fetch(`/api/token/${username}`)
	return await response.json()
}

function Login() {
	const router = useRouter()

	const handleSubmit = async event => {
		event.preventDefault()

		// Parse form data
		const data = new FormData(event.target)
		const username = data.get("username")

		// Create magic token
		const tokenResponse = await createMagicToken(username)
		if (!tokenResponse || !tokenResponse.success) {
			// TODO: Handle token creation error
			console.error(tokenResponse.message)
			return
		}

		// Login client using generated token
		const loginResponse = await loginClient(tokenResponse.token)
		if (!loginResponse || !loginResponse.success) {
			// TODO: Handle login error
			console.error(loginResponse.message)
			return
		}

		// Initialize user using login response
		const initialState = {
			token: loginResponse.token,
			username: loginResponse.player,
			room: parseInt(loginResponse.room ?? -1),
		}
		initializeStore(initialState)
		saveCurrentSnapshot()

		// Push to home
		router.push("/")
	}

	return (
		<div className="bg-primary-100 min-h-screen flex items-center justify-center">
			<form
				className="flex-1 bg-secondary-300 shadow-md p-4 rounded-lg max-w-lg"
				onSubmit={handleSubmit}
			>
				<h1 className="text-primary-text font-bold text-2xl">Enter your username</h1>
				<input
					className="block w-full mt-4 px-2 py-1 transition-colors duration-250 border-none rounded-md bg-primary-100 text-lg placeholder-primary-text placeholder-opacity-40 bg-opacity-40 text-primary-text text-opacity-40 focus:ring-2 focus:ring-primary-100 focus:ring-opacity-90 focus:outline-none focus:text-primary-text focus:text-opacity-80"
					placeholder="username"
					name="username"
				/>
				<button
					className="p-2 mt-6 w-full transition-colors duration-250 bg-primary-100 uppercase text-primary-text text-sm tracking-wide font-bold rounded-md focus:outline-none hover:bg-primary-200"
					type="submit"
				>
					Enter voice
				</button>
			</form>
		</div>
	)
}

export default observer(Login)
