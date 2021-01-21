import { types } from "mobx-state-tree"

const Client = types
	.model("Client", {
		id: types.identifier,
		name: types.string,
		image: types.string,
		status: types.enumeration("Status", ["Talking", "Rest", "Muted"]),
		volume: types.number,
	})
	.actions(self => ({
		setStatus(newStatus) {
			self.status = newStatus
		},
	}))

const ClientStore = types
	.model("ClientStore", {
		clients: types.optional(types.array(Client), []),
	})
	.actions(self => ({
		addClient(client) {
			self.clients.push(client)
		},
		removeClient(client) {
			self.clients.replace(client.identifier)
		},
	}))

const clientStore = ClientStore.create({
	clients: [
		{
			id: "583yfvgn4",
			name: "C0uch",
			image: "/c0uch.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "658fyfgbsd23",
			name: "Hushes",
			image: "/hushes.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "6603894ygba",
			name: "M1stakes",
			image: "/m1stakes.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "75498f8gasd",
			name: "Selfish",
			image: "/selfish.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "534234342gdsg",
			name: "Bullet",
			image: "/bullet.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "756456456asdasd",
			name: "Tsuke",
			image: "/tsuke.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "6543564645453",
			name: "Splash",
			image: "/splash.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "2398475983475",
			name: "Boba",
			image: "/boba.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "3456364363463",
			name: "Axel",
			image: "/boba.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "34598734576894",
			name: "Chameleon",
			image: "/chameleon.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "234598723459873",
			name: "Reaper",
			image: "/reaper.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "4325086734598706",
			name: "Stamped",
			image: "/stamped.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "3464564565654546",
			name: "Jack",
			image: "/jack.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "6548387465345676",
			name: "Power",
			image: "/power.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "8457628432384676",
			name: "Cream",
			image: "/cream.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "6756456456456456",
			name: "Pose",
			image: "/pose.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "46534563469348565",
			name: "Kate",
			image: "/kate.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "879435783457893459",
			name: "Ash",
			image: "/ash.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "8934573457345983753",
			name: "Ariam",
			image: "/ariam.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "8934576589345789345",
			name: "Evoke",
			image: "/evoke.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "65489934854574578234",
			name: "Lemon",
			image: "/lemon.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "98075678926835479043",
			name: "Nest",
			image: "/nest.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "532454234523756732765",
			name: "Shiver",
			image: "/shiver.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "8345897349587345493578",
			name: "Tray",
			image: "/tray.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "436345634549823984823",
			name: "Rush",
			image: "/rush.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "9843789236419864551622",
			name: "Shadow",
			image: "/shadow.png",
			status: "Rest",
			volume: 100,
		},
		{
			id: "98345788734614612347753",
			name: "Lair",
			image: "/lair.png",
			status: "Rest",
			volume: 100,
		},
	],
})

export default clientStore
