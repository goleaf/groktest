import { describe, expect, it } from 'vitest';
import { createId, isId } from './ids';

describe('createId', () => {
    it('returns a stable UUIDv7 shape', () => {
        const entropy = Uint8Array.from({ length: 10 }, (_, index) => index);
        const id = createId(1_724_140_800_000, entropy);

        expect(isId(id)).toBe(true);
        expect(id.charAt(14)).toBe('7');
        expect(createId(1_724_140_800_000, entropy)).toBe(id);
    });

    it('sorts later timestamps after earlier ones', () => {
        const entropy = new Uint8Array(10);
        const earlier = createId(1_000, entropy);
        const later = createId(2_000, entropy);

        expect(later > earlier).toBe(true);
    });

    it('produces unique values with default entropy', () => {
        const ids = new Set(Array.from({ length: 50 }, () => createId()));
        expect(ids.size).toBe(50);
    });
});
