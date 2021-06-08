import { autorun } from "mobx"
import * as R from "ramda"
import clientStore from "stores/ClientStore"
import userStore from "stores/User"
import { publishAudioTracks, listenFeed, listParticipants } from "./janus/video-room"

async function enumerateMediaDevices() {
	return await navigator.mediaDevices.enumerateDevices()
}

async function findDeviceIdByName(name) {
	const devices = await enumerateMediaDevices()
	return devices.find(device => device.label === name)
}

async function publishClientMedia(room) {
	const { id, peerConnection, trackSender } = await publishAudioTracks(room)

	const disposeInputHandler = autorun(async () => {
		const preferredInput = userStore.settings.preferredInput
		const device = await findDeviceIdByName(preferredInput)

		if (!device || !device.deviceId) {
			return
		}

		getUserMediaStream({ audio: { deviceId: device.deviceId } })
			.then(newStream => {
				const audioTrack = newStream.getAudioTracks()[0]
				trackSender.replaceTrack(audioTrack)
				console.info("Changed input device to:", audioTrack)
			})
			.catch(error => {
				console.error(`Failed to get media stream from device '${preferredInput}':`, error)
			})
	})

	const disposeMuteHandler = autorun(() => {
		console.info("Muted:", userStore.settings.muted)
		trackSender.track.enabled = !userStore.settings.muted
	})

	// Handle connection state
	peerConnection.onconnectionstatechange = function (event) {
		switch (peerConnection.connectionState) {
			case "connected":
				console.info("User publishing stream:", id)
				break
			case "disconnected":
			case "failed":
				console.info("User media stream disconnected")
				break
			case "closed":
				console.info("Connection closed")
				disposeMuteHandler()
				disposeInputHandler()
				break
		}
	}

	return peerConnection
}

const audioPhysicsConfig = {
	directionalAudio: true,
	panningModel: "HRTF", //human head
	distanceModel: "inverse", //inverse, linear, or exponential
	maxDistance: 80, //max distance for audio rolloff
	rolloffFactor: 0.5, //higher means faster volume loss
	refDistance: 1, //reference distance for reducing volume
}

async function listenToFeed(room, feed) {
	let client

	async function onStreamReceived(event) {
		console.info("Finding participant", feed, "in room")
		const listResponse = await listParticipants(room)
		const participant = listResponse.participants.find(R.propEq("id", feed))
		client = clientStore.findByUUID(participant.display)

		console.info("Initializing panner node")
		const context = userStore.audioContext
		const stream = event.streams[0]

		const options = {
			mediaStream: stream,
		}
		const audioSource = new MediaStreamAudioSourceNode(context, options)
		const node = new PannerNode(context, audioPhysicsConfig)

		//default position is zero, facing south.
		//note that for default cone values, orientation of speaker isn't significant
		node.positionX.value = 0
		node.positionY.value = 0
		node.positionZ.value = 0

		//Hook everything up
		audioSource.connect(node)
		node.connect(context.destination)

		// Assign node and stream to client
		client.setNode(node)
		client.setStream(stream)
	}

	const listenHandle = await listenFeed(room, feed, onStreamReceived)

	listenHandle.onConnect(async event => {
		console.info("Connectd to feed:", feed)
	})

	listenHandle.onDisconnect(async event => {
		console.info("Stopped listening to feed:", feed)
		clientStore.removeClient(client.uuid)
		userStore.removeUserFromPending(client.uuid)
		userStore.removeUserFromListening(client.uuid)
	})

	listenHandle.onClose(async event => {
		console.info("Connection closed")
	})
}

export { publishClientMedia, listenToFeed }
