const debug = true

const sb = new SBWebSocket()
const actionsAction = 'nate1280.streamerbot.action-btn'
const pushToActionsAction = 'nate1280.streamerbot.push-to-actions-btn'

const ConnectionState = {
	FAILED: -2,
	DISCONNECTED: -1,
	CONNECTING: 0,
	CONNECTED: 1,
}

function printConnectionState() {
	if (debug) console.log(`connectionState = ${connectionState} (${Object.keys(ConnectionState)[Object.values(ConnectionState).indexOf(connectionState)]})`)
}

let settings = {
	host: 'localhost',
	port: '8080',
	endpoint: '/'
}

let pluginUUID
let connectionState = ConnectionState.DISCONNECTED
let currentPI
let buttons = {}

let SB = {
	actions: []
}

connect()
function connect() {
	switch (connectionState) {
		case ConnectionState.FAILED:
			if (debug) console.log('FAILED: will not connect')
			break
		case ConnectionState.DISCONNECTED:
			if (debug) console.log('DISCONNECTED: will try to connect')
			if (settings.host === undefined)     settings.host     = `localhost`
			if (settings.port === undefined)     settings.port     = `8080`
			if (settings.endpoint === undefined) settings.endpoint = `/`
			sb.connect({
				address: `${settings.host}:${settings.port}${settings.endpoint}`
			})
			break
		case ConnectionState.CONNECTING:
			if (debug) console.log('CONNECTING: nothing to do')
			break
		case ConnectionState.CONNECTED:
			if (debug) console.log('CONNECTED: nothing to do')
			break
		default:
			sb.disconnect()
			ConnectionState.DISCONNECTED
	}
}

sb.on('ConnectionOpened', () => {
	connectionState = ConnectionState.CONNECTED
	printConnectionState()
	sbUpdateActions()
	setButtonsOnline()
})

sb.on('ConnectionClosed', () => {
	if (connectionState == ConnectionState.FAILED) return
	connectionState = ConnectionState.DISCONNECTED
	printConnectionState()
	SB.actions = []
	setButtonsOffline()
})

sb.on('ActionAdded', sbUpdateActions)
sb.on('ActionUpdated', sbUpdateActions)
sb.on('ActionDeleted', sbUpdateActions)

sb.on('Exiting', () => {
	sb.disconnect()
	console.log('Streamer.bot Disconnecting')
})

function sbUpdateActions() {
	sb.send('GetActions').then((data) => {
		SB.actions = data.actions.map((s) => {
			return { id: s.id, name: s.name, group: s.group }
		})
		if (currentPI) sendUpdatedActionsToPI()
	})
}

function updatePI(e) {
	if (connectionState != ConnectionState.CONNECTED) connect()
	currentPI = {
		context: e.context,
		action: e.action
	}
}

function sendUpdatedActionsToPI() {
	StreamDeck.sendToPI(currentPI.context, actionsAction, {
		actions: SB.actions
	})
}

function handleStreamDeckMessages(e) {
	const data = JSON.parse(e.data)
	if (debug) console.log(`${data.event}: `, data)
	switch(data.event) {
		case 'deviceDidConnect':
			StreamDeck.getGlobalSettings(pluginUUID)
			break
		case 'keyDown':
			printConnectionState()
			if (connectionState == ConnectionState.CONNECTED) {
				buttons[data.context].keyDown()
			} else {
				connectionState = ConnectionState.DISCONNECTED
				connect()
				setTimeout(() => {
					if (connectionState == ConnectionState.CONNECTED) {
						buttons[data.context].keyDown()
					} else {
						StreamDeck.sendAlert(data.context)
					}
				}, 10)
			}
			break
			case 'keyUp':
				printConnectionState()
				if (connectionState == ConnectionState.CONNECTED) {
					buttons[data.context].keyUp()
				} else {
					connectionState = ConnectionState.DISCONNECTED
					connect()
					setTimeout(() => {
						if (connectionState == ConnectionState.CONNECTED) {
							buttons[data.context].keyUp()
						} else {
							StreamDeck.sendAlert(data.context)
						}
					}, 10)
				}
				break
		case 'willAppear':
		case 'titleParametersDidChange':
		case 'didReceiveSettings':
			if (buttons[data.context]) {
				buttons[data.context].processStreamDeckData(data)
			} else {
				let type = ''
				if (data.action == actionsAction) type = 'action'
				if (data.action == pushToActionsAction) type = 'push-to-actions'
				buttons[data.context] = new Button(type, data)
				if (type == 'action') updateButton(data.context)
			}
			break
		case 'willDisappear':
			delete buttons[data.context]
			break
		case 'propertyInspectorDidAppear':
			updatePI(data)
			sendUpdatedActionsToPI()
			break
		case 'didReceiveGlobalSettings':
			handleGlobalSettingsUpdate(data)
			break
		case 'sendToPlugin':
			if (data.payload.updateGlobalSettings) {
				StreamDeck.getGlobalSettings(pluginUUID)
			}
		default:
			if (debug) console.log('Unhandled event:', data)
			break
		case 'keyUp':
			break
	}
}

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info) {
	if (debug) StreamDeck.debug = true
	pluginUUID = uuid
	StreamDeck._ws = new WebSocket("ws://localhost:" + port)
	StreamDeck._ws.onopen = () => {
		StreamDeck._openHandler(registerEvent, uuid)
	}
	StreamDeck._ws.onmessage = handleStreamDeckMessages
}

function handleGlobalSettingsUpdate(e) {
	if (Object.keys(e.payload.settings).length != 0) settings = e.payload.settings
	if (connectionState > ConnectionState.CONNECTING) {
		sb.disconnect()
		connectionState = ConnectionState.DISCONNECTED
		connect()
	}
}

function updateButton(context) {
	buttons[context].setOnline()
}

function setButtonsOnline() {
	Object.values(buttons).forEach((b) => {
		b.setOnline()
	})
}

function setButtonsOffline() {
	Object.values(buttons).forEach((b) => {
		b.setOffline()
	})
}
