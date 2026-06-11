const fs = require('fs');
const path = require('path');

const endpoints = [
  '/university/departments',
  '/university/majors',
  '/university/certificate-levels',
  '/university/settings/authority',
  '/public/universities',
  '/verify/system-stats'
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  endpoints.forEach(ep => {
    // Escape for regex
    const regex = new RegExp('api\\.get\\([`\'\"]' + ep.replace(/\\//g, '\\\\/') + '.*?[`\'\"]\\)', 'g');
    if (regex.test(content)) {
      content = content.replace(regex, match => match.replace('api.get', 'cachedGet'));
      changed = true;
    }
  });

  if (changed) {
    // Add import { cachedGet } from '.../services/api';
    const apiImportRegex = /import api from ['\"](.*?)['\"];/;
    const match = content.match(apiImportRegex);
    if (match) {
       const apiPath = match[1];
       if (!content.includes('import api, { cachedGet }')) {
          content = content.replace(apiImportRegex, `import api, { cachedGet } from '${apiPath}';`);
       }
    }
    
    // Add clearCacheFor for POST/PUT/DELETE
    if (content.includes('api.post') || content.includes('api.put') || content.includes('api.delete')) {
      if (content.match(/api\.(post|put|delete)\([`\'"]\/university\/departments/)) {
         if (!content.includes('clearCacheFor')) {
            content = content.replace(/import api, \{ cachedGet \}/, 'import api, { cachedGet, clearCacheFor }');
         }
         content = content.replace(/(await api\.(post|put|delete)\([`\'"]\/university\/departments.*?\)[\s\S]*?)(fetchItems|toast\.success|setModalOpen)/g, '$1clearCacheFor(\'/university/departments\');\n      $3');
      }
      if (content.match(/api\.(post|put|delete)\([`\'"]\/university\/majors/)) {
         if (!content.includes('clearCacheFor')) {
            content = content.replace(/import api, \{ cachedGet \}/, 'import api, { cachedGet, clearCacheFor }');
         }
         content = content.replace(/(await api\.(post|put|delete)\([`\'"]\/university\/majors.*?\)[\s\S]*?)(fetchMajors|toast\.success|setModalOpen)/g, '$1clearCacheFor(\'/university/majors\');\n      $3');
      }
      if (content.match(/api\.(post|put|delete)\([`\'"]\/university\/certificate-levels/)) {
         if (!content.includes('clearCacheFor')) {
            content = content.replace(/import api, \{ cachedGet \}/, 'import api, { cachedGet, clearCacheFor }');
         }
         content = content.replace(/(await api\.(post|put|delete)\([`\'"]\/university\/certificate-levels.*?\)[\s\S]*?)(fetchLevels|toast\.success|setModalOpen)/g, '$1clearCacheFor(\'/university/certificate-levels\');\n      $3');
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
}

function walkDir(dir) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath);
    } else if (dirPath.endsWith('.js') || dirPath.endsWith('.jsx')) {
      updateFile(dirPath);
    }
  });
}

walkDir('d:/New Works/Project File/eduauth-registry/frontend/src');
