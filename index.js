const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: "API is running! Use /download?url=PINTEREST_URL" });
});

app.get('/download', async (req, res) => {
  const pinUrl = req.query.url;
  if (!pinUrl) {
    return res.status(400).json({ error: "Please provide a Pinterest URL using ?url=" });
  }

  try {
    const response = await axios.get(pinUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    const $ = cheerio.load(response.data);
    let videoUrl = $('meta[property="og:video"]').attr('content') || 
                   $('meta[property="og:video:secure_url"]').attr('content');

    if (!videoUrl) {
      // Script tag එකෙන් JSON data ගන්න උත්සාහ කිරීම
      const scriptData = $('script[data-relay-response="true"]').html();
      if (scriptData) {
        const json = JSON.parse(scriptData);
        // මෙතැනින් Pinterest JSON 구조 එක අනුව වීඩියෝ ලින්ක් එක ගන්න පුළුවන්
      }
    }

    if (videoUrl) {
      res.json({ success: true, download_url: videoUrl });
    } else {
      res.status(404).json({ error: "Video not found or invalid URL." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch video", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
