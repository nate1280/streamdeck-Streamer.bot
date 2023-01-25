class Button {
	constructor(type, data) {
		this.context = data.context
		this.type = type
		this.processStreamDeckData(data)
	}

	processStreamDeckData(data) {
		if (this.type == 'action' && !data.payload.settings.action) {
			this._updateTitle(``)
		}

		if (this.type == 'action' && data.payload.settings.action) {
			this.settings = data.payload.settings.action
			this._updateTitle(this.settings.name)
		} else if (this.type == 'push-to-actions' && data.payload.settings) {
			this.settings = data.payload.settings
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
		let args = this.settings.args || {}
		if (args === undefined || args === null || args === ``) args = {}
		args = Object.entries(args)
		args.unshift([`source`, `StreamDeck`])
		args = Object.fromEntries(args)
		let id = null

		if (this.type === `action` && keyState === `keyDown`) {
			
			// Normal action button
			id = (typeof this.action === 'string' || this.action instanceof String) ? this.action : this.settings.id;

		} else if (this.type === `push-to-actions` && keyState === `keyDown`) {

			// Push to action button when pressing down
			id = (typeof this.action === 'string' || this.action instanceof String) ? this.action : this.settings.keyDown.id;

		} else if (this.type === `push-to-actions` && keyState === `keyUp`) {

			// Push to action button when releasing
			id = (typeof this.action === 'string' || this.action instanceof String) ? this.action : this.settings.keyUp.id;

		}

		// Running the action but only do so if it was defined in one of these if statements above
		if (id != null) {
			sb.send('DoAction', {
				"action": {
					"id": id
				},
				"args": args
			}).then((data) => {
				if (data.status === `ok`) {
					StreamDeck.sendOk(this.context)
					console.log(`%c[Streamer.bot]%c Action ran successfully`, `color: #78d1ff`, `color: lightgreen`)
				} else if (data.status === `error`) {
					StreamDeck.sendAlert(this.context)
					console.log(`%c[Streamer.bot]%c Action didn't ran successfully because: "${data.error}"`, `color: #78d1ff`, `color: lightcoral`)
				}
				console.log(data)
			})
		}
	}

	_updateTitle(title) {
		StreamDeck.setTitle(this.context, title, StreamDeck.BOTH)
	}

	setOnline() {
	}
	
	setOffline() {
	}
}

function validateJson(str) {
	try {
		JSON.parse(str);
	} catch (error) {
		return false;
	}
	return true;
}
