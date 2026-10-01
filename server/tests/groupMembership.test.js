import assert from "node:assert/strict";
import test from "node:test";
import { isAcceptedMember } from "../src/helper/groupMembership.js";

test("returns true for accepted membership", () => {
  assert.equal(isAcceptedMember("accepted"), true);
});

test("returns false for other or missing membership statuses", () => {
  for (const status of ["pending", "rejected", null, undefined]) {
    assert.equal(isAcceptedMember(status), false);
  }
});