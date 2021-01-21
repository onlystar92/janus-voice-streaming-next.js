import { observer } from "mobx-react-lite"
import { memo } from "react"
import clientStore from "@stores/ClientStore"
import ClientDisplay from "./client-display"

const renderRow = (client, _index) => {
	const variant = client.name === "C0uch" ? "self" : "other"
	return (
		<ClientDisplay className="mt-2 z-10 sm:m-0" key={client.id} client={client} variant={variant} />
	)
}

const ClientListView = ({ className }) => {
	return <div className={className}>{clientStore.clients.map(renderRow)}</div>
}

export default memo(observer(ClientListView))
