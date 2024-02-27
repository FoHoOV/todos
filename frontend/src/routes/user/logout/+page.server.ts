import { redirect, type Actions, type Cookies } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import KEYS from '$lib/constants/cookie';

function logout(cookies: Cookies) {
	cookies.delete(KEYS.token, { path: '/', httpOnly: true, secure: false });
	redirect(307, '/login');
}

export const load = (async ({ cookies, url }) => {
	if (url.searchParams.get('session-expired') === 'true') {
		logout(cookies);
	}
	return {};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ cookies }) => {
		logout(cookies);
	}
} satisfies Actions;
