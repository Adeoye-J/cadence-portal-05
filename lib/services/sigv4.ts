import { createHash, createHmac } from "node:crypto";

/**
 * AWS Signature Version 4, query-string form, for presigned URLs. Works with any S3-compatible store
 * (Cloudflare R2, MinIO, AWS S3). Pure: no environment access and no I/O, so it is tested against
 * AWS's published example.
 */

export type PresignInput = {
  method: "GET" | "PUT" | "HEAD" | "DELETE";
  /** Scheme and host, for example "https://account.r2.cloudflarestorage.com". */
  origin: string;
  /** The Host header value, for example "account.r2.cloudflarestorage.com". */
  host: string;
  /** Path including the bucket for path-style addressing, for example "/bucket/key". */
  path: string;
  region: string;
  service: string;
  accessKeyId: string;
  secretAccessKey: string;
  expiresSec: number;
  now: Date;
  /** Extra query parameters, such as response-content-disposition. Signed with the request. */
  query?: Record<string, string>;
};

/** RFC 3986 encoding, as SigV4 requires: also encodes ! ' ( ) * which encodeURIComponent leaves alone. */
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

function encodePath(path: string): string {
  return path.split("/").map(encodeRfc3986).join("/");
}

/** The X-Amz-Date form: 20130524T000000Z. */
export function amzDate(now: Date): string {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

export function presignUrl(input: PresignInput): string {
  const date = amzDate(input.now);
  const day = date.slice(0, 8);
  const scope = `${day}/${input.region}/${input.service}/aws4_request`;

  const params: [string, string][] = [
    ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
    ["X-Amz-Credential", `${input.accessKeyId}/${scope}`],
    ["X-Amz-Date", date],
    ["X-Amz-Expires", String(input.expiresSec)],
    ["X-Amz-SignedHeaders", "host"],
    ...Object.entries(input.query ?? {}),
  ];
  const canonicalQuery = params
    .map(([k, v]) => [encodeRfc3986(k), encodeRfc3986(v)] as const)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");

  // Presigned URLs sign only the host header and always use UNSIGNED-PAYLOAD.
  const canonicalRequest = [
    input.method,
    encodePath(input.path),
    canonicalQuery,
    `host:${input.host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    date,
    scope,
    createHash("sha256").update(canonicalRequest, "utf8").digest("hex"),
  ].join("\n");

  const kDate = hmac(`AWS4${input.secretAccessKey}`, day);
  const kRegion = hmac(kDate, input.region);
  const kService = hmac(kRegion, input.service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  return `${input.origin}${encodePath(input.path)}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
