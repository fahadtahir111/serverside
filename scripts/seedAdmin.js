const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@admin.com';
  const password = 'admin123'; // Change this to a strong password!
  const username = 'admin';

  const hash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin user already exists.');
    process.exit(0);
  }

  await prisma.user.create({
    data: {
      username,
      email,
      password_hash: hash,
      credits: 100
    }
  });

  console.log('Admin user created:', email);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
}); 