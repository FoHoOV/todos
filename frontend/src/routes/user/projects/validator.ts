import { z } from 'zod';
import type { ProjectAttachAssociation, ProjectCreate, ProjectUpdate } from '$lib/generated-client';

const optionalDescriptionSchema = z
	.string()
	.transform((t) => (t.length > 0 ? t : '-'))
	.pipe(z.string().min(1).max(100));

export const createProjectSchema = z.object({
	title: z
		.string()
		.min(2)
		.max(100)
		.refine((title) => !title.includes('-'), "'-' is not allowed in the project title"),
	description: optionalDescriptionSchema,
	create_from_default_template: z.boolean({ coerce: true }).default(false)
});

({}) as z.infer<typeof createProjectSchema> satisfies ProjectCreate;

export const attachProjectSchema = z.object({
	project_id: z.number({ coerce: true }),
	username: z.string().min(3)
});

({}) as z.infer<typeof attachProjectSchema> satisfies ProjectAttachAssociation;

export const editProjectSchema = createProjectSchema.extend({
	project_id: z.number({ coerce: true })
});

({}) as z.infer<typeof editProjectSchema> satisfies ProjectUpdate;
