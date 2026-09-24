import { ApiError, intParam } from './api';
import { targetExists, type TargetType } from './community';

const TYPES: TargetType[] = ['build', 'owner', 'render', 'article'];

export function parseTarget(body: Record<string, unknown>, allowed: TargetType[] = TYPES): { type: TargetType; id: number } {
  const type = body.type as TargetType;
  if (!allowed.includes(type)) throw new ApiError(400, 'Invalid target type');
  const id = intParam(body.id, 'target id');
  if (!targetExists(type, id)) throw new ApiError(404, 'Not found');
  return { type, id };
}
