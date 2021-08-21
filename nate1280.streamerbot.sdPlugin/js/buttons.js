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
		}
	}

	keyDown() {
		switch (this.type) {
			case 'action':
				this._doAction()
				break
		}
	}

	_doAction() {
		// blind send the action
		var id = (typeof this.action === 'string' || this.action instanceof String) ? this.action : this.action.id;
		sb.send('DoAction', {
			'action': {
				'id': id
			}
		})
	}

	_updateTitle() {
		StreamDeck.setTitle(this.context, this[this.type].name, StreamDeck.BOTH)
	}

	setOnline() {
		switch (this.type) {
			case 'action':
				StreamDeck.setImage(this.context, readyImg, StreamDeck.BOTH)
				break
			default:
				StreamDeck.setImage(this.context, blackImg, StreamDeck.BOTH)
				break
		}
	}

	setOffline() {
		StreamDeck.setImage(this.context, blackImg, StreamDeck.BOTH)
	}
}
