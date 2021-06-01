import { observer } from "mobx-react-lite"
import clsx from "clsx"
import ClientDisplay from "./client-display"

function ClientListView({ clients }) {
	return (
		<div
			className={clsx(
				"px-6 py-4 min-h-screen  flex flex-col items-stretch",
				"sm:grid sm:grid-cols-2 sm:items-start sm:gap-y-2 sm:gap-x-2",
				"md:grid-cols-2 md:gap-y-2 md:gap-x-2 md:py-6",
				"lg:px-12 lg:grid-cols-3 lg:gap-y-3 lg:gap-x-10 lg:py-10",
			)}
		>
			{clients.map((client, _index) => (
				<ClientDisplay key={client.uuid} client={client} />
			))}
		</div>
	)
}

export default observer(ClientListView)
