const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: "API is running successfully!" });
});

app.get('/download', async (req, res) => {
  const pinUrl = req.query.url;
  if (!pinUrl) {
    return res.status(400).json({ error: "Please provide a Pinterest URL using ?url=" });
  }

  try {
    // Pinterest නිල නොවන පබ්ලික් ඇප් එකක API එකක් හරහා දත්ත ලබා ගැනීම
    const encodedUrl = encodeURIComponent(pinUrl);
    const apiResult = await axios.get(`https://www.pinterest.com/resource/PinResource/get/?source_url=${encodedUrl}&data={"slug":"${pinUrl.split('/')[4] || ''}"}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    // විකල්ප ක්‍රමයක් ලෙස HTML වෙතින්ම ඩේටා ලබා ගැනීම
    const response = await axios.get(pinUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      }
    });

    const $ = cheerio.load(response.data);
    let videoUrl = null;

    // JSON-LD හෝ meta ටැග් වලින් වීඩියෝව සෙවීම
    $('script').each((i, el) => {
      try {
        const text = $(el).html();
        if (text && text.includes('contentUrl')) {
          const json = JSON.parse(text);
          if (json.contentUrl) {
            videoUrl = json.contentUrl;
          }
        }
      } catch (e) {}
    });

    if (!videoUrl) {
      videoUrl = $('meta[property="og:video"]').attr('content') || 
                 $('meta[property="og:video:secure_url"]').attr('content');
    }

    if (videoUrl) {
      res.json({ success: true, download_url: videoUrl });
    } else {
      res.status(404).json({ error: "Could not extract video. Pinterest has strong security." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch video", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
