import bcrypt from 'bcryptjs'

// Test some common passwords
const passwords = ['123456', 'Admin123!', 'admin123', 'password', 'admin', 'Employer123!', 'Worker123!']

async function main() {
  for (const pwd of passwords) {
    const hash = await bcrypt.hash(pwd, 10)
    console.log(`"${pwd}" → ${hash}`)
  }
}
main()
