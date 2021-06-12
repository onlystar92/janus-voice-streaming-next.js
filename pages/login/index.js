import { useRouter } from "next/router"
import { observer } from "mobx-react-lite"
import userStore from "stores/User"

async function createMagicToken(uuid) {
	const response = await fetch(`/api/token/${uuid}`)
	return await response.json()
}

async function loginClient(token) {
	await fetch(`https://vapi.veltpvp.com/login/${token}`, {
		credentials: "include",
		redirect: "manual",
	})
	return token
}

function Login() {
	const router = useRouter()

	async function handleSubmit(event) {
		event.preventDefault()
		const data = new FormData(event.target)
		const uuid = data.get("uuid")

		// Log client in
		await createMagicToken(uuid)
			.then(async ({ token }) => await loginClient(token))
			.then(token => {
				userStore.setUUID(uuid)
				userStore.setToken(token)
			})
			.then(() => router.push("/"))
			.catch(error => console.error(error))
	}

	return (
		<div className="bg-primary-100 min-h-screen flex items-center justify-center">
			<form
				className="flex-1 bg-secondary-300 shadow-md p-4 rounded-lg max-w-lg"
				onSubmit={handleSubmit}
			>
				<h1 className="text-primary-text font-bold text-2xl">Enter your UUID</h1>
				<input
					className="block w-full mt-4 px-2 py-1 transition-colors duration-150 border-none rounded-md bg-primary-100 text-lg placeholder-primary-text placeholder-opacity-40 bg-opacity-40 text-primary-text text-opacity-40 focus:ring-2 focus:ring-primary-100 focus:ring-opacity-90 focus:outline-none focus:text-primary-text focus:text-opacity-80"
					placeholder="uuid"
					name="uuid"
				/>
				<button
					className="p-2 mt-6 w-full transition-colors duration-150 bg-primary-100 uppercase text-primary-text text-sm tracking-wide font-bold rounded-md focus:outline-none hover:bg-primary-200"
					type="submit"
				>
					Enter voice
				</button>
			</form>
		</div>
	)
}

export default observer(Login)
