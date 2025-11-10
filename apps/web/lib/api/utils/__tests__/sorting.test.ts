/**
 * Unit tests for sorting utilities
 */

import { parseSort, parseSortWithLegacy, orderByToString } from '../sorting';

describe('parseSort', () => {
  it('should parse single column', () => {
    const result = parseSort('name', 'asc');
    expect(result).toEqual([{ name: 'asc' }, { id: 'desc' }]);
  });

  it('should parse multiple columns', () => {
    const result = parseSort('name,createdAt', 'asc,desc');
    expect(result).toEqual([
      { name: 'asc' },
      { createdAt: 'desc' },
      { id: 'desc' }
    ]);
  });

  it('should use last direction for remaining columns', () => {
    const result = parseSort('name,createdAt,updatedAt', 'asc,desc');
    expect(result).toEqual([
      { name: 'asc' },
      { createdAt: 'desc' },
      { updatedAt: 'desc' },
      { id: 'desc' }
    ]);
  });

  it('should default to asc when dir omitted', () => {
    const result = parseSort('name,createdAt');
    expect(result).toEqual([
      { name: 'asc' },
      { createdAt: 'asc' },
      { id: 'desc' }
    ]);
  });

  it('should filter invalid columns with whitelist', () => {
    const result = parseSort(
      'name,malicious_column,id',
      'asc,desc,asc',
      ['name', 'id', 'createdAt']
    );
    expect(result).toEqual([
      { name: 'asc' },
      { id: 'asc' }
    ]);
  });

  it('should return default when no sort provided', () => {
    const result = parseSort(undefined, undefined, undefined, [{ createdAt: 'desc' }]);
    expect(result).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
  });

  it('should return default when empty string', () => {
    const result = parseSort('', undefined);
    expect(result).toEqual([{ id: 'desc' }]);
  });

  it('should handle whitespace in column names', () => {
    const result = parseSort(' name , createdAt ', ' asc , desc ');
    expect(result).toEqual([
      { name: 'asc' },
      { createdAt: 'desc' },
      { id: 'desc' }
    ]);
  });

  it('should handle invalid directions gracefully', () => {
    const result = parseSort('name,createdAt', 'invalid,desc');
    expect(result).toEqual([
      { name: 'asc' }, // Fallback to asc for invalid
      { createdAt: 'desc' },
      { id: 'desc' }
    ]);
  });

  it('should not add duplicate id if already present', () => {
    const result = parseSort('name,id', 'asc,desc');
    expect(result).toEqual([
      { name: 'asc' },
      { id: 'desc' }
    ]);
  });

  it('should handle id at the beginning', () => {
    const result = parseSort('id,name', 'asc,desc');
    expect(result).toEqual([
      { id: 'asc' },
      { name: 'desc' }
    ]);
  });

  it('should filter all columns when none match whitelist', () => {
    const result = parseSort(
      'invalid1,invalid2',
      'asc,desc',
      ['name', 'id']
    );
    expect(result).toEqual([{ id: 'desc' }]); // Falls back to default
  });
});

describe('parseSortWithLegacy', () => {
  it('should handle legacy enum value 0 (DateNewestFirst)', () => {
    const result = parseSortWithLegacy(0);
    expect(result).toEqual([{ id: 'desc' }]);
  });

  it('should handle legacy enum value 1 (DateOldestFirst)', () => {
    const result = parseSortWithLegacy(1);
    expect(result).toEqual([{ id: 'asc' }]);
  });

  it('should handle legacy enum value 2 (NameAZ)', () => {
    const result = parseSortWithLegacy(2);
    expect(result).toEqual([{ name: 'asc' }, { id: 'desc' }]);
  });

  it('should handle legacy enum value 3 (NameZA)', () => {
    const result = parseSortWithLegacy(3);
    expect(result).toEqual([{ name: 'desc' }, { id: 'desc' }]);
  });

  it('should handle legacy enum as string', () => {
    const result = parseSortWithLegacy('2');
    expect(result).toEqual([{ name: 'asc' }, { id: 'desc' }]);
  });

  it('should handle unknown enum value', () => {
    const result = parseSortWithLegacy(99);
    expect(result).toEqual([{ id: 'desc' }]); // Default
  });

  it('should handle column-based sort when not enum', () => {
    const result = parseSortWithLegacy('name', 'asc');
    expect(result).toEqual([{ name: 'asc' }, { id: 'desc' }]);
  });

  it('should handle column-based multi-column sort', () => {
    const result = parseSortWithLegacy('name,createdAt', 'asc,desc');
    expect(result).toEqual([
      { name: 'asc' },
      { createdAt: 'desc' },
      { id: 'desc' }
    ]);
  });

  it('should respect allowed columns in column-based mode', () => {
    const result = parseSortWithLegacy(
      'name,invalid',
      'asc,desc',
      ['name', 'id']
    );
    expect(result).toEqual([{ name: 'asc' }, { id: 'desc' }]);
  });
});

describe('orderByToString', () => {
  it('should convert single column to string', () => {
    const result = orderByToString([{ name: 'asc' }]);
    expect(result).toBe('name ASC');
  });

  it('should convert multiple columns to string', () => {
    const result = orderByToString([
      { name: 'asc' },
      { id: 'desc' }
    ]);
    expect(result).toBe('name ASC, id DESC');
  });

  it('should handle desc direction', () => {
    const result = orderByToString([
      { createdAt: 'desc' },
      { name: 'asc' }
    ]);
    expect(result).toBe('createdAt DESC, name ASC');
  });

  it('should handle empty array', () => {
    const result = orderByToString([]);
    expect(result).toBe('');
  });

  it('should handle three columns', () => {
    const result = orderByToString([
      { name: 'asc' },
      { createdAt: 'desc' },
      { id: 'desc' }
    ]);
    expect(result).toBe('name ASC, createdAt DESC, id DESC');
  });
});

describe('Multi-column sorting integration', () => {
  describe('Two-column combinations', () => {
    it('should handle name asc, id desc', () => {
      const result = parseSort('name,id', 'asc,desc');
      expect(result).toEqual([
        { name: 'asc' },
        { id: 'desc' }
      ]);
      expect(orderByToString(result)).toBe('name ASC, id DESC');
    });

    it('should handle name desc, id asc', () => {
      const result = parseSort('name,id', 'desc,asc');
      expect(result).toEqual([
        { name: 'desc' },
        { id: 'asc' }
      ]);
      expect(orderByToString(result)).toBe('name DESC, id ASC');
    });

    it('should handle createdAt desc, name asc', () => {
      const result = parseSort('createdAt,name', 'desc,asc');
      expect(result).toEqual([
        { createdAt: 'desc' },
        { name: 'asc' },
        { id: 'desc' }
      ]);
    });

    it('should handle both columns ascending', () => {
      const result = parseSort('name,createdAt', 'asc,asc');
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'asc' },
        { id: 'desc' }
      ]);
    });

    it('should handle both columns descending', () => {
      const result = parseSort('name,createdAt', 'desc,desc');
      expect(result).toEqual([
        { name: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' }
      ]);
    });
  });

  describe('Three-column combinations', () => {
    it('should handle createdAt desc, name asc, id desc', () => {
      const result = parseSort('createdAt,name,id', 'desc,asc,desc');
      expect(result).toEqual([
        { createdAt: 'desc' },
        { name: 'asc' },
        { id: 'desc' }
      ]);
      expect(orderByToString(result)).toBe('createdAt DESC, name ASC, id DESC');
    });

    it('should handle all three ascending', () => {
      const result = parseSort('name,createdAt,updatedAt', 'asc,asc,asc');
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'asc' },
        { updatedAt: 'asc' },
        { id: 'desc' }
      ]);
    });

    it('should handle all three descending', () => {
      const result = parseSort('name,createdAt,updatedAt', 'desc,desc,desc');
      expect(result).toEqual([
        { name: 'desc' },
        { createdAt: 'desc' },
        { updatedAt: 'desc' },
        { id: 'desc' }
      ]);
    });

    it('should handle mixed directions', () => {
      const result = parseSort('name,createdAt,updatedAt', 'asc,desc,asc');
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'desc' },
        { updatedAt: 'asc' },
        { id: 'desc' }
      ]);
    });
  });

  describe('Four-column combinations', () => {
    it('should handle four columns with mixed directions', () => {
      const result = parseSort(
        'name,createdAt,updatedAt,ownerId',
        'asc,desc,asc,desc'
      );
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'desc' },
        { updatedAt: 'asc' },
        { ownerId: 'desc' },
        { id: 'desc' }
      ]);
    });

    it('should handle four columns with only two directions (reuse last)', () => {
      const result = parseSort(
        'name,createdAt,updatedAt,ownerId',
        'asc,desc'
      );
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'desc' },
        { updatedAt: 'desc' },
        { ownerId: 'desc' },
        { id: 'desc' }
      ]);
    });
  });

  describe('Direction count edge cases', () => {
    it('should handle more directions than columns', () => {
      const result = parseSort('name,createdAt', 'asc,desc,asc,desc');
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'desc' },
        { id: 'desc' }
      ]);
    });

    it('should handle single direction for multiple columns', () => {
      const result = parseSort('name,createdAt,updatedAt', 'desc');
      expect(result).toEqual([
        { name: 'desc' },
        { createdAt: 'desc' },
        { updatedAt: 'desc' },
        { id: 'desc' }
      ]);
    });

    it('should handle no direction for multiple columns', () => {
      const result = parseSort('name,createdAt,updatedAt');
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'asc' },
        { updatedAt: 'asc' },
        { id: 'desc' }
      ]);
    });
  });

  describe('Whitelist filtering with multi-column', () => {
    it('should filter out invalid columns from middle', () => {
      const result = parseSort(
        'name,invalidCol,createdAt',
        'asc,desc,asc',
        ['name', 'createdAt', 'id']
      );
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'asc' },
        { id: 'desc' }
      ]);
    });

    it('should filter out multiple invalid columns', () => {
      const result = parseSort(
        'name,badCol1,createdAt,badCol2,id',
        'asc,desc,asc,desc,asc',
        ['name', 'createdAt', 'id']
      );
      expect(result).toEqual([
        { name: 'asc' },
        { createdAt: 'asc' },
        { id: 'asc' }
      ]);
    });

    it('should preserve only valid columns and maintain their order', () => {
      const result = parseSort(
        'malicious,name,dangerous,createdAt',
        'asc,desc,asc,desc',
        ['name', 'createdAt', 'updatedAt', 'id']
      );
      expect(result).toEqual([
        { name: 'desc' },
        { createdAt: 'desc' },
        { id: 'desc' }
      ]);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle typical tag sorting (name asc, id desc)', () => {
      const result = parseSort(
        'name,id',
        'asc,desc',
        ['name', 'id', 'createdAt']
      );
      expect(result).toEqual([
        { name: 'asc' },
        { id: 'desc' }
      ]);
    });

    it('should handle collection sorting (createdAt desc, name asc)', () => {
      const result = parseSort(
        'createdAt,name',
        'desc,asc',
        ['name', 'createdAt', 'id']
      );
      expect(result).toEqual([
        { createdAt: 'desc' },
        { name: 'asc' },
        { id: 'desc' }
      ]);
    });

    it('should handle user sorting (name asc, email asc, id asc)', () => {
      const result = parseSort(
        'name,email,id',
        'asc,asc,asc',
        ['name', 'email', 'id']
      );
      expect(result).toEqual([
        { name: 'asc' },
        { email: 'asc' },
        { id: 'asc' }
      ]);
    });
  });

  describe('Stability and consistency', () => {
    it('should produce same result when called multiple times', () => {
      const result1 = parseSort('name,createdAt', 'asc,desc');
      const result2 = parseSort('name,createdAt', 'asc,desc');
      expect(result1).toEqual(result2);
    });

    it('should always include id for cursor stability', () => {
      const result1 = parseSort('name');
      const result2 = parseSort('name,createdAt');
      const result3 = parseSort('name,createdAt,updatedAt');

      expect(result1.some(obj => 'id' in obj)).toBe(true);
      expect(result2.some(obj => 'id' in obj)).toBe(true);
      expect(result3.some(obj => 'id' in obj)).toBe(true);
    });

    it('should not duplicate id when already at end', () => {
      const result = parseSort('name,createdAt,id', 'asc,desc,asc');
      const idCount = result.filter(obj => 'id' in obj).length;
      expect(idCount).toBe(1);
      expect(result[result.length - 1]).toEqual({ id: 'asc' });
    });

    it('should not duplicate id when already in middle', () => {
      const result = parseSort('name,id,createdAt', 'asc,desc,asc');
      const idCount = result.filter(obj => 'id' in obj).length;
      expect(idCount).toBe(1);
    });
  });
});
