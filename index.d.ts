declare module 'abstract-state-router' {
	type DefaultParams = {
		[key: string]: string | null | (() => string | null)
	}
	type StateParams = {
		[key: string]: string | null
	}
	export type State<TEMPLATE, DOM_API> = {
		template: TEMPLATE
		name: string
		route: string
		defaultChild?: string | undefined
		data?: object
		resolve?: undefined | ((data: any, params: { [key: string]: string }) => Promise<any>)
		activate?: (context: any) => void
		querystringParameters?: string[] | undefined
		defaultParameters?: DefaultParams | undefined
		canLeaveState?: undefined | ((domApi: DOM_API) => boolean)
	}

	type ErrorEvent = 'stateChangeCancelled' | 'stateChangeError' | 'stateError'

	type StateChangeEvent = 'stateChangeStart' | 'stateChangeEnd'

	type GoOptions = {
		replace?: boolean
		inherit?: boolean
	}

	export type AbstractStateRouter<TEMPLATE, DOM_API> = {
		addState(options: State<TEMPLATE, DOM_API>): void
		go(state_name: string | null, state_parameters?: object, options?: GoOptions): void
		evaluateCurrentRoute(fallback_state_name: string, fallback_state_parameters?: object): void
		stateIsActive(state_name?: string | null, state_parameters?: object | null): boolean
		makePath(state_name: string | null, state_parameters?: object, options?: { inherit?: boolean }): string
		getActiveState(): { name: string; parameters: Record<string, string | null> }
		on(event: ErrorEvent, callback: (err: Error) => void): void
		on(
			event: StateChangeEvent,
			callback: (state: State<TEMPLATE, DOM_API>, parameters: object, states: State<TEMPLATE, DOM_API>[]) => void,
		): void
		on(event: 'routeNotFound', callback: (route: string, parameters: object) => void): void
		on(
			event: 'afterCreateState',
			callback: (args: {
				state: State<TEMPLATE, DOM_API>
				domApi: DOM_API
				content: unknown
				parameters: object
			}) => void,
		): void
		on(event: 'stateChangePrevented', callback: (stateName: string) => void): void
	}

	type RenderContext<TEMPLATE> = {
		template: TEMPLATE
		element: Element
		content: unknown
		parameters: object
	}

	export type Renderer<TEMPLATE, DOM_API> = {
		render(context: RenderContext<TEMPLATE>): DOM_API
		destroy(rendered_template_api: DOM_API): void
		getChildElement(rendered_template_api: DOM_API): DOM_API
	}

	function createAbstractStateRouter<TEMPLATE, DOM_API>(
		make_renderer: (asr: AbstractStateRouter<TEMPLATE, DOM_API>) => Renderer<TEMPLATE, DOM_API>,
		root_element: HTMLElement | null,
		options?: object,
	): AbstractStateRouter<TEMPLATE, DOM_API>

	export default createAbstractStateRouter
}
