// __tests__/lib/utils.test.ts
import { cn } from '../../lib/utils';

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toContain('text-red-500');
    expect(result).toContain('bg-blue-500');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('handles undefined and null', () => {
    const result = cn('base-class', undefined, null);
    expect(result).toBe('base-class');
  });
});

