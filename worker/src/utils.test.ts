import { test } from "node:test";
import assert from "node:assert/strict";
import { isUploadedFile, sniffImageType } from "./utils.js";

test("isUploadedFile rejects a plain string form field", () => {
  assert.equal(isUploadedFile("just a string"), false);
});

test("isUploadedFile rejects null", () => {
  assert.equal(isUploadedFile(null), false);
});

test("isUploadedFile accepts a File-shaped object", () => {
  const fakeFile = {
    size: 100,
    type: "image/jpeg",
    arrayBuffer: async () => new ArrayBuffer(0),
  } as unknown as File;
  assert.equal(isUploadedFile(fakeFile), true);
});

test("sniffImageType detects a JPEG by magic bytes", () => {
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]).buffer;
  assert.equal(sniffImageType(bytes), "image/jpeg");
});

test("sniffImageType detects a PNG by magic bytes", () => {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).buffer;
  assert.equal(sniffImageType(bytes), "image/png");
});

test("sniffImageType detects a WebP by magic bytes", () => {
  const bytes = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
  ]).buffer;
  assert.equal(sniffImageType(bytes), "image/webp");
});

test("sniffImageType rejects a file mislabeled as an image (e.g. a script)", () => {
  const bytes = Uint8Array.from("#!/bin/sh\necho hi\n", (c) => c.charCodeAt(0)).buffer;
  assert.equal(sniffImageType(bytes), null);
});
