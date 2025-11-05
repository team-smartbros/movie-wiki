const fs = require('fs');

// Read the JSON file
fs.readFile('spiderman_response.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading file:', err);
    return;
  }

  try {
    // Parse the JSON
    const jsonData = JSON.parse(data);
    
    // Function to recursively search for cast information
    function findCast(obj, path = '') {
      if (!obj) return;
      
      // If this looks like a cast entry
      if (obj.name && obj.name.nameText && obj.name.nameText.text) {
        console.log(`Found actor at path: ${path}`);
        console.log(`Actor: ${obj.name.nameText.text}`);
      }
      
      // If this is an array, check each element
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          findCast(item, `${path}[${index}]`);
        });
      }
      // If this is an object, check each property
      else if (typeof obj === 'object') {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            findCast(obj[key], `${path}.${key}`);
          }
        }
      }
    }
    
    // Search for cast information
    console.log('Searching for cast information...');
    findCast(jsonData);
    
  } catch (parseError) {
    console.error('Error parsing JSON:', parseError);
  }
});