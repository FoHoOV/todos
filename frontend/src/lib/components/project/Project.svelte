<script lang="ts" context="module">
	export type Feature = 'edit-project' | 'attach-to-user';
</script>

<script lang="ts">
	import { page } from '$app/stores';
	import Alert from '$components/Alert.svelte';
	import { callServiceInClient } from '$lib/client-wrapper/wrapper.client';
	import { ProjectClient } from '$lib/client-wrapper/clients';
	import type { Project } from '$lib/generated-client/models';
	import { faEdit, faTasks, faUser } from '@fortawesome/free-solid-svg-icons';
	import { createEventDispatcher } from 'svelte';
	import Fa from 'svelte-fa';
	import Spinner from '$components/Spinner.svelte';
	import { generateTodoListUrl } from '$lib/utils/params/route';
	import Confirm from '$components/Confirm.svelte';
	import projects from '$lib/stores/projects';

	export let project: Project;
	export let enabledFeatures: Feature[] | null = null;

	let state: 'calling-service' | 'none' = 'none';
	let apiErrorTitle: string | null;
	let confirmDetachProject: Confirm;

	const dispatch = createEventDispatcher<{
		editProject: { project: Project };
		attachToUser: { project: Project };
	}>();

	async function handleDetachProjectFromUser() {
		state = 'calling-service';
		await callServiceInClient({
			serviceCall: async () => {
				await ProjectClient({ token: $page.data.token }).detachFromUserProject({
					project_id: project.id
				});
				projects.deleteProject(project);
				state = 'none';
				apiErrorTitle = null;
			},
			errorCallback: async (e) => {
				apiErrorTitle = e.message;
				state = 'none';
			}
		});
	}

	function handleAttachToUser(event: MouseEvent) {
		dispatch('attachToUser', { project: project });
	}

	function handleEditProject(event: MouseEvent) {
		dispatch('editProject', { project: project });
	}
</script>

<div
	class="card relative border border-transparent border-opacity-10 bg-base-300 text-base-content transition-colors hover:border-primary"
>
	<div class="card-body">
		<Alert type="error" message={apiErrorTitle} />
		<Spinner visible={state === 'calling-service'}></Spinner>
		<Confirm bind:this={confirmDetachProject} on:onConfirm={handleDetachProjectFromUser}></Confirm>
		<div class="card-title justify-between">
			<div class="flex items-baseline gap-2">
				<div class="tooltip tooltip-info" data-tip="project id">
					<span class="text-info">#{project.id}</span>
				</div>
				<span class="break-words-legacy block max-w-full whitespace-normal break-words"
					>{project.title}</span
				>
			</div>
			<button
				on:click={handleEditProject}
				class:hidden={!enabledFeatures?.includes('edit-project')}
			>
				<Fa icon={faEdit} class="text-success" />
			</button>
		</div>
		<p class="max-w-full truncate hover:text-clip">{project.description}</p>

		<div class="stats grid-flow-row shadow lg:grid-flow-col">
			<div class="stat">
				<div class="stat-figure text-secondary">
					<Fa icon={faUser}></Fa>
				</div>
				<div class="stat-title">Accessed by</div>
				<div class="stat-value">{project.users.length}</div>
				<div class="stat-desc">
					{project.users.map((user) => user.username).join(', ')}
				</div>
			</div>

			<div class="stat">
				<div class="stat-figure text-secondary">
					<Fa icon={faTasks} />
				</div>
				<div class="stat-title">Status</div>
				<div class="stat-value">
					{project.done_todos_count}/{project.done_todos_count + project.pending_todos_count} done
				</div>
				<div class="stat-desc"></div>
			</div>
		</div>

		<div class="card-actions justify-end pt-3">
			<button
				class="btn btn-success flex-1"
				class:hidden={!enabledFeatures?.includes('attach-to-user')}
				on:click={handleAttachToUser}
			>
				Attach to user
			</button>
			<button class="btn btn-error flex-1" on:click={() => confirmDetachProject.show()}>
				{#if project.users.length == 1}
					Delete
				{:else}
					Detach
				{/if}
			</button>
			<a class="btn btn-info flex-1" href={generateTodoListUrl(project.title, project.id)}>
				Show todos
			</a>
		</div>
	</div>
</div>
