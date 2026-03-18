const bcrypt = require('bcrypt');

(async () => {
  const hash = await bcrypt.hash('Password123!', 10);
  const ok = await bcrypt.compare('Password123!', hash);
  console.log('compare result', ok);
})();
