const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
// Since dotenv is used in Next.js, we can require it if installed, or just read manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

let supabaseUrl = '';
let supabaseKey = '';

envContent.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

const folder = 'C:\\Users\\congt\\Downloads\\New folder (5)';
const files = fs.readdirSync(folder).filter(f => f.endsWith('.mp3'));

async function uploadFiles() {
    console.log(`Found ${files.length} MP3 files. Starting bulk upload...`);

    for (const file of files) {
        const filePath = path.join(folder, file);
        const buffer = fs.readFileSync(filePath);

        const { data, error } = await supabase.storage
            .from('prompts')
            .upload(file, buffer, {
                contentType: 'audio/mpeg',
                upsert: true,
                cacheControl: '3600'
            });

        if (error) {
            console.error(`❌ Failed to upload ${file}: ${error.message}`);
        } else {
            console.log(`✅ Successfully uploaded: ${file}`);
        }
    }

    console.log('🎉 Bulk upload completely finished!');
}

uploadFiles();
