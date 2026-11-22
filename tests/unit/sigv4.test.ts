import { describe, expect, it } from "vitest";
import { amzDate, presignUrl } from "@/lib/services/sigv4";

/**
 * AWS's documented presigned-URL example (S3, query-string authentication, GET test.txt).
 * If this fails, the signer is wrong, and no presigned upload or download can be trusted.
 */
describe("SigV4 presigned URL", () => {
  it("formats the date the way SigV4 requires", () => {
    expect(amzDate(new Date("2013-05-24T00:00:00Z"))).toBe("20130524T000000Z");
  });

  it("reproduces AWS's published example signature", () => {
    const url = presignUrl({
      method: "GET",
      origin: "https://examplebucket.s3.amazonaws.com",
      host: "examplebucket.s3.amazonaws.com",
      path: "/test.txt",
      region: "us-east-1",
      service: "s3",
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      expiresSec: 86400,
      now: new Date("2013-05-24T00:00:00Z"),
    });
    expect(url).toBe(
      "https://examplebucket.s3.amazonaws.com/test.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20130524%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20130524T000000Z&X-Amz-Expires=86400&X-Amz-SignedHeaders=host&X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
    );
  });

  it("changes the signature when the method or the key changes", () => {
    const base = {
      origin: "https://b.example",
      host: "b.example",
      path: "/bucket/a b.pdf",
      region: "auto",
      service: "s3",
      accessKeyId: "AKID",
      secretAccessKey: "secret-secret-secret",
      expiresSec: 300,
      now: new Date("2026-11-18T09:00:00Z"),
    };
    const get = presignUrl({ ...base, method: "GET" });
    const put = presignUrl({ ...base, method: "PUT" });
    expect(get).not.toBe(put);
    expect(put).toContain("/bucket/a%20b.pdf?");
  });
});
