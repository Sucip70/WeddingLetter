import { describe, expect, it } from 'vitest';
import { templateUpdateSchema } from './admin.dto.js';

describe('home showcase settings', () => {
  it('supports explicit selection, removal, and ordering', () => {
    expect(templateUpdateSchema.parse({ showOnHome: true, homeOrder: 4 })).toEqual({ showOnHome: true, homeOrder: 4 });
    expect(templateUpdateSchema.parse({ showOnHome: false })).toEqual({ showOnHome: false });
  });
  it('does not overwrite settings in older or partial publisher payloads', () => {
    expect(templateUpdateSchema.parse({ price: 50000 })).toEqual({ price: 50000 });
  });
  it.each([-1, 1.5, 10000, '2'])('rejects invalid ordering: %s', (homeOrder) => {
    expect(templateUpdateSchema.safeParse({ homeOrder }).success).toBe(false);
  });
});
