let _currentPlugin
let sbActions
let currentAction

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, action) {
	data = JSON.parse(action)

	if (typeof data.payload.settings.action === 'string' || data.payload.settings.action instanceof String)
	{
		currentAction = {
			action: {
				keyDown: {
					id: action,
					name: "Unknown"
				},
				keyUp: {
					id: action,
					name: "Unknown"
				},
				args: {}
			}
		}
	}
	else if (data.payload.settings.action === undefined)
	{
		currentAction = {
			action: {
				keyDown: {
					id: "",
					name: ""
				},
				keyUp: {
					id: "",
					name: ""
				},
				args: {}
			}
		}
	}
	else
	{
		currentAction = {
			action: {
				keyDown: {
					id: data.payload.settings.action.keyDown.id,
					name: data.payload.settings.action.keyDown.name
				},
				keyUp: {
					id: data.payload.settings.action.keyUp.id,
					name: data.payload.settings.action.keyUp.name
				},
				args: data.payload.settings.action.args
			}
		}
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
					console.log(data)
				break
		}
	}
}

let table = document.getElementById(`arguments-table`)
table.addEventListener(`keydown`, updateArgumentsTable)

function updateArgumentsTable() {

	setTimeout(() => {
		let tableData = []
		table.querySelectorAll(`tr`).forEach(tableRow => {
			let argumentName  = tableRow.querySelector(`td:nth-child(1)`).innerText || ``
			let argumentValue = tableRow.querySelector(`td:nth-child(2)`).innerText || ``
			if (argumentName != `` && argumentValue != ``) {
				tableData.push([argumentName, argumentValue])
			}
		});

		table.querySelectorAll(`tr:not(:first-child)`).forEach(tableRow => {
			if (tableRow.querySelector(`td:nth-child(1)`).innerText === `` && tableRow.querySelector(`td:nth-child(2)`).innerText === ``) {
			tableRow.remove()
			}
		});
		
		if (table.querySelector(`tr:last-child td:nth-child(1)`).innerText != `` && table.querySelector(`tr:last-child td:nth-child(2)`).innerText != ``) {
			table.querySelector(`tbody`).insertAdjacentHTML(`beforeend`, `
			<tr>
				<td contenteditable="true" style="text-align: right;"></td>
				<td contenteditable="true" style="text-align: left;"></td>
			</tr>
			`)
		}
	}, 50);

	updateSettings()
}

function GetArguments() {
	let tableData = []
	table.querySelectorAll(`tr`).forEach(tableRow => {
		let argumentName  = tableRow.querySelector(`td:nth-child(1)`).innerText || ``
		let argumentValue = tableRow.querySelector(`td:nth-child(2)`).innerText || ``
		if (argumentName != `` && argumentValue != ``) {
			tableData.push([argumentName, argumentValue])
		}
	});
	return Object.fromEntries(tableData)
}

function updateSettingsUI(data) {
	if (data.payload.settings && Object.keys(data.payload.settings).length > 0) {
		console.log(`%c[Streamer.bot]%c Updating UI Settings`, `color: #78d1ff`, `color: white`)
		document.getElementById('host').value = data.payload.settings.host
		document.getElementById('port').value = data.payload.settings.port
		document.getElementById('endpoint').value = data.payload.settings.endpoint
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
	
	document.getElementById('keydown-actions').innerHTML = ''
	document.getElementById('keyup-actions').innerHTML = ''
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
	
	document.getElementById('keydown-actions').value = currentAction.action.keyDown.id
	document.getElementById('keyup-actions').value = currentAction.action.keyUp.id

	updateArgsUI()
}

function updateArgsUI() {
	let table = document.getElementById(`arguments-table`)
	let args = Object.entries(currentAction.action.args)

	table.querySelector(`tbody`).innerHTML = ``

	if (args.length === 0) {
		table.querySelector(`tbody`).insertAdjacentHTML(`beforeend`, `
		<tr>
			<td contenteditable="true" style="text-align: right;"></td>
			<td contenteditable="true" style="text-align: left;"></td>
		</tr>
		`)
	}

	args.forEach(arg => {
		table.querySelector(`tbody`).insertAdjacentHTML(`beforeend`, `
		<tr>
			<td contenteditable="true" style="text-align: right;">${arg[0]}</td>
			<td contenteditable="true" style="text-align: left;">${arg[1]}</td>
		</tr>
		`)
	});

	updateArgumentsTable()
}

function createGroup(group) {
	const keydownOptgroup = document.createElement('optgroup')
	keydownOptgroup.label = group
	document.getElementById('keydown-actions').appendChild(keydownOptgroup)

	const keyupOptgroup = document.createElement('optgroup')
	keyupOptgroup.label = group
	document.getElementById('keyup-actions').appendChild(keyupOptgroup)
}

function createAction(action) {
	const keydownOption = document.createElement('option')
	keydownOption.innerText = action.name
	keydownOption.value = action.id
	document.querySelector(`#keydown-actions optgroup[label="${action.group}"]`).appendChild(keydownOption)

	const keyupOption = document.createElement('option')
	keyupOption.innerText = action.name
	keyupOption.value = action.id
	document.querySelector(`#keyup-actions optgroup[label="${action.group}"]`).appendChild(keyupOption)
}

function updateSettings() {
	console.log(`%c[Streamer.bot]%c Updating Settings`, `color: #78d1ff`, `color: white`)

	let keyDownActionId = document.getElementById('keydown-actions').value;
	let keyUpActionId = document.getElementById('keyup-actions').value;
	let keyDownAction = getAction(keyDownActionId);
	let keyUpAction = getAction(keyUpActionId);
	StreamDeck.setSettings(_currentPlugin.context, {
		action: {
			keyDown: {
				id: keyDownAction.id,
				name: keyDownAction.name
			},
			keyUp: {
				id: keyUpAction.id,
				name: keyUpAction.name
			},
			args: GetArguments()
		}
	})
	currentAction = {
		action: {
			keyDown: {
				id: keyDownAction.id,
				name: keyDownAction.name
			},
			keyUp: {
				id: keyUpAction.id,
				name: keyUpAction.name
			},
			args: GetArguments()
		}
	}
}

function getAction(action) {
	for (var i = 0; i < sbActions.length; i++) {
		if (sbActions[i].id == action) {
			return sbActions[i];
		}
	}
}

function validateJson(json) {
	try {
		JSON.parse(json);
	} catch (error) {
		return false;
	}
	return true;
}

document.getElementById('host').onchange = updateGlobalSettings
document.getElementById('port').onchange = updateGlobalSettings
document.getElementById('endpoint').onchange = updateGlobalSettings
document.getElementById('keydown-actions').onchange = updateSettings
document.getElementById('keyup-actions').onchange = updateSettings
