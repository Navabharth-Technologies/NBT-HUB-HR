const fs = require('fs');
const path = require('path');

const paths = [
    path.join(process.env.LOCALAPPDATA, 'Google/Chrome/User Data/Default/Local Storage/leveldb'),
    path.join(process.env.LOCALAPPDATA, 'Microsoft/Edge/User Data/Default/Local Storage/leveldb')
];

let foundData = null;

paths.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(f => {
        if (f.endsWith('.log') || f.endsWith('.ldb')) {
            try {
                const tempPath = path.join(__dirname, 'temp_ldb');
                fs.copyFileSync(path.join(dir, f), tempPath);
                const content = fs.readFileSync(tempPath);
                fs.unlinkSync(tempPath);
                
                const idx = content.indexOf('nbt_historical_quiz_scores');
                if (idx !== -1) {
                    const str = content.toString('utf8');
                    // Find the JSON string that follows
                    const sub = str.substring(idx);
                    // Match the array starting with [ and ending with ]
                    const match = sub.match(/\[.*\]/);
                    if (match) {
                        try {
                            const parsed = JSON.parse(match[0].replace(/\\"/g, '"').replace(/\\/g, ''));
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                foundData = parsed;
                            }
                        } catch (e) {
                            // try a looser regex or partial match
                        }
                    }
                }
            } catch (e) {
                // ignore
            }
        }
    });
});

if (foundData) {
    console.log('FOUND cached quiz scores array. Length:', foundData.length);
    console.log('Sample item 1 keys & values:', JSON.stringify(foundData[0], null, 2));
    if (foundData.length > 1) {
        console.log('Sample item 2 keys & values:', JSON.stringify(foundData[1], null, 2));
    }
} else {
    console.log('No cached quiz scores array found');
}
