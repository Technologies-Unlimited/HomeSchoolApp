// Simple JWT implementation for Bun
const SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

type JWTPayload = {
  userId: number;
  email: string;
  role: string;
  exp?: number;
};

// Base64 URL encoding
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return atob(str);
}

export function createToken(payload: JWTPayload, expiresIn: number = 7 * 24 * 60 * 60): string {
  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresIn;

  const payloadWithExp = {
    ...payload,
    exp,
    iat: now
  };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payloadWithExp));

  const message = `${headerEncoded}.${payloadEncoded}`;

  // Create signature using Bun's crypto
  const encoder = new TextEncoder();
  const key = encoder.encode(SECRET);
  const data = encoder.encode(message);

  const hash = new Bun.CryptoHasher("sha256", key);
  hash.update(data);
  const signature = base64UrlEncode(String.fromCharCode(...hash.digest()));

  return `${message}.${signature}`;
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [headerEncoded, payloadEncoded, signature] = parts;
    const message = `${headerEncoded}.${payloadEncoded}`;

    // Verify signature
    const encoder = new TextEncoder();
    const key = encoder.encode(SECRET);
    const data = encoder.encode(message);

    const hash = new Bun.CryptoHasher("sha256", key);
    hash.update(data);
    const expectedSignature = base64UrlEncode(String.fromCharCode(...hash.digest()));

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(payloadEncoded));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}
