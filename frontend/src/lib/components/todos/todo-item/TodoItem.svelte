<script lang="ts" context="module">
	import Alert from '$components/Alert.svelte';
	import Confirm from '$components/Confirm.svelte';
	import Spinner from '$components/Spinner.svelte';
	import TodoItemDependencies from './TodoItemDependencies.svelte';
	import TodoComments from './TodoComments.svelte';
	import TodoTags from './TodoTags.svelte';
	import CategoryInfo from '$components/todos/todo-item/CategoryInfo.svelte';
	import ProjectsInfo from '$components/todos/todo-item/ProjectsInfo.svelte';
	import Fa from 'svelte-fa';
	import Draggable from './Draggable.svelte';

	import {
		type StrictUnion,
		type TodoItem,
		type TodoCategoryPartialTodoItem,
		type CommonComponentStates,
		type TodoCategory,
		callServiceInClient,
		ErrorType
	} from '$lib';
	import {
		faEdit,
		faTrashCan,
		faCalendarCheck,
		faUser,
		faComment,
		faTags,
		faSitemap
	} from '@fortawesome/free-solid-svg-icons';
	import { multiStepModal } from '$lib/stores/multi-step-modal';
	import { page } from '$app/stores';
	import { TodoItemClient } from '$lib/client-wrapper/clients';
	import { toasts } from '$lib/stores/toasts';
	import type { Events as TodoDependencyEvents } from './TodoItemDependencies.svelte';
	import type { Events as TodoCommentEvents } from './TodoComments.svelte';
	import type { Events as TodoTagEvents } from './TodoTags.svelte';
	import { getTodosStoreFromContext } from '$components/todos/utils';

	export type Events = {
		onEditTodoItem?: (todo: StrictUnion<TodoItem | TodoCategoryPartialTodoItem>) => void;
	} & TodoDependencyEvents &
		TodoCommentEvents &
		TodoTagEvents;

	export type Props = {
		todo: StrictUnion<TodoItem | TodoCategoryPartialTodoItem>;
		category?: TodoCategory;
		draggable?: boolean;
		showProjectsInfo?: boolean;
		showCategoryInfo?: boolean;
	} & Events;
</script>

<script lang="ts">
	const {
		todo,
		category,
		draggable = true,
		showProjectsInfo = false,
		showCategoryInfo = false,
		...restProps
	} = $props<Props>();

	let apiErrorTitle = $state<string | null>(null);
	let componentState = $state<CommonComponentStates>('none');
	let confirmDeleteTodo = $state<Confirm | null>(null);

	const todoCategoriesStore = getTodosStoreFromContext();

	async function handleChangeDoneStatus(event: Event) {
		componentState = 'calling-service';
		const savedTodoStatus = todo.is_done;
		await callServiceInClient({
			serviceCall: async () => {
				const result = await TodoItemClient({ token: $page.data.token }).updateItemTodoItem({
					...todo,
					is_done: !savedTodoStatus
				});
				todoCategoriesStore?.updateTodo(result, draggable);
				if (result.is_done == savedTodoStatus) {
					toasts.addToast({
						type: 'warning',
						time: 9000,
						message: 'This category has a rule that prevents this item being marked as `UNDONE`'
					});
				}
				componentState = 'none';
				apiErrorTitle = null;
			},
			errorCallback: async (e) => {
				if (e.type == ErrorType.API_ERROR) {
					toasts.addToast({
						type: 'error',
						message: e.message,
						time: 6000
					});
				} else {
					apiErrorTitle = e.message;
				}
				(event.target as HTMLInputElement).checked = savedTodoStatus;
				componentState = 'none';
			}
		});
	}

	async function handleRemoveTodo() {
		componentState = 'calling-service';
		await callServiceInClient({
			serviceCall: async () => {
				await TodoItemClient({ token: $page.data.token }).removeTodoItem(todo);
				todoCategoriesStore?.removeTodo(todo);
				apiErrorTitle = null;
				componentState = 'none';
			},
			errorCallback: async (e) => {
				apiErrorTitle = e.message;
				componentState = 'none';
			}
		});
	}

	function handleShowDependencies() {
		multiStepModal.add({
			component: TodoItemDependencies,
			props: () => {
				return {
					todo: todo,
					onAddDependency: restProps.onAddDependency
				};
			},
			title: 'Manage your dependencies here'
		});
	}

	function handleShowComments() {
		multiStepModal.add({
			component: TodoComments,
			props: () => {
				return {
					todoId: todo.id,
					onCreateComment: restProps.onCreateComment,
					onEditComment: restProps.onEditComment
				};
			},
			title: 'Manage todo comments here'
		});
	}

	function handleShowTags() {
		multiStepModal.add({
			component: TodoTags,
			props: () => {
				return {
					todo: todo,
					onAddTag: restProps.onAddTag,
					onEditTag: restProps.onEditTag
				};
			},
			title: 'Manage your todo tags here'
		});
	}

	function _getDueDateClass(date: (typeof todo)['due_date']) {
		if (!date || todo.is_done) {
			return '';
		}

		const dueDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

		if (Date.now() > dueDate.getTime()) {
			return 'text-error';
		} else if (dueDate.getTime() - Date.now() < 1 * 24 * 60 * 60 * 1000) {
			return 'text-warning';
		} else {
			return 'text-success';
		}
	}
</script>

<Draggable {todo} {category} disabled={!draggable} onError={(message) => (apiErrorTitle = message)}>
	<div class="card h-full max-h-full bg-base-200 shadow-xl transition-colors hover:bg-base-300">
		<Spinner visible={componentState === 'calling-service'}></Spinner>

		<Confirm bind:this={confirmDeleteTodo} onConfirmed={handleRemoveTodo}></Confirm>
		<div class="card-body pb-4">
			<Alert type="error" message={apiErrorTitle} />

			<div class="card-title flex w-full justify-between">
				<div class="flex w-full items-baseline gap-2">
					<div class="tooltip tooltip-info" data-tip="todo id">
						<span class="text-lg font-bold text-info">#{todo.id}</span>
					</div>
					<h1 class="break-words-legacy block max-w-full whitespace-normal break-words">
						{todo.title}
					</h1>
				</div>
				<div class="flex items-center justify-center gap-2">
					<input
						type="checkbox"
						class="checkbox"
						class:checkbox-success={todo.is_done}
						class:checkbox-error={!todo.is_done}
						checked={todo.is_done}
						on:click={handleChangeDoneStatus}
					/>
					<button
						on:click={() => restProps.onEditTodoItem?.(todo)}
						class:hidden={!restProps.onEditTodoItem}
					>
						<Fa icon={faEdit} class="text-success" />
					</button>
					<button on:click={() => confirmDeleteTodo?.show()}>
						<Fa icon={faTrashCan} class="text-red-400" />
					</button>
				</div>
			</div>

			<p class="break-words-legacy whitespace-normal break-words">{todo.description}</p>

			<div class="flex items-center gap-2 py-2">
				<Fa icon={faCalendarCheck} class={_getDueDateClass(todo.due_date)}></Fa>
				{#if todo.due_date}
					<span class={_getDueDateClass(todo.due_date)}>{todo.due_date.toLocaleDateString()}</span>
				{:else}
					<span>-</span>
				{/if}
			</div>

			{#if showProjectsInfo}
				<ProjectsInfo {todo}></ProjectsInfo>
			{/if}

			{#if showCategoryInfo}
				<CategoryInfo {todo}></CategoryInfo>
			{/if}

			{#if todo.marked_as_done_by}
				<div class="flex items-center gap-2 self-end">
					<span>Completed by: </span>
					<div class="flex flex-row items-center gap-1.5">
						<span class="block rounded-full border border-dashed border-warning p-1.5">
							<Fa icon={faUser} />
						</span>

						<span class="text font-semibold text-success">{todo.marked_as_done_by?.username}</span>
					</div>
				</div>
			{/if}

			<div class="flex gap-2 self-end py-1">
				<div class="indicator self-end">
					<span class="badge indicator-item badge-secondary">{todo.comments_count}</span>
					<button class="btn btn-info btn-outline btn-sm" on:click={handleShowComments}>
						<Fa icon={faComment}></Fa>
						<span>comments</span>
					</button>
				</div>

				<div class="indicator self-end">
					<span class="badge indicator-item badge-secondary">{todo.tags.length}</span>
					<button class="btn btn-info btn-outline btn-sm" on:click={handleShowTags}>
						<Fa icon={faTags}></Fa>
						<span>tags</span>
					</button>
				</div>
			</div>

			<div class="flex gap-2 self-end">
				<div class="indicator col-start-2 self-end">
					<span class="badge indicator-item badge-secondary">{todo.dependencies.length}</span>
					<button class="btn btn-info btn-outline btn-sm" on:click={handleShowDependencies}>
						<Fa icon={faSitemap}></Fa>
						<span>dependencies</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</Draggable>
