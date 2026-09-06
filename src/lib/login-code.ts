import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

// Excludes visually-ambiguous characters (0/O, 1/I) since a student reads
// this off a card or hears it spoken by their coach. Same alphabet as
// prisma/seed.ts's own generator, but genuinely random here rather than
// deterministic, since this runs at arbitrary times against real data.
export const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function generateUniqueLoginCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    const existing = await prisma.student.findUnique({ where: { loginCode: code } });
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique student login code after 10 attempts.");
}
