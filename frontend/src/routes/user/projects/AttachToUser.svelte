<script lang="ts">
	import type { ActionData } from './$types';
	import FormInput from '$lib/components/forms/FormInput.svelte';
	import LoadingButton from '$lib/components/buttons/LoadingButton.svelte';
	import Alert from '$components/Alert.svelte';
	import { getFormErrors, superEnhance } from '$lib/actions/form';
	import { attachProjectSchema } from './validator';
	import { invalidate } from '$app/navigation';

	export let form: ActionData;
	export let projectId: number | undefined;

	let formElement: HTMLFormElement;
	let state: 'submitting' | 'submit-successful' | 'none' = 'none';

	$: formErrors = getFormErrors(form);

	function resetForm() {
		formElement.reset();
		formErrors = { errors: undefined, message: undefined };
		state = 'none';
	}
</script>

<form
	action="/user/projects?/attach"
	use:superEnhance={{
		validator: { schema: attachProjectSchema },
		form: form,
		action: 'attach'
	}}
	on:submitclienterror={(e) => {
		formErrors = {
			errors: e.detail,
			message: 'Invalid form, please review your inputs'
		};
		state = 'none';
	}}
	on:submitstarted={() => {
		state = 'submitting';
	}}
	on:submitended={() => {
		state = 'none';
	}}
	on:submitsucceeded={async (e) => {
		// based on docs and on how invalidate works this doesn't do ssa.reverse()
		await invalidate('/user/projects'); // TODO: use stores/runes later
		resetForm();
		state = 'submit-successful';
	}}
	bind:this={formElement}
	method="post"
	class="card flex w-full flex-row items-start justify-center bg-base-300"
>
	<div class="card-body items-center text-center">
		<Alert
			class="mb-1"
			type="success"
			message={state == 'submit-successful' ? 'project has successfully attached to user!' : ''}
		/>
		<Alert class="mb-1" type="error" message={formErrors?.message} />
		<FormInput
			name="project_id"
			class="w-full"
			hideLabel={true}
			value={projectId}
			errors={''}
			type="hidden"
		/>
		<FormInput
			name="username"
			class="w-full"
			autoFocus={true}
			errors={formErrors?.errors?.username}
		/>
		<div class="card-actions mt-1 w-full justify-end">
			<LoadingButton text="reset" class="btn-warning flex-1" type="button" on:click={resetForm} />
			<LoadingButton
				text="attach"
				class="btn-success flex-1"
				type="submit"
				loading={state == 'submitting'}
			/>
		</div>
	</div>
</form>
