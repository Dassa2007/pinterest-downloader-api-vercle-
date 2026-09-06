const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: "Pinterest API is running!" });
});

app.get('/download', async (req, res) => {
  const pinUrl = req.query.url;
  if (!pinUrl) {
    return res.status(400).json({ error: "Please provide a Pinterest URL using ?url=" });
  }

  try {
    // නොමිලේ ලබා ගත හැකි නිදහස් පබ්ලික් සර්විස් එකක් හරහා ඩේටා ලබා ගැනීම
    const response = await axios.get(`https://pinterest-video-downloader.vercel.app/api?url=${encodeURIComponent(pinUrl)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (response.data && (response.data.url || response.data.download_url)) {
      const videoUrl = response.data.url || response.data.download_url;
      res.json({ success: true, download_url: videoUrl });
    } else {
      // වෙනත් විකල්ප ක්‍රමයක් (Cobalt API වැනි නිදහස් සේවාවක්) පාවිච්චි කිරීම
      const cobaltResp = await axios.post('https://api.cobalt.tools/api/json', {
        url: pinUrl
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (cobaltResp.data && cobaltResp.data.url) {
        res.json({ success: true, download_url: cobaltResp.data.url });
      } else {
        res.status(404).json({ error: "Could not fetch video. Try another link." });
      }
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch video", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
