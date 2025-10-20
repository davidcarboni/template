import z from "zod";

// ID formats:
// client-1728423236057-u88qsh
// recordCard-1728423281088-1i60i
// inspo-1716286482259-lp38e
// restock-1750538829214-1srun
const idRegex = /^(user)-[a-zA-Z0-9-]+$/;

// Exported ID schemas

export const IdSchema = z.string().regex(idRegex, {
  message: 'Invalid item ID format',
});

export const UserIdSchema = IdSchema.refine(val => {
  return val.startsWith('user-');
}, {
  message: 'Invalid user ID',
});
