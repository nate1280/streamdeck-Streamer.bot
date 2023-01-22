class Button {
	constructor(type, data) {
		this.context = data.context
		this.type = type
		this.processStreamDeckData(data)
	}

	processStreamDeckData(data) {
		if (this.type == 'action' && data.payload.settings.action) {
			this.action = data.payload.settings.action
			this._updateTitle()
		} else if (this.type == 'push-to-actions' && data.payload.settings.action) {
			this.action = data.payload.settings.action
		}
	}

	keyDown() {
		switch (this.type) {
			case 'action':
				this._doAction(`keyDown`)
				break
			case 'push-to-actions':
				this._doAction(`keyDown`)
				break
		}
	}

	keyUp() {
		switch (this.type) {
			case 'push-to-actions':
				this._doAction(`keyUp`)
				break
		}
	}

	_doAction(keyState) {
		if (this.type === `action` && keyState === `keyDown`) {

			var id = (typeof this.action === 'string' || this.action instanceof String) ? this.action : this.action.id;
			let args = this.action.args
			if (args === undefined || args === null || args === ``) args = `{}`
			let decodedJson = decodeURI(args).replaceAll(`\n`, ``)
			decodedJson = Object.entries(JSON.parse(decodedJson))
			decodedJson.unshift([`source`, `StreamDeck`])
			args = Object.fromEntries(decodedJson)

			sb.send('DoAction', {
				'action': {
					'id': id
				},
				'args': args
			})

		} else if (this.type === `push-to-actions` && keyState === `keyDown`) {

			var id = (typeof this.action === 'string' || this.action instanceof String) ? this.action : this.action.keyDown.id;
			let args = this.action.args
			if (args === undefined || args === null || args === ``) args = `{}`
			let decodedJson = decodeURI(args).replaceAll(`\n`, ``)
			decodedJson = Object.entries(JSON.parse(decodedJson))
			decodedJson.unshift([`source`, `StreamDeck`])
			args = Object.fromEntries(decodedJson)

			sb.send('DoAction', {
				'action': {
					'id': id
				},
				'args': args
			})

		} else if (this.type === `push-to-actions` && keyState === `keyUp`) {

			var id = (typeof this.action === 'string' || this.action instanceof String) ? this.action : this.action.keyUp.id;
			let args = this.action.args
			if (args === undefined || args === null || args === ``) args = `{}`
			let decodedJson = decodeURI(args).replaceAll(`\n`, ``)
			decodedJson = Object.entries(JSON.parse(decodedJson))
			decodedJson.unshift([`source`, `StreamDeck`])
			args = Object.fromEntries(decodedJson)

			sb.send('DoAction', {
				'action': {
					'id': id
				},
				'args': args
			})

		}
	}

	_updateTitle() {
		StreamDeck.setTitle(this.context, this[this.type].name, StreamDeck.BOTH)
	}

	setOnline() {
		switch (this.type) {
			case 'action':
				// StreamDeck.setImage(this.context, readyImg, StreamDeck.BOTH)
				break
			default:
				// StreamDeck.setImage(this.context, blackImg, StreamDeck.BOTH)
				break
		}
	}

	setOffline() {
		// StreamDeck.setImage(this.context, blackImg, StreamDeck.BOTH)
	}
}
