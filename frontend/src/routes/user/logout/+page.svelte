<script lang="ts">
	import { page } from '$app/stores';
	import LoadingButton from '$lib/components/buttons/LoadingButton.svelte';
	import Alert from '$components/Alert.svelte';
	import { superEnhance } from '$lib/actions/form';

	let status: 'submitting' | 'none' = 'none';
</script>

<svelte:head>
	<title>logout</title>
</svelte:head>

<div class="flex flex-col items-center justify-center">
	<Alert type="error" message={$page.error?.message} />
	<h2>Are sure you are gonna miss out on this?</h2>
	<form
		method="post"
		use:superEnhance
		on:submitstarted={() => (status = 'submitting')}
		on:submitended={() => (status = 'none')}
	>
		<LoadingButton
			class="btn-warning btn-wide mt-2"
			text="Yes 👋🏾"
			loading={status === 'submitting'}
			type="submit"
		/>
	</form>
</div>
