const bcrypt = require('bcrypt');

async function checkPassword() {
  try {
    const hashedPassword = '$2b$10$Gg7I/ImQq/BdLJpaHHVTC.ASi5QcoQg9JymoZJqfaT/O2O.Jz1tQG';
    const inputPassword = 'admin123';
    
    const isValid = await bcrypt.compare(inputPassword, hashedPassword);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('Trying common passwords...');
      const commonPasswords = ['admin123', 'admin', 'password', '123456'];
      
      for (const pwd of commonPasswords) {
        const valid = await bcrypt.compare(pwd, hashedPassword);
        console.log(`Password "${pwd}" valid:`, valid);
        if (valid) {
          break;
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkPassword();