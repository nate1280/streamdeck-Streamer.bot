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

	hasAction(action){
		for (var i = 0; i < SB.actions.length; i++) {
			if (SB.actions[i].id == action) {
				return true;
			}
		}
	}

	_doAction() {
		if (this.hasAction(this.action)) {
			sb.send('DoAction', {
				'action': {
					'id': this.action
				}
			})
		} else {
			StreamDeck.sendAlert(this.context)
		}
	}

	_updateTitle() {
		StreamDeck.setTitle(this.context, this[this.type], StreamDeck.BOTH)
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
