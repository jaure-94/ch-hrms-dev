const fs = require('fs');
const { Pool } = require('pg');

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function extractDelimiters() {
  try {
    console.log('Connecting to database...');
    
    // Get the active template
    const result = await pool.query(
      'SELECT name, file_content FROM contract_templates WHERE company_id = $1 AND is_active = true LIMIT 1',
      ['68f11a7e-27ab-40eb-826e-3ce6d84874de']
    );

    if (result.rows.length === 0) {
      console.log('No active template found');
      return;
    }

    const template = result.rows[0];
    console.log('Template name:', template.name);
    
    // Decode the base64 content
    const templateBuffer = Buffer.from(template.file_content, 'base64');
    
    // Save to a temporary file
    fs.writeFileSync('temp_template.docx', templateBuffer);
    console.log('Template saved to temp_template.docx');
    
    // Try to extract text content and find delimiters
    const textContent = templateBuffer.toString('binary');
    
    // Find all patterns that look like delimiters
    const delimiterPatterns = [
      /\{\{[^}]+\}\}/g,     // {{variable}}
      /\{[^}]+\}/g,        // {variable}
      /\[[^\]]+\]/g,       // [variable]
      /\<[^>]+\>/g,        // <variable>
      /\$[A-Za-z_][A-Za-z0-9_]*/g,  // $variable
      /\%[A-Za-z_][A-Za-z0-9_]*\%/g,  // %variable%
    ];
    
    console.log('\nSearching for delimiters in template...');
    
    delimiterPatterns.forEach((pattern, index) => {
      const matches = textContent.match(pattern);
      if (matches) {
        console.log(`Pattern ${index + 1} (${pattern.source}):`);
        console.log('Found:', [...new Set(matches)].slice(0, 20));
        console.log('Total matches:', matches.length);
        console.log('---');
      }
    });
    
    // Also search for specific common patterns
    const commonPatterns = [
      'firstName', 'lastName', 'companyName', 'jobTitle', 'salary', 'startDate'
    ];
    
    console.log('\nSearching for common variable names...');
    commonPatterns.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = textContent.match(regex);
      if (matches) {
        console.log(`Found "${pattern}": ${matches.length} times`);
      }
    });
    
    // Clean up
    fs.unlinkSync('temp_template.docx');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

extractDelimiters();