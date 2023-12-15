import { fail } from '@sveltejs/kit';
import type { NumberRange, ErrorMessage, StrictUnion } from '$lib/utils/types';

export function convertFormDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
	const result: Record<string, FormDataEntryValue> = {};
	formData.forEach((value, key) => {
		result[key] = value;
	});
	return result;
}

export type FailedActionProps<T> = {
	message: ErrorMessage;
	error?: T;
};

export function getFormErrors<
	Form extends { error?: TError | undefined; message?: ErrorMessage | undefined } | null,
	TError = NonNullable<Form>['error']
>(form: Form) {
	return {
		errors: form?.error as StrictUnion<TError> | undefined,
		message: form?.message
	};
}

export function failedActionData({ message }: FailedActionProps<never>): {
	message: ErrorMessage;
	error: never;
};
export function failedActionData<T>({ message, error }: FailedActionProps<T>): {
	message: ErrorMessage;
	error: T;
};
export function failedActionData<T>({ message, error }: FailedActionProps<T>) {
	return { message, error };
}

export function namedActionResult<T extends { success: true } | object, Key extends string>(
	result: T,
	key: Key
): T extends { success: true } ? { [x in Key]: Extract<T, { success: true }> } : T {
	if ('success' in result && Object.hasOwn(result, 'success') && result['success'] === true) {
		return { [key]: result } as any;
	}
	return result as any;
}

export function superFail<T = never>(
	status: NumberRange<400, 600>,
	{ message, error }: FailedActionProps<T>
) {
	return fail(status, failedActionData({ message, error }));
}
