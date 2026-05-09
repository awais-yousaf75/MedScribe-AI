const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('./src/pages', (filePath) => {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Check if file has onNavigate
    if (content.includes('onNavigate')) {
      // Add import
      if (!content.includes('import { useNavigate }')) {
        content = content.replace(/(import .* from "react";)/, `$1\nimport { useNavigate } from "react-router-dom";`);
      }

      // Replace props type
      content = content.replace(/onNavigate:\s*\(?[^)]*\)?\s*=>\s*void;?\s*/g, '');
      content = content.replace(/onNavigate\??:\s*[^;]+;?\s*/g, '');

      // Replace destructuring
      content = content.replace(/,\s*onNavigate\s*(?=[,}])/g, '');
      content = content.replace(/onNavigate,\s*/g, '');
      content = content.replace(/onNavigate\s*:\s*_[^,]+,/g, '');
      content = content.replace(/onNavigate: [a-zA-Z0-9_]+,/g, '');

      // Replace onNavigate calls with navigate
      // Simple heuristic for navigating up one level or absolute depending on usage
      content = content.replace(/onNavigate\(([^)]+)\)/g, (match, arg) => {
        return `navigate(\`../\${${arg}.replace(/['"]/g, '')}\`)`;
      });

      if (content !== original) {
        // Add const navigate = useNavigate() if not present
        if (!content.includes('const navigate = useNavigate()')) {
          content = content.replace(/(export function [a-zA-Z]+\([^)]*\)\s*\{)/, `$1\n  const navigate = useNavigate();`);
          content = content.replace(/(export default function [a-zA-Z]+\([^)]*\)\s*\{)/, `$1\n  const navigate = useNavigate();`);
        }
        fs.writeFileSync(filePath, content);
        console.log('Fixed', filePath);
      }
    }
  }
});
