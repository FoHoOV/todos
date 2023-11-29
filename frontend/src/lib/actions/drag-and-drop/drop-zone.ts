import type { ActionReturn } from 'svelte/action';

export type DropEvent<Data extends object> = CustomEvent<{ data: Data; names: string[] }>;
export type CustomDragEvent = CustomEvent<{
	names: string[];
	node: HTMLElement;
	originalEvent: DragEvent;
}>;
export type DropZoneOptions<Data extends object> = Partial<DataTransfer> & {
	highlighClasses?: string[];
	model: Data; // I have to w8 for svelte5 for native ts support in markup
	names: string[];
	disabled?: boolean;
};

export type DropZoneEvents<Data extends object> = {
	'on:dropped': (event: DropEvent<Data>) => void;
	'on:dragEntered'?: (event: CustomDragEvent) => void;
	'on:dragLeft'?: (event: CustomDragEvent) => void;
};

export function dropzone<Data extends object>(
	node: HTMLElement,
	options: DropZoneOptions<Data>
): ActionReturn<DropZoneOptions<Data>, DropZoneEvents<Data>> {
	_setOptionsDefaults(options);

	node.dataset.dropZoneNames = JSON.stringify(options.names);

	function handleDragEnter(event: DragEvent) {
		if (!_checkIfIsInSameDropZoneName(node, event, options) || options.disabled) {
			return;
		}

		if (!node.contains(event.target as HTMLElement)) {
			return;
		}

		node.classList.add(...(options.highlighClasses as string[]));
		node.dispatchEvent(
			new CustomEvent('dragEntered', {
				detail: {
					originalEvent: event,
					node: node,
					names: _getMatchingDropZoneNames(event, options)
				}
			}) as CustomDragEvent
		);
	}

	function handleDragLeave(event: DragEvent) {
		if (!_checkIfIsInSameDropZoneName(node, event, options) || options.disabled) {
			return;
		}

		if (
			!(event.target as HTMLElement).contains(node) &&
			event.relatedTarget &&
			node.contains(event.relatedTarget as HTMLElement)
		) {
			return;
		}

		node.classList.remove(...(options.highlighClasses as string[]));
		node.dispatchEvent(
			new CustomEvent('dragLeft', {
				detail: {
					originalEvent: event,
					node: node,
					names: _getMatchingDropZoneNames(event, options)
				}
			}) as CustomDragEvent
		);
	}

	function handleDragOver(event: DragEvent) {
		if (!_checkIfIsInSameDropZoneName(node, event, options) || options.disabled) {
			return;
		}

		event.preventDefault();
		if (!event.dataTransfer) {
			return;
		}

		event.dataTransfer.dropEffect = options.dropEffect!;
	}

	function handleDrop(event: DragEvent) {
		if (!_checkIfIsInSameDropZoneName(node, event, options) || options.disabled) {
			return;
		}

		event.preventDefault();

		if (!event.dataTransfer) {
			return;
		}

		const data = event.dataTransfer.getData('text/plain');
		node.classList.remove(...(options.highlighClasses as string[]));
		node.dispatchEvent(
			new CustomEvent('dropped', {
				detail: {
					data: JSON.parse(data),
					names: _getMatchingDropZoneNames(event, options)
				}
			}) as DropEvent<Data>
		);
	}

	node.addEventListener('dragenter', handleDragEnter);
	node.addEventListener('dragleave', handleDragLeave);
	node.addEventListener('dragover', handleDragOver);
	node.addEventListener('drop', handleDrop);

	return {
		update(newOptions) {
			options = newOptions;
			_setOptionsDefaults(options);
		},
		destroy() {
			node.removeEventListener('dragenter', handleDragEnter);
			node.removeEventListener('dragleave', handleDragLeave);
			node.removeEventListener('dragover', handleDragOver);
			node.removeEventListener('drop', handleDrop);
		}
	};
}

function _setOptionsDefaults<Data extends object>(options: DropZoneOptions<Data>) {
	if (options.highlighClasses === undefined) {
		options.highlighClasses = ['!border', '!rounded-2xl', '!border-success'];
	}

	if (!options.dropEffect) {
		options.dropEffect = 'move';
	}

	if (options.disabled === undefined) {
		options.disabled = false;
	}
}

const _dropZoneNamePrefixUUID =
	`draggable_action_${crypto.randomUUID()}_DropZoneTargetSymbol_`.toLowerCase();

export function generateDropZoneTargetNames(names: string[]) {
	return `${_dropZoneNamePrefixUUID}:${JSON.stringify(names)}`.toLowerCase();
}

export function getDropZoneNames(event: DragEvent) {
	const types = event.dataTransfer?.types;

	if (!types || types.length == 0) {
		throw new Error('DragEvent.dataTransfer.types cannot be empty or null');
	}

	const targetType = types.find((value) => value.startsWith(_dropZoneNamePrefixUUID));
	if (!targetType) {
		throw new Error('this node is not a dropzone created by this action');
	}

	const splitted = targetType.split(':');
	if (splitted.length != 2) {
		throw new Error('types is not correctly set in dataTransfer');
	}

	const eventTargetDropZoneNames: string[] = JSON.parse(splitted[1]);
	return eventTargetDropZoneNames;
}

function _getMatchingDropZoneNames<Data extends object>(
	event: DragEvent,
	options: DropZoneOptions<Data>
): string[] {
	const matchingTargetZones = options.names.filter((nodeTargetZoneName) => {
		return (
			getDropZoneNames(event).find(
				(eventTargetName) => eventTargetName.toLowerCase() == nodeTargetZoneName.toLowerCase()
			) !== undefined
		);
	});
	return matchingTargetZones;
}

function _existInDropZoneTargetNames<Data extends object>(
	event: DragEvent,
	options: DropZoneOptions<Data>
): boolean {
	try {
		return _getMatchingDropZoneNames(event, options).length > 0;
	} catch (e) {
		return false;
	}
}

function _checkIfIsInSameDropZoneName<Data extends object>(
	node: HTMLElement,
	event: DragEvent,
	options: DropZoneOptions<Data>
) {
	return (
		node.dataset.dropZoneNames === JSON.stringify(options.names) &&
		_existInDropZoneTargetNames(event, options)
	);
}
