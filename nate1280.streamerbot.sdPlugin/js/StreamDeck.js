const StreamDeck = {
	BOTH: 0,
	HARDWARE: 1,
	SOFTWARE: 2,
	_ws: null,
	_openHandler: (event, uuid) => {
		StreamDeck._send({
			"event": event,
			"uuid": uuid
		})
	},
	_send: (data) => {
		if (StreamDeck.debug) console.log('StreamDeck.send', data)
		StreamDeck._ws.send(JSON.stringify(data))
	},
	_sendWithContext: (context, data) => {
		if (context.context) context = context.context
		data.context = context
		StreamDeck._send(data)
	},
	_sendTo: (context, action, to, payload) => {
		StreamDeck._sendWithContext(context, {
			action: action,
			event: to,
			payload: payload
		})
	},
	send: (context, event, payload) => {
		let msg = {
			event: event
		}
		if (payload) msg.payload = payload
		StreamDeck._sendWithContext(context, msg)
	},
	sendAlert: (context) => {
		StreamDeck.send(context, 'showAlert')
	},
	sendOk: (context) => {
		StreamDeck.send(context, 'showOk')
	},
	setTitle: (context, title, target) => {
		StreamDeck.send(context, 'setTitle', {
			title: title,
			target: target
		})
	},
	getSettings: (context) => {
		StreamDeck.send(context, 'getSettings')
	},
	setSettings: (context, settings) => {
		StreamDeck.send(context, 'setSettings', settings)
	},
	getGlobalSettings: (context) => {
		StreamDeck.send(context, 'getGlobalSettings')
	},
	setGlobalSettings: (context, settings) => {
		StreamDeck.send(context, 'setGlobalSettings', settings)
	},
	setImage: (context, image, target) => {
		StreamDeck.send(context, 'setImage', {
			image: image,
			target: target
		})
	},
	sendToPlugin: (context, action, payload) => {
		StreamDeck._sendTo(context, action, 'sendToPlugin', payload)
	},
	sendToPI: (context, action, payload) => {
		StreamDeck._sendTo(context, action, 'sendToPropertyInspector', payload)
	},
}
