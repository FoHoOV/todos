<script lang="ts">
	import type { ActionData } from './$types';
	import FormInput from '$lib/components/forms/FormInput.svelte';
	import LoadingButton from '$lib/components/buttons/LoadingButton.svelte';
	import Error from '$components/Error.svelte';
	import { getFormErrors, superEnhance } from '$lib/enhance/form';
	import todos from '$lib/stores/todos';
	import { createTodoItemSchema } from './validator';
	import { page } from '$app/stores';

	export let form: ActionData;
	export let categoryId: number;

	let formElement: HTMLFormElement;

	$: formErrors = getFormErrors(form);
	let isAddTodoItemSubmitting = false;

	function resetForm() {
		formElement.reset();
		formErrors = { errors: undefined, message: undefined };
	}
</script>

<form
	action="/user/{$page.params.project_name}-{$page.params.project_id}/todos?/addTodo"
	use:superEnhance={{
		validator: { schema: createTodoItemSchema },
		form: form,
		action: 'addTodo'
	}}
	on:submitclienterror={(e) => {
		formErrors = {
			errors: e.detail,
			message: 'Invalid form, please review your inputs'
		};
	}}
	on:submitstarted={() => {
		isAddTodoItemSubmitting = true;
	}}
	on:submitended={() => {
		isAddTodoItemSubmitting = false;
	}}
	on:submitsucceeded={(e) => {
		todos.addTodo(e.detail.response);
		resetForm();
	}}
	bind:this={formElement}
	method="post"
	class="card flex w-full flex-row items-start justify-center bg-base-300"
>
	<div class="card-body items-center text-center">
		<Error message={formErrors?.message} />
		<FormInput class="hidden" type="hidden" name="is_done" value={false} errors={''} />
		<FormInput class="hidden" type="hidden" value={categoryId} name="category_id" errors={''} />
		<FormInput name="title" class="w-full" hideLabel={true} errors={formErrors?.errors?.title} />
		<FormInput
			name="description"
			class="w-full"
			hideLabel={true}
			errors={formErrors?.errors?.description}
		/>
		<div class="card-actions w-full justify-end">
			<LoadingButton text="add" class="flex-auto" type="submit" loading={isAddTodoItemSubmitting} />
			<LoadingButton text="reset" class="btn-warning" type="button" on:click={resetForm} />
		</div>
	</div>
</form>