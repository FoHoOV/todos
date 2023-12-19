import type { z } from 'zod';
import {
	callService,
	ErrorType,
	handleUnauthenticatedUser,
	type ServiceCallOptions,
	type ServiceError
} from './wrapper.universal';
import { superFail } from '$lib/actions';
import type { RequiredProperty } from '../utils';

export async function superApplyAction<TErrorSchema extends z.AnyZodObject>(
	e: ServiceError<TErrorSchema>
) {
	switch (e.type) {
		case ErrorType.API_ERROR:
			return superFail(e.status, {
				message: e.message,
				error: { code: e.code, message: e.message }
			});
		case ErrorType.VALIDATION_ERROR:
			return superFail(400, { message: e.message, error: e.validationError });
		case ErrorType.NOT_AUTHENTICATED:
			return (await handleUnauthenticatedUser()) as never;
		case ErrorType.PRE_REQUEST_FAILURE:
		case ErrorType.SERVICE_DOWN_ERROR:
			return superFail(e.status, { message: e.message });
		default:
			throw e.originalError;
	}
}

export async function callServiceInFormActions<
	TServiceCallResult extends Promise<unknown>,
	TErrorSchema extends z.AnyZodObject
>({
	serviceCall,
	errorSchema
}: ServiceCallOptions<
	TServiceCallResult,
	TErrorSchema,
	ReturnType<typeof superApplyAction<TErrorSchema>>
>): Promise<
	| { success: true; response: Awaited<TServiceCallResult>; error: never }
	| Awaited<ReturnType<typeof superApplyAction<TErrorSchema>>>
>;
export async function callServiceInFormActions<
	TServiceCallResult extends Promise<unknown>,
	TErrorSchema extends z.AnyZodObject,
	TErrorCallbackResult extends Promise<unknown>
>({
	serviceCall,
	errorSchema,
	errorCallback
}: RequiredProperty<
	ServiceCallOptions<TServiceCallResult, TErrorSchema, TErrorCallbackResult>,
	'errorCallback'
>): Promise<
	{ success: true; response: Awaited<TServiceCallResult>; error: never } | TErrorCallbackResult
>;
export async function callServiceInFormActions<
	TServiceCallResult extends Promise<unknown>,
	TErrorSchema extends z.AnyZodObject,
	TErrorCallbackResult extends Promise<unknown>
>({
	serviceCall,
	errorSchema,
	errorCallback = async (e) => {
		return await superApplyAction(e);
	}
}: ServiceCallOptions<
	TServiceCallResult,
	TErrorSchema,
	TErrorCallbackResult | ReturnType<typeof superApplyAction<TErrorSchema>>
>) {
	const result = await callService({
		serviceCall: serviceCall,
		errorSchema: errorSchema,
		errorCallback: errorCallback
	});

	if (result.success) {
		return result;
	} else {
		return result.error;
	}
}
