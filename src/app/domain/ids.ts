const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function hex(value: number): string {
  return value.toString(16).padStart(2, '0');
}

/**
 * UUIDv7 (RFC 9562). Time-ordered, generated on-device so offline creates work.
 */
export function createId(nowMs: number = Date.now(), entropy?: Uint8Array): string {
  const bytes = new Uint8Array(16);
  if (entropy) {
    if (entropy.length !== 10) {
      throw new Error('entropy must be 10 bytes');
    }
    bytes.set(entropy, 6);
  } else {
    crypto.getRandomValues(bytes.subarray(6));
  }

  let timestamp = nowMs;
  for (let index = 5; index >= 0; index -= 1) {
    bytes[index] = timestamp & 0xff;
    timestamp = Math.floor(timestamp / 256);
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const h = Array.from(bytes, hex).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function isId(value: string): boolean {
  return UUID_PATTERN.test(value);
}
