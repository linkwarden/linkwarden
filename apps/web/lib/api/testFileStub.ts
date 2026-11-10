import type { NextApiRequest, NextApiResponse } from "next";

// Production builds use this in place of the tests kept next to API routes
// (pages/**/*.test.ts), which Next would otherwise serve as routes
export default function testFileStub(_: NextApiRequest, res: NextApiResponse) {
  return res.status(404).json({ response: "Not found." });
}
