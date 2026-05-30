const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'FrontEnd', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace FiDollarSign with FaRupeeSign
  content = content.replace(/FiDollarSign/g, 'FaRupeeSign');
  content = content.replace(/react-icons\/fi/g, 'react-icons/fi'); // keep same
  
  // Actually, FaRupeeSign is from react-icons/fa. We need to add import { FaRupeeSign } from 'react-icons/fa';
  if (original.includes('FiDollarSign')) {
     if (!content.includes('FaRupeeSign } from \'react-icons/fa\'')) {
         content = `import { FaRupeeSign } from 'react-icons/fa';\n` + content;
     }
  }

  // Currency replacements
  // >$
  content = content.replace(/>\$/g, '>₹');
  // +$
  content = content.replace(/\+\$/g, '+₹');
  // -$
  content = content.replace(/-\$/g, '-₹');
  // `Max $${`
  content = content.replace(/\$\$\{/g, '₹${');
  // ` • $${`
  content = content.replace(/ \$\$\{/g, ' ₹${');
  // `$10` etc
  content = content.replace(/\$([0-9])/g, '₹$1');
  // ($)
  content = content.replace(/\(\$\)/g, '(₹)');
  // ` Payout: $${`
  content = content.replace(/Payout: \$\$\{/g, 'Payout: ₹${');

  // Any other standalone $ before ${
  // e.g. ` ${` ? Wait, space then $ then { inside JSX is just ` ${`. But inside string template it's ` \${`.
  content = content.replace(/ `\$/g, ' `₹');
  content = content.replace(/'\$/g, '\'₹');
  content = content.replace(/"\$/g, '"₹');
  content = content.replace(/\$ /g, '₹ '); // risky?

  // Fix template literals: `... $${var}` -> `... ₹${var}`
  // In javascript, $${var} inside a backtick string means literal $ followed by evaluated var.
  content = content.replace(/([^$])\$\$\{/g, '$1₹${');
  content = content.replace(/^\$\$\{/g, '₹${');

  // Fix literal text in JSX:
  // e.g. >${var}
  content = content.replace(/>\$\{/g, '>₹{');
  content = content.replace(/\+\$\{/g, '+₹{');

  // e.g. " • $"
  content = content.replace(/ • \$/g, ' • ₹');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
