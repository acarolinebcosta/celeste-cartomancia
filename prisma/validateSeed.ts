import assert from "node:assert/strict";
import { Modality, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [services, weeklyRules] = await Promise.all([
    prisma.service.findMany({ include: { modalities: true }, orderBy: { slug: "asc" } }),
    prisma.availabilityRule.findMany({ where: { timezone: "America/Sao_Paulo" } }),
  ]);

  assert.equal(services.length, 5, "seed must contain exactly five services");
  assert.equal(weeklyRules.length, 5, "seed must contain exactly five weekly availability rules");

  for (const service of services) {
    const modalities = service.modalities.map(({ modality }) => modality).sort();
    if (service.slug === "pergunta-direta") {
      assert.deepEqual(modalities, [Modality.MESSAGE]);
    } else {
      assert.deepEqual(modalities, [Modality.VIDEO, Modality.VOICE]);
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Seed validation failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
