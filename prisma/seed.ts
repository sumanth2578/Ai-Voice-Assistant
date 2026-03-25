import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const alice = await prisma.user.create({
    data: { name: "Alice" },
  });
  const bob = await prisma.user.create({
    data: { name: "Bob" },
  });
  const charlie = await prisma.user.create({
    data: { name: "Charlie" },
  });
  const sumanth = await prisma.user.create({
    data: { name: "Sumanth" },
  });

  console.log("Users created:", [alice.name, bob.name, charlie.name, sumanth.name]);

  // Create initial Tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Design Landing Page",
        description: "Create a modern landing page for the voice assistant.",
        status: "todo",
        userId: alice.id,
      },
      {
        title: "Implement Voice Hook",
        description: "Develop a custom React hook for browser SpeechRecognition.",
        status: "in-progress",
        userId: sumanth.id,
      },
      {
        title: "Fix Authentication Bug",
        description: "Resolve the issue with session persistence.",
        status: "done",
        userId: bob.id,
      },
    ],
  });

  console.log("Mock tasks seeded.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
