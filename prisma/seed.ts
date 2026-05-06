import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");
  const roles = [
    { name: "super_admin", label: "Super Admin", isSystem: true },
    { name: "admin", label: "Admin", isSystem: true },
    { name: "manager", label: "Manager", isSystem: false },
    { name: "store_keeper", label: "Store Keeper", isSystem: false },
    { name: "staff", label: "Staff", isSystem: false },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log("Roles created");

  const superAdminRole = await prisma.role.findUnique({ where: { name: "super_admin" } });
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@accoraze.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@accoraze.com",
      password: hashedPassword,
      roleId: superAdminRole!.id,
      isActive: true,
    },
  });
  console.log("Super Admin: admin@accoraze.com / admin123");

  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      businessName: "Accoraze",
      currency: "BDT",
      brandColor: "#C4973A",
      weekStartDay: 0,
    },
  });
  console.log("Default settings created");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
