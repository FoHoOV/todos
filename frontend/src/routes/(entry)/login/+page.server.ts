import { type Actions, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import KEYS from '$lib/constants/cookie';
import { superFail, validateFormActionRequest } from '$lib/actions/form';
import { schema } from './validators';
import { Body_login_for_access_token_OAuth } from '$lib/generated-client/zod/schemas';
import { superApplyAction, callServiceInFormActions } from '$lib/client-wrapper/wrapper.server';
import { ErrorType } from '$lib/client-wrapper/wrapper.universal';
import { OAuthClient } from '$lib/client-wrapper/clients';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;
export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const validation = await validateFormActionRequest(request, schema);

		if (!validation.success) {
			return validation.failure;
		}

		return await callServiceInFormActions({
			serviceCall: async () => {
				const token = await OAuthClient({
					isTokenRequired: false,
					fetchApi: fetch
				}).loginForAccessTokenOAuth(validation.data.username, validation.data.password);
				cookies.set(KEYS.token, JSON.stringify(token), {
					secure: false,
					httpOnly: true,
					path: '/'
				});
				redirect(303, '/user/projects');
			},
			errorCallback: async (e) => {
				if (e.type === ErrorType.NOT_AUTHENTICATED) {
					e.preventDefaultHandler = true;
					return superFail(400, {
						message: (e.data as any).detail as string
					});
				}
				return await superApplyAction(e);
			},
			errorSchema: Body_login_for_access_token_OAuth
		});
	}
} satisfies Actions;
