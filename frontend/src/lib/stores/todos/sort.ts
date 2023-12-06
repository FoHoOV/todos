import type { TodoCategory, TodoItem } from '$lib/generated-client/models';

export function getTodoItemLeftId(todo: TodoItem) {
	return todo.order?.left_id ?? null;
}

export function setTodoItemLeftId(todo: TodoItem, leftId: number | null) {
	todo.order = { right_id: null, ...todo.order, left_id: leftId };
}

export function getTodoItemRightId(todo: TodoItem) {
	return todo.order?.right_id ?? null;
}

export function setTodoItemRightId(todo: TodoItem, rightId: number | null) {
	todo.order = { left_id: null, ...todo.order, right_id: rightId };
}

export function getTodoCategoryLeftId(todoCategory: TodoCategory) {
	return todoCategory.orders.length === 1 ? todoCategory.orders[0].left_id : null;
}

export function setTodoCategoryLeftId(todoCategory: TodoCategory, leftId: number | null) {
	const existingOrder = todoCategory.orders.length > 0 ? { ...todoCategory.orders[0] } : {};
	todoCategory.orders = [{ right_id: null, ...existingOrder, left_id: leftId }];
}

export function getTodoCategoryRightId(todoCategory: TodoCategory) {
	return todoCategory.orders.length === 1 ? todoCategory.orders[0].right_id : null;
}
export function setTodoCategoryRightId(todoCategory: TodoCategory, rightId: number | null) {
	const existingOrder = todoCategory.orders.length > 0 ? { ...todoCategory.orders[0] } : {};
	todoCategory.orders = [{ left_id: null, ...existingOrder, right_id: rightId }];
}
export function sortedTodos(todos: TodoItem[]) {
	sortById(todos);
	return sortByCustomOrder(todos, getTodoItemLeftId, getTodoItemRightId);
}

export function sortedCategories(categories: TodoCategory[]) {
	sortById(categories);
	return sortByCustomOrder(categories, getTodoCategoryLeftId, getTodoCategoryRightId);
}

export function sortByCustomOrder<T extends { id: number }>(
	elements: (T | null)[],
	getLeftId: (element: T) => number | null,
	getRightId: (element: T) => number | null
) {
	const MAX_NUMBER_OF_REASONABLE_ITERATIONS = elements.length * elements.length * elements.length;
	// improve later
	let index = 0;
	let mutations = 0;
	let numberOfIterations = 0;
	//let movedElementIds: number[] = [];

	const increaseIndex = () => {
		index += 1;
		if (index >= elements.length && mutations > 0) {
			// if the list had mutations it is not sorted yet
			// mutations should be 0 when the list is sorted
			index = 0;
			mutations = 0;
			//movedElementIds = [];
		}
	};

	const moveOtherToLeftOfCurrent = (
		currentIndex: number,
		leftElementIndex: number,
		leftId: number
	) => {
		if (elements[currentIndex == 0 ? currentIndex : currentIndex - 1]?.id === leftId) {
			return;
		}
		const savedLeftElement = elements[leftElementIndex];
		elements[leftElementIndex] = null;
		elements.splice(currentIndex, 0, savedLeftElement);
		mutations += 1;
		//movedElementIds.push(nextId);
	};

	const moveOtherToRightOfCurrent = (
		currentIndex: number,
		rightElementIndex: number,
		rightId: number
	) => {
		if (
			elements[currentIndex == elements.length - 1 ? currentIndex : currentIndex + 1]?.id ===
			rightId
		) {
			return;
		}
		const savedNextElement = elements[rightElementIndex];
		elements[rightElementIndex] = null;
		elements.splice(currentIndex + 1, 0, savedNextElement);
		mutations += 1;
		//movedElementIds.push(nextId);
	};

	const updateNumberOfIterations = () => {
		numberOfIterations += 1;
		if (numberOfIterations > MAX_NUMBER_OF_REASONABLE_ITERATIONS) {
			throw new Error('reached maximum number of iterations');
		}
	};

	while (index < elements.length) {
		updateNumberOfIterations();

		const element = elements[index];

		if (element === null) {
			increaseIndex();
			continue;
		}

		const rightId = getRightId(element);

		if (rightId !== null) {
			const rightElementIndex = elements.findIndex((value) => value?.id == rightId);

			if (rightElementIndex === -1) {
				throw new Error(`could't find next element with id = ${rightId}`);
			}

			if (rightId == element.id) {
				throw new Error('database error: for some reason element.rightId = element.id');
			}

			moveOtherToRightOfCurrent(index, rightElementIndex, rightId);
		}

		const leftId = getLeftId(element);

		if (leftId !== null) {
			const leftElementIndex = elements.findIndex((value) => value?.id == leftId);

			if (leftElementIndex === -1) {
				throw new Error(`could't find next element with id = ${leftId}`);
			}

			if (leftId == element.id) {
				throw new Error('database error: for some reason element.leftId = element.id');
			}

			moveOtherToLeftOfCurrent(index, leftElementIndex, leftId);
		}

		increaseIndex();
	}

	return elements.filter((element) => element != null) as T[];
}

export function sortById(elements: { id: number }[]) {
	elements.sort((a, b) => {
		return b.id - a.id;
	});
}

export function updateElementSort<T extends { id: number }>(
	elements: T[],
	movingElementId: number,
	movingElementNewOrder: {
		rightId: number | null;
		leftId: number | null;
	},
	getLeftId: (element: T) => number | null,
	getRightId: (element: T) => number | null,
	setLeftId: (element: T, leftId: number | null) => void,
	setRightId: (element: T, rightId: number | null) => void
) {
	console.log(JSON.stringify(elements));

	const movingElement = elements.find((value) => value.id == movingElementId);

	if (!movingElement) {
		throw new Error('moving element not found in dataset');
	}

	removeElementFromSortedList(
		elements,
		movingElementId,
		getLeftId,
		getRightId,
		setLeftId,
		setRightId
	);
	const elementPointingTonNewLeft = elements.find(
		(element) => getLeftId(element) == movingElementNewOrder.leftId
	);
	const elementPointingToNewRight = elements.find(
		(element) => getRightId(element) == movingElementNewOrder.rightId
	);

	if (elementPointingTonNewLeft) {
		setLeftId(elementPointingTonNewLeft, movingElementId);
	}

	if (elementPointingToNewRight) {
		setRightId(elementPointingToNewRight, movingElementId);
	}

	setLeftId(movingElement, movingElementNewOrder.leftId);
	setRightId(movingElement, movingElementNewOrder.rightId);

	console.log(JSON.stringify(elements));
}

export function removeElementFromSortedList<T extends { id: number }>(
	elements: T[],
	deletingElementId: number,
	getLeftId: (element: T) => number | null,
	getRightId: (element: T) => number | null,
	setLeftId: (element: T, leftId: number | null) => void,
	setRightId: (element: T, rightId: number | null) => void
) {
	console.log(JSON.stringify(elements));

	const deletingElement = elements.find((value) => value.id == deletingElementId);

	if (!deletingElement) {
		throw new Error('deletingElement element not found in dataset');
	}

	if (getLeftId(deletingElement)) {
		const elementPointingToNewLeft = elements.find(
			(element) => getLeftId(element) == getLeftId(deletingElement)
		);
		if (elementPointingToNewLeft) {
			setLeftId(elementPointingToNewLeft, getLeftId(deletingElement));
		}
	}

	if (getRightId(deletingElement)) {
		const elementPointingToNewRight = elements.find(
			(element) => getRightId(element) == getRightId(deletingElement)
		);
		if (elementPointingToNewRight) {
			setRightId(elementPointingToNewRight, getRightId(deletingElement));
		}
	}

	console.log(JSON.stringify(elements));
}
