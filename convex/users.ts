import { ConvexError, v } from "convex/values";
import { mutation, query } from "./lib/functions";
import { formSchemaUserUpdate } from "./lib/validators";

const MIN_PUBLIC_KEY_BASE64_LENGTH = 300;
const MAX_PUBLIC_KEY_BASE64_LENGTH = 5000;
const BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;
const RSA_SPKI_OID_BYTES = new Uint8Array([
  0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
]);

function decodeBase64ToBytes(value: string): Uint8Array | null {
  if (
    value.length < MIN_PUBLIC_KEY_BASE64_LENGTH ||
    value.length > MAX_PUBLIC_KEY_BASE64_LENGTH
  ) {
    return null;
  }

  if (value.length % 4 !== 0 || !BASE64_PATTERN.test(value)) {
    return null;
  }

  try {
    const decoded = atob(value);
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

function readAsn1Length(
  bytes: Uint8Array,
  offset: number,
): { length: number; nextOffset: number } | null {
  const firstLengthByte = bytes[offset];

  if (firstLengthByte === undefined) {
    return null;
  }

  if ((firstLengthByte & 0x80) === 0) {
    return {
      length: firstLengthByte,
      nextOffset: offset + 1,
    };
  }

  const longFormByteCount = firstLengthByte & 0x7f;
  if (longFormByteCount === 0 || longFormByteCount > 4) {
    return null;
  }

  const lengthStart = offset + 1;
  const lengthEnd = lengthStart + longFormByteCount;
  if (lengthEnd > bytes.length) {
    return null;
  }

  let length = 0;
  for (let i = lengthStart; i < lengthEnd; i++) {
    const currentByte = bytes[i];
    if (currentByte === undefined) {
      return null;
    }
    length = (length << 8) | currentByte;
  }

  return {
    length,
    nextOffset: lengthEnd,
  };
}

function containsSubsequence(bytes: Uint8Array, target: Uint8Array): boolean {
  if (target.length === 0 || target.length > bytes.length) {
    return false;
  }

  const maxStart = bytes.length - target.length;
  for (let start = 0; start <= maxStart; start++) {
    let matched = true;

    for (let i = 0; i < target.length; i++) {
      if (bytes[start + i] !== target[i]) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return true;
    }
  }

  return false;
}

function isValidSpkiPublicKey(publicKey: string): boolean {
  const bytes = decodeBase64ToBytes(publicKey);
  if (!bytes) {
    return false;
  }

  let cursor = 0;

  if (bytes[cursor] !== 0x30) {
    return false;
  }
  cursor += 1;

  const topLevelLength = readAsn1Length(bytes, cursor);
  if (!topLevelLength) {
    return false;
  }

  cursor = topLevelLength.nextOffset;
  const topLevelEnd = cursor + topLevelLength.length;
  if (topLevelEnd !== bytes.length) {
    return false;
  }

  if (bytes[cursor] !== 0x30) {
    return false;
  }
  cursor += 1;

  const algorithmIdentifierLength = readAsn1Length(bytes, cursor);
  if (!algorithmIdentifierLength) {
    return false;
  }

  const algorithmIdentifierStart = algorithmIdentifierLength.nextOffset;
  const algorithmIdentifierEnd =
    algorithmIdentifierStart + algorithmIdentifierLength.length;
  if (algorithmIdentifierEnd > topLevelEnd) {
    return false;
  }

  const algorithmIdentifierBytes = bytes.slice(
    algorithmIdentifierStart,
    algorithmIdentifierEnd,
  );
  if (!containsSubsequence(algorithmIdentifierBytes, RSA_SPKI_OID_BYTES)) {
    return false;
  }

  cursor = algorithmIdentifierEnd;
  if (bytes[cursor] !== 0x03) {
    return false;
  }
  cursor += 1;

  const bitStringLength = readAsn1Length(bytes, cursor);
  if (!bitStringLength) {
    return false;
  }

  const bitStringStart = bitStringLength.nextOffset;
  const bitStringEnd = bitStringStart + bitStringLength.length;
  if (bitStringEnd !== topLevelEnd || bitStringLength.length < 2) {
    return false;
  }

  if (bytes[bitStringStart] !== 0x00) {
    return false;
  }

  return bytes[bitStringStart + 1] === 0x30;
}

export const getUserData = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    return ctx.table("users").getX("clerkId", identity.tokenIdentifier);
  },
});

export const updateUserData = mutation({
  args: {
    data: v.object({
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      email: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      console.error("Unauthenticated call to mutation");
      return null;
    }

    // Validate data against Zod schema to ensure security
    const parsedData = formSchemaUserUpdate.parse(args.data);

    const user = ctx.table("users").getX("clerkId", identity.tokenIdentifier);

    const updates: { email?: string; lastName?: string; firstName?: string } =
      {};

    if (parsedData.email !== undefined && parsedData.email !== "") {
      updates.email = parsedData.email;
    }
    if (parsedData.lastName !== undefined && parsedData.lastName !== "") {
      updates.lastName = parsedData.lastName;
    }
    if (parsedData.firstName !== undefined && parsedData.firstName !== "") {
      updates.firstName = parsedData.firstName;
    }

    await user.patch(updates);
  },
});

export const updatePublicKey = mutation({
  args: { publicKey: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Unauthenticated");
    }

    if (!isValidSpkiPublicKey(args.publicKey)) {
      throw new ConvexError("Invalid public key format");
    }

    const user = await ctx
      .table("users")
      .getX("clerkId", identity.tokenIdentifier);
    await user.patch({ publicKey: args.publicKey });
    return null;
  },
});
