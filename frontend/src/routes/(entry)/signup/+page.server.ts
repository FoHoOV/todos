import { redirect, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { convertFormDataToObject, superFail } from '$lib/actions/form';
import { schema } from './validators';
import { UserCreate } from '$lib/generated-client/zod/schemas';
import { callServiceInFormActions } from '$lib/client-wrapper';
import { UserClient } from '$lib/client-wrapper/clients';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();

		const validationsResult = await schema.safeParseAsync(convertFormDataToObject(formData));
		if (!validationsResult.success) {
			return superFail(400, {
				message: 'Invalid form, please review your inputs',
				error: validationsResult.error.flatten().fieldErrors
			});
		}

		return await callServiceInFormActions({
			serviceCall: async () => {
				await UserClient({
					isTokenRequired: false,
					fetchApi: fetch
				}).signupUser(validationsResult.data);
				redirect(303, '/login');
			},
			errorSchema: UserCreate
		});
	}
} satisfies Actions;
