let _currentPlugin
let sbActions
let currentAction

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, action) {
	data = JSON.parse(action)

	if (typeof data.payload.settings.action === 'string' || data.payload.settings.action instanceof String)
	{
		currentAction = { id: action, name: "Unknown"}
	}
	else if (data.payload.settings.action === undefined)
	{
		currentAction = { id: "", name: ""}
	}
	else
	{
		currentAction = { id: data.payload.settings.action.id, name: data.payload.settings.action.name}
	}

	_currentPlugin = {
		action: data.action,
		context: uuid
	}

	StreamDeck.debug = true
	StreamDeck._ws = new WebSocket("ws://localhost:" + port)
	StreamDeck._ws.onopen = () => {
		StreamDeck._openHandler(registerEvent, uuid)
		StreamDeck.getGlobalSettings(_currentPlugin.context)
	}
	StreamDeck._ws.onmessage = (e) => {
		const data = JSON.parse(e.data)
		switch(data.event) {
			case 'sendToPropertyInspector':
				if (data.payload.actions) {
					if (data.payload.settings) updateSettingsUI(data)
					sbActions = data.payload.actions
					updateActionsUI()
				}
				break
			case 'didReceiveGlobalSettings':
				updateSettingsUI(data)
				break
			default:
				// console.log(data)
				break
		}
	}
}

function updateSettingsUI(data) {
	if (data.payload.settings && Object.keys(data.payload.settings).length > 0) {
		document.getElementById('host').value = data.payload.settings.host
		document.getElementById('port').value = data.payload.settings.port
	}
}

function updateGlobalSettings() {
	let settings = {
		host: document.getElementById('host').value,
		port: document.getElementById('port').value
	}
	StreamDeck.setGlobalSettings(_currentPlugin.context, settings)
	StreamDeck.sendToPlugin(_currentPlugin.context, _currentPlugin.action, {updateGlobalSettings: true})
}

function updateActionsUI() {
	document.getElementById('actions').innerText = ''
	//createAction('')
	sbActions.forEach((action) => {
		createAction(action)
	})
	document.getElementById('actions').value = currentAction.id
}

function createAction(action) {
	const option = document.createElement('option')
	option.innerText = action.name
	option.value = action.id
	document.getElementById('actions').appendChild(option)
}

function updateSettings() {
	let actionId = document.getElementById('actions').value;
	let action = getAction(actionId);
	StreamDeck.setSettings(_currentPlugin.context, {
		action: { id: action.id, name: action.name }
	})
	currentAction = { id: action.id, name: action.name }
}

function getAction(action){
	for (var i = 0; i < sbActions.length; i++) {
		if (sbActions[i].id == action) {
			return sbActions[i];
		}
	}
}

document.getElementById('host').onchange = updateGlobalSettings
document.getElementById('port').onchange = updateGlobalSettings
document.getElementById('actions').onchange = updateSettings
