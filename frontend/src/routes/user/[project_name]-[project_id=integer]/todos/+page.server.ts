import { error, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { validateFormActionRequest, namedActionResult, superFail } from '$lib/actions/form';
import {
	addTagSchema,
	addTodoItemDependencySchema,
	attachToProjectSchema,
	createTodoCategorySchema,
	createTodoCommentSchema,
	createTodoItemSchema,
	editTagSchema,
	editTodoCategorySchema,
	editTodoCommentSchema,
	editTodoItemSchema
} from './validator';
import {
	TodoItemCreate,
	TodoCategoryCreate,
	TodoCategoryAttachAssociation,
	TodoCategoryUpdateItem,
	TodoItemUpdateItem,
	TodoCommentCreate,
	TodoCommentUpdate,
	TagAttachToTodo,
	TagUpdate,
	TodoItemAddDependency
} from '$lib/generated-client/zod/schemas';
import { callService, callServiceInFormActions } from '$lib/client-wrapper';
import {
	TodoItemClient,
	TodoCategoryClient,
	TodoItemCommentClient,
	TagClient
} from '$lib/client-wrapper/clients';
import { convertNumberToHttpStatusCode } from '$lib';

export const load = (async ({ locals, fetch, params }) => {
	// https://github.com/sveltejs/kit/issues/9785
	// if we reject or throw a redirect in streamed promises it doesn't work for now and crashes the server
	// we have to wait for a fix or handle the error and make it an expected error :(
	// even throwing an error (which is an expected error) still results in a server crash :(
	// return {
	// 	streamed: {
	// 		todos: callService({
	// 			serviceCall: async () => {
	// 				return await TodoCategoryClient({
	// 					token: locals.token,
	// 					fetchApi: fetch
	// 				}).getForUserTodoCategory(Number.parseInt(params.project_id));
	// 			},
	// 			errorCallback: async (e) => {
	// 				if (e.type === ErrorType.UNAUTHORIZED) {
	// 					e.preventDefaultHandler = true;
	// 				}
	// 				throw error(e.status >= 400 ? e.status : 400, { message: 'Error fetching your todos!' });
	// 			}
	// 		})
	// 	}

	return await callService({
		serviceCall: async () => {
			return await TodoCategoryClient({
				token: locals.token,
				fetchApi: fetch
			}).getForUserTodoCategory(Number.parseInt(params.project_id));
		},
		errorCallback: async (e) => {
			if (e.status == 401) {
				return; // allow default unauthenticated user handling
			}
			error(convertNumberToHttpStatusCode(e.status), { message: 'Error fetching your todos!' });
		}
	});
}) satisfies PageServerLoad;

// TODO: probably should separate these to their own routes (todo/[edit|create] or category/[edit]/create, ...)
// with the new shallow routing I can separate the associated components as well (but i'll w8 for the svelte5 for the big refactor)
export const actions: Actions = {
	addTodo: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, createTodoItemSchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TodoItemClient({
					token: locals.token,
					fetchApi: fetch
				}).createForUserTodoItem({
					...validation.data
				});
			},
			errorSchema: TodoItemCreate
		});

		return namedActionResult(result, 'addTodo');
	},
	createCategory: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, createTodoCategorySchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TodoCategoryClient({
					token: locals.token,
					fetchApi: fetch
				}).createForUserTodoCategory({
					...validation.data
				});
			},
			errorSchema: TodoCategoryCreate
		});

		return namedActionResult(result, 'createCategory');
	},
	attachToProject: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, attachToProjectSchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TodoCategoryClient({
					token: locals.token,
					fetchApi: fetch
				}).attachToProjectTodoCategory({
					...validation.data
				});
			},
			errorSchema: TodoCategoryAttachAssociation
		});

		return namedActionResult(result, 'attachToProject');
	},
	editTodoCategory: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, editTodoCategorySchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TodoCategoryClient({
					token: locals.token,
					fetchApi: fetch
				}).updateItemTodoCategory({
					...validation.data
				});
			},
			errorSchema: TodoCategoryUpdateItem
		});

		return namedActionResult(result, 'editTodoCategory');
	},
	editTodoItem: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, editTodoItemSchema);

		if (!validation.success) {
			return validation.failure;
		}

		if (!validation.data.due_date) {
			const date = new Date(0);
			date.setFullYear(1, 0, 1);
			validation.data.due_date = date;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TodoItemClient({
					token: locals.token,
					fetchApi: fetch
				}).updateItemTodoItem({
					...validation.data
				});
			},
			errorSchema: TodoItemUpdateItem
		});

		return namedActionResult(result, 'editTodoItem');
	},
	createTodoComment: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, createTodoCommentSchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TodoItemCommentClient({
					token: locals.token,
					fetchApi: fetch
				}).createTodoItemComment({
					...validation.data
				});
			},
			errorSchema: TodoCommentCreate
		});

		return namedActionResult(result, 'createTodoComment');
	},
	editTodoComment: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, editTodoCommentSchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TodoItemCommentClient({
					token: locals.token,
					fetchApi: fetch
				}).updateTodoItemComment({
					...validation.data
				});
			},
			errorSchema: TodoCommentUpdate
		});

		return namedActionResult(result, 'editTodoComment');
	},
	addTag: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, addTagSchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TagClient({
					token: locals.token,
					fetchApi: fetch
				}).attachToTodoTag({ ...validation.data, create_if_doesnt_exist: true });
			},
			errorSchema: TagAttachToTodo
		});

		return namedActionResult(result, 'addTag');
	},
	editTag: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, editTagSchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TagClient({
					token: locals.token,
					fetchApi: fetch
				}).updateTag({
					...validation.data
				});
			},
			errorSchema: TagUpdate
		});

		return namedActionResult(result, 'editTag');
	},
	addTodoItemDependency: async ({ request, locals, fetch }) => {
		const validation = await validateFormActionRequest(request, addTodoItemDependencySchema);

		if (!validation.success) {
			return validation.failure;
		}

		const result = await callServiceInFormActions({
			serviceCall: async () => {
				return await TodoItemClient({
					token: locals.token,
					fetchApi: fetch
				}).addTodoItemDependencyTodoItem({
					...validation.data
				});
			},
			errorSchema: TodoItemAddDependency
		});

		return namedActionResult(result, 'addTodoItemDependency');
	}
} satisfies Actions;
