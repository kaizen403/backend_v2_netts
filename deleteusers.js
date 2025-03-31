import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deletedBookings = await prisma.preBooking.deleteMany({});
  console.log(`${deletedBookings.count} pre-bookings deleted.`);

  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`${deletedUsers.count} users deleted.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
