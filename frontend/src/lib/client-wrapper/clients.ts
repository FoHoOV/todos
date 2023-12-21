import { PUBLIC_API_URL } from '$env/static/public';
import {
	OAuthApi,
	TodoItemApi,
	TodoCategoryApi,
	UserApi,
	ProjectApi,
	TodoItemCommentApi,
	TagApi
} from '$lib/generated-client/apis';

import {
	BaseAPI,
	Configuration,
	type ConfigurationParameters,
	type RequestContext,
	type FetchAPI
} from '$lib/generated-client/runtime';
import type { Token } from '$lib/generated-client/models';
import { TokenError, isTokenExpirationDateValidAsync } from '$lib/utils/token';

const checkAccessToken = async (context: RequestContext, config?: ConfigurationOptions) => {
	if (config?.isTokenRequired === false) {
		return;
	}

	const headers = context.init.headers ? new Headers(context.init.headers) : new Headers();

	if (!config?.token?.access_token) {
		throw new TokenError('token required');
	}

	if (!(await isTokenExpirationDateValidAsync(config.token.access_token))) {
		throw new TokenError('token has expired');
	}

	headers.set(
		'Authorization',
		`${config.token?.token_type ?? 'bearer'} ${config.token.access_token}`
	);

	context.init.headers = headers;
};

type ConfigurationOptions = Partial<Omit<ConfigurationParameters, 'accessToken'>> & {
	token?: Token;
	isTokenRequired?: boolean;
};

export const generateClient = <T extends typeof BaseAPI>(
	ApiClass: T,
	config?: ConfigurationOptions
): InstanceType<T> => {
	config = {
		...config,
		fetchApi: addTimeoutToFetchIfNotExists(config?.fetchApi ?? fetch, 15 * 1000)
	};

	return new ApiClass(
		new Configuration({
			basePath: PUBLIC_API_URL,
			...(config ?? {})
		})
	).withPreMiddleware(async (context) => {
		return await checkAccessToken(context, config);
	}) as InstanceType<T>;
};

export const OAuthClient = (config: ConfigurationOptions = { isTokenRequired: true }) => {
	return generateClient(OAuthApi, config);
};

export const TodoItemClient = (config: ConfigurationOptions = { isTokenRequired: true }) => {
	return generateClient(TodoItemApi, config);
};

export const TodoItemCommentClient = (config: ConfigurationOptions = { isTokenRequired: true }) => {
	return generateClient(TodoItemCommentApi, config);
};

export const TagClient = (config: ConfigurationOptions = { isTokenRequired: true }) => {
	return generateClient(TagApi, config);
};

export const TodoCategoryClient = (config: ConfigurationOptions = { isTokenRequired: true }) => {
	return generateClient(TodoCategoryApi, config);
};

export const ProjectClient = (config: ConfigurationOptions = { isTokenRequired: true }) => {
	return generateClient(ProjectApi, config);
};

export const UserClient = (config?: ConfigurationOptions) => {
	return generateClient(UserApi, config);
};

/**
 *  @param timeout timeout in milliseconds
 */
export const addTimeoutToFetchIfNotExists = (fetch: FetchAPI, timeout: number) => {
	return (input: RequestInfo | URL, init?: RequestInit | undefined) => {
		if (!init?.signal) {
			const controller = new AbortController();
			setTimeout(() => {
				controller.abort();
			}, timeout);

			init = { ...init, signal: controller.signal };
		}

		return fetch(input, init);
	};
};
