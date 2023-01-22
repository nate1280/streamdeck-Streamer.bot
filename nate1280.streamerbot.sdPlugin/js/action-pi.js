let _currentPlugin
let sbActions
let currentAction

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, action) {
	data = JSON.parse(action)

	if (typeof data.payload.settings.action === 'string' || data.payload.settings.action instanceof String)
	{
		currentAction = { id: action, name: "Unknown", args: "{}"}
	}
	else if (data.payload.settings.action === undefined)
	{
		currentAction = { id: "", name: "", args: "{}"}
	}
	else
	{
		currentAction = { id: data.payload.settings.action.id, name: data.payload.settings.action.name, args: data.payload.settings.action.args}
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
	console.log(`%c[Streamer.bot]%c Updating UI Settings`, `color: #78d1ff`, `color: white`)
	
	if (data.payload.settings && Object.keys(data.payload.settings).length > 0) {
		document.getElementById('host').value = data.payload.settings.host
		document.getElementById('port').value = data.payload.settings.port
		document.getElementById('endpoint').value = data.payload.settings.endpoint
		document.getElementById('args').value = currentAction.args
		console.log(data)
	}
}

function updateGlobalSettings() {
	console.log(`%c[Streamer.bot]%c Updating Global Settings`, `color: #78d1ff`, `color: white`)

	let settings = {
		host: document.getElementById('host').value,
		port: document.getElementById('port').value,
		endpoint: document.getElementById('endpoint').value,
	}
	StreamDeck.setGlobalSettings(_currentPlugin.context, settings)
	StreamDeck.sendToPlugin(_currentPlugin.context, _currentPlugin.action, {updateGlobalSettings: true})
}

function updateActionsUI() {
	console.log(`%c[Streamer.bot]%c Updating Actions List`, `color: #78d1ff`, `color: white`)
	
	document.getElementById('actions').innerHTML = ''
	// Make Groups
	let groups = []
	sbActions.forEach((action) => {
		if (action.group === "") action.group = `None`
		if (!groups.includes(action.group) && action.group != `None`) {
			groups.push(action.group)
		}
	})
	groups.sort()
	groups.unshift(`None`)
	
	groups.forEach((group) => {
		createGroup(group)
	})
	
	// Make group items
	
	sbActions.forEach((action) => {
		if (action.group === "") action.group = `None`
		createAction(action)
	})
	
	document.getElementById('actions').value = currentAction.id
}

function createGroup(group) {
	const optgroup = document.createElement('optgroup')
	optgroup.label = group
	document.getElementById('actions').appendChild(optgroup)
}

function createAction(action) {
	const option = document.createElement('option')
	option.innerText = action.name
	option.value = action.id
	document.querySelector(`#actions optgroup[label="${action.group}"]`).appendChild(option)
}

function updateSettings() {
	console.log(`%c[Streamer.bot]%c Updating Settings`, `color: #78d1ff`, `color: white`)

	let actionId = document.getElementById('actions').value;
	let actionArgs = document.getElementById(`args`).value
	let action = getAction(actionId);
	StreamDeck.setSettings(_currentPlugin.context, {
		action: { id: action.id, name: action.name, args: actionArgs }
	})
	currentAction = { id: action.id, name: action.name, args: actionArgs }
}

function getAction(action) {
	for (var i = 0; i < sbActions.length; i++) {
		if (sbActions[i].id == action) {
			return sbActions[i];
		}
	}
}

document.getElementById('host').onchange = updateGlobalSettings
document.getElementById('port').onchange = updateGlobalSettings
document.getElementById('endpoint').onchange = updateGlobalSettings
document.getElementById('actions').onchange = updateSettings
document.getElementById('args').onchange = updateSettings
