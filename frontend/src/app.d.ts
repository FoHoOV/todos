// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { Token } from '$lib/generated-client/models';

import 'vitest-dom/extend-expect';
declare global {
	namespace App {
		interface Error {
			data?: Record<string, any>;
		}
		interface Locals {
			token?: Token;
		}

		interface PageData {
			token?: Token;
		}
		// interface Platform {}
	}

	declare module '@fortawesome/pro-solid-svg-icons/index.es' {
		export * from '@fortawesome/pro-solid-svg-icons';
	}
	declare module '@fortawesome/free-regular-svg-icons/index.es' {
		export * from '@fortawesome/free-regular-svg-icons';
	}
	declare module '@fortawesome/free-solid-svg-icons/index.es' {
		export * from '@fortawesome/free-solid-svg-icons';
	}
}

export {};
