const fs = require('fs');

// Read the original SQL file
const inputFile = 'topup_db-city.sql';
const outputFile = 'modified_topup_db-city.sql';

// Read the file content
const fileContent = fs.readFileSync(inputFile, 'utf8');

// Transform the SQL insert statements
const transformedContent = fileContent.split('\n')
    .map(line => {
        if (line.startsWith('INSERT INTO city VALUES(')) {
            // Split the line into parts
            const match = line.match(/\((\d+),('.*?'),('.*?'),(\d+)\)/);

            if (match) {
                // Swap 2nd and 3rd values, remove 4th value
                return `INSERT INTO city VALUES(${match[1]},${match[3]},${match[2]},NULL);`;
            }
        }
        return line;
    })
    .join('\n');

// Write the transformed content to a new file
fs.writeFileSync(outputFile, transformedContent);

console.log('SQL file transformed successfully.');