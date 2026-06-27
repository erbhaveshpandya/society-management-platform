const https = require('https');
const fs = require('fs');
const path = require('path');

const soundUrl = 'https://www.soundjay.com/button/beep-07.mp3'; // High pitched beep loop

const backendUploadsDir = path.join(__dirname, '..', '..', 'backend', 'SocietyManagement.Api', 'uploads');
const mobileAssetsDir = path.join(__dirname, 'assets');

// Ensure directories exist
if (!fs.existsSync(backendUploadsDir)) {
  fs.mkdirSync(backendUploadsDir, { recursive: true });
}
if (!fs.existsSync(mobileAssetsDir)) {
  fs.mkdirSync(mobileAssetsDir, { recursive: true });
}

const backendDest = path.join(backendUploadsDir, 'siren.mp3');
const mobileDest = path.join(mobileAssetsDir, 'siren.mp3');

console.log('Downloading alarm sound from:', soundUrl);

const download = (url, dest, callback) => {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download: Status Code ${response.statusCode}`);
      file.close();
      fs.unlink(dest, () => {});
      return;
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close(callback);
    });
  }).on('error', (err) => {
    fs.unlink(dest, () => {});
    console.error('Download error:', err.message);
  });
};

// Download to backend uploads first
download(soundUrl, backendDest, () => {
  console.log('Sound successfully saved to backend uploads:', backendDest);
  
  // Download to mobile assets second
  download(soundUrl, mobileDest, () => {
    console.log('Sound successfully saved to mobile assets:', mobileDest);
    process.exit(0);
  });
});
