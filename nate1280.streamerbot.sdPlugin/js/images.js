const canvas = document.getElementById('canvas')

const ctx = canvas.getContext('2d')

	// Black button
	ctx.fillStyle = '#000000'
	ctx.fillRect(0, 0, 144, 144)
	const blackImg = canvas.toDataURL()

	// Ready button
	ctx.fillStyle = '#3f3f3f'
	ctx.fillRect(0, 0, 144, 15)
	const readyImg = canvas.toDataURL()
