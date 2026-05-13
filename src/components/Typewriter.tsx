import { createSignal, onCleanup } from "solid-js"

export function Typewriter(props: { text: string, speed: number }) {
	const text = () => props.text
	const speed = () => props.speed

	const [renderText, setRenderText] = createSignal('')

	const timer = setInterval(() => {
		const currentText = text()
		const currentRenderText = renderText()

		if (currentRenderText.length < currentText.length) {
			setRenderText(currentRenderText + currentText[currentRenderText.length])
		} else if (currentRenderText.length === currentText.length) {
			clearInterval(timer)
		}
	}, speed())

	onCleanup(() => clearInterval(timer))

	return (
		<span>
			{renderText()}
		</span>
	)
}
