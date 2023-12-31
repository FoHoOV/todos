import { writable } from 'svelte/store';
import type {
	NullableOrderedItem,
	TodoItemPartialTag,
	TodoCategory,
	TodoCategoryPartialTodoItem,
	TodoItemPartialDependency
} from '$lib/generated-client/models';
import {
	getLastTodoCategoryInSortedListExceptCurrent,
	getLastTodoItemInSortedListExceptCurrent,
	getTodoCategoryRightId,
	setTodoCategoryRightId,
	setTodoItemLeftId
} from './sort';
import {
	sortedTodos,
	getTodoItemRightId,
	setTodoItemRightId,
	updateElementSort,
	sortedCategories,
	getTodoCategoryLeftId,
	setTodoCategoryLeftId,
	getTodoItemLeftId,
	removeElementFromSortedList
} from './sort';

const { set: _set, subscribe, update: _update } = writable<TodoCategory[]>([]);

const addTodo = (todo: TodoCategoryPartialTodoItem, skipSort = false): void => {
	_update((categories) => {
		return categories.map<TodoCategory>((category) => {
			if (category.id !== todo.category_id) {
				return category;
			}
			category.items.push(todo);

			updateElementSort(
				category.items,
				todo.id,
				{
					leftId: getLastTodoItemInSortedListExceptCurrent(category.items, todo.id)?.id ?? null,
					rightId: null
				},
				getTodoItemLeftId,
				getTodoItemRightId,
				setTodoItemLeftId,
				setTodoItemRightId
			);

			if (!skipSort) {
				category.items = sortedTodos(category.items);
			}

			return category;
		});
	});
};

const removeTodo = (
	todo: TodoCategoryPartialTodoItem,
	removeDependencies = true,
	skipSort = false
) => {
	_update((categories) => {
		return categories.map<TodoCategory>((category) => {
			if (removeDependencies) {
				category.items = category.items.map((item) => {
					item.dependencies = item.dependencies.filter((dependency) => {
						return dependency.dependant_todo_id !== todo.id;
					});
					return item;
				});
			}

			if (category.id !== todo.category_id) {
				return category;
			}

			removeElementFromSortedList(
				category.items,
				todo.id,
				getTodoItemLeftId,
				getTodoItemRightId,
				setTodoItemLeftId,
				setTodoItemRightId
			);

			if (!skipSort) {
				category.items = sortedTodos(category.items.filter((value) => value.id !== todo.id));
			}

			return category;
		});
	});
};

const updateTodo = (todo: TodoCategoryPartialTodoItem, skipSort = false) => {
	_update((categories) => {
		return categories.map<TodoCategory>((category) => {
			if (category.id !== todo.category_id) {
				return category;
			}
			category.items = category.items.map((value) => {
				if (value.id !== todo.id) {
					return value;
				}
				return todo;
			});

			if (!skipSort) {
				category.items = sortedTodos(category.items);
			}

			return category;
		});
	});
};

const addDependency = (todoId: number, dependency: TodoItemPartialDependency) => {
	_update((categories) => {
		return categories.map((category) => {
			category.items.forEach((todo) => {
				if (todo.id !== todoId) {
					return todo;
				}
				todo.dependencies.push(dependency);
				return todo;
			});
			return category;
		});
	});
};

const removeDependency = (todoId: number, dependency: TodoItemPartialDependency) => {
	_update((categories) => {
		return categories.map((category) => {
			category.items.forEach((todo) => {
				if (todo.id !== todoId) {
					return todo;
				}
				todo.dependencies = todo.dependencies.filter((value) => value.id != dependency.id);
				return todo;
			});
			return category;
		});
	});
};

const addTag = (todoId: number, tag: TodoItemPartialTag) => {
	_update((categories) => {
		return categories.map((category) => {
			category.items.forEach((todo) => {
				if (todo.id !== todoId) {
					return todo;
				}
				todo.tags.unshift(tag);
				return todo;
			});
			return category;
		});
	});
};

const detachTag = (todoId: number, tag: TodoItemPartialTag) => {
	_update((categories) => {
		return categories.map((category) => {
			category.items.forEach((todo) => {
				if (todo.id !== todoId) {
					return todo;
				}
				todo.tags = todo.tags.filter((value) => value.id !== tag.id);
				return todo;
			});
			return category;
		});
	});
};

const deleteTag = (tag: TodoItemPartialTag) => {
	_update((categories) => {
		return categories.map((category) => {
			category.items.forEach((todo) => {
				todo.tags = todo.tags.filter((value) => value.id !== tag.id);
				return todo;
			});
			return category;
		});
	});
};

const updateTag = (tag: TodoItemPartialTag) => {
	_update((categories) => {
		return categories.map((category) => {
			category.items.forEach((todo) => {
				todo.tags = todo.tags.map((value) => {
					if (value.id !== tag.id) {
						return value;
					}
					value.name = tag.name;
					return value;
				});
				return todo;
			});
			return category;
		});
	});
};

const increaseTodoCommentsCounter = (todoId: number) => {
	_update((categories) => {
		return categories.map((category) => {
			category.items.forEach((todo) => {
				if (todo.id !== todoId) {
					return todo;
				}
				todo.comments_count += 1;
				return todo;
			});
			return category;
		});
	});
};

const decreaseTodoCommentsCounter = (todoId: number) => {
	_update((categories) => {
		return categories.map((category) => {
			category.items.forEach((todo) => {
				if (todo.id !== todoId) {
					return todo;
				}
				todo.comments_count -= 1;
				return todo;
			});
			return category;
		});
	});
};

const updateTodoSort = (
	movingElement: TodoCategoryPartialTodoItem,
	movingElementNewCategoryId: number,
	newOrder: NonNullable<TodoCategoryPartialTodoItem['order']>,
	skipSort = false
) => {
	if (movingElement.category_id !== movingElementNewCategoryId) {
		removeTodo(movingElement, false);
		addTodo({ ...movingElement, category_id: movingElementNewCategoryId }, true);
		movingElement.category_id = movingElementNewCategoryId;
	}
	_update((categories) => {
		categories = categories.map<TodoCategory>((category) => {
			if (category.id !== movingElement.category_id) {
				return category;
			}
			updateElementSort(
				category.items,
				movingElement.id,
				{ leftId: newOrder.left_id, rightId: newOrder.right_id },
				getTodoItemLeftId,
				getTodoItemRightId,
				setTodoItemLeftId,
				setTodoItemRightId
			);

			if (!skipSort) {
				category.items = sortedTodos(category.items);
			}

			return category;
		});
		categories = sortedCategories(categories);
		return categories;
	});
};

const addCategory = (category: TodoCategory) => {
	_update((categories) => {
		category.items = sortedTodos(category.items);
		categories.push(category);
		updateElementSort(
			categories,
			category.id,
			{
				leftId: getLastTodoCategoryInSortedListExceptCurrent(categories, category.id)?.id ?? null,
				rightId: null
			},
			getTodoCategoryLeftId,
			getTodoCategoryRightId,
			setTodoCategoryLeftId,
			setTodoCategoryRightId
		);
		categories = sortedCategories(categories);
		return categories;
	});
};

const updateCategory = (category: TodoCategory) => {
	_update((categories) => {
		categories = categories.map<TodoCategory>((value) => {
			if (value.id !== category.id) {
				return value;
			}
			category.items = sortedTodos(category.items);
			return category;
		});
		categories = sortedCategories(categories);
		return categories;
	});
};

const removeCategory = (category: TodoCategory, removeDependencies = true) => {
	_update((categories) => {
		if (removeDependencies) {
			categories = categories.map((value) => {
				value.items = value.items.map((item) => {
					item.dependencies = item.dependencies.filter((dependency) => {
						return category.items.some((item) => item.id == dependency.dependant_todo_id);
					});
					return item;
				});
				return value;
			});
		}
		removeElementFromSortedList(
			categories,
			category.id,
			getTodoCategoryLeftId,
			getTodoCategoryRightId,
			setTodoCategoryLeftId,
			setTodoCategoryRightId
		);
		return categories.filter((value) => value.id !== category.id);
	});
};

const setTodoCategories = (categories: TodoCategory[]) => {
	_set(
		sortedCategories(
			categories.map((category) => {
				category.items = sortedTodos(category.items);
				return category;
			})
		)
	);
};

const clearTodoCategories = () => {
	_set([]);
};

const updateCategoriesSort = (
	movingElement: TodoCategory,
	newOrder: NonNullable<NullableOrderedItem>,
	skipSort = false
) => {
	_update((categories) => {
		updateElementSort(
			categories,
			movingElement.id,
			{ leftId: newOrder.left_id, rightId: newOrder.right_id },
			getTodoCategoryLeftId,
			getTodoCategoryRightId,
			setTodoCategoryLeftId,
			setTodoCategoryRightId
		);
		return skipSort ? categories : sortedCategories(categories);
	});
};

export default {
	setTodoCategories,
	addTodo,
	addTag,
	addCategory,
	addDependency,

	updateCategory,
	updateTodo,
	updateTag,
	updateTodoSort,
	updateCategoriesSort,
	increaseTodoCommentsCounter,
	decreaseTodoCommentsCounter,

	removeCategory,
	removeTodo,
	detachTag,
	deleteTag,
	removeDependency,

	clearTodoCategories,
	subscribe
};
