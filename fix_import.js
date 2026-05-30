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

  // It replaced FiDollarSign with FaRupeeSign in the import line:
  // import { ..., FaRupeeSign, ... } from 'react-icons/fi';
  
  // We need to remove FaRupeeSign from react-icons/fi
  // it might look like ` FaRupeeSign,` or `FaRupeeSign, ` or `, FaRupeeSign`
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('react-icons/fi') && lines[i].includes('FaRupeeSign')) {
      lines[i] = lines[i].replace(/,\s*FaRupeeSign/, '');
      lines[i] = lines[i].replace(/FaRupeeSign\s*,/, '');
      lines[i] = lines[i].replace(/FaRupeeSign/, '');
    }
  }
  content = lines.join('\n');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed import:', file);
  }
});
