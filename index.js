const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: "Pinterest Mobile Scraper API is running!" });
});

app.get('/download', async (req, res) => {
  let pinUrl = req.query.url;
  if (!pinUrl) {
    return res.status(400).json({ error: "Please provide a Pinterest URL using ?url=" });
  }

  try {
    // pin.it කෙටි ලින්ක් එකක් නම් සම්පූර්ණ ලින්ක් එක ලබා ගැනීම
    if (pinUrl.includes('pin.it')) {
      const resp = await axios.get(pinUrl, {
        maxRedirects: 5,
        headers: { "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15" }
      });
      pinUrl = resp.request.res.responseUrl || pinUrl;
    }

    // මෝබයිල් ලින්ක් එකක් ලෙස හැඩගැස්වීම (m.pinterest.com)
    let mobileUrl = pinUrl.replace('www.pinterest.', 'm.pinterest.').replace('pinterest.', 'm.pinterest.');

    const response = await axios.get(mobileUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    const $ = cheerio.load(response.data);
    let videoUrl = null;

    // 1. og:video පරීක්ෂා කිරීම
    videoUrl = $('meta[property="og:video"]').attr('content') || 
               $('meta[property="og:video:secure_url"]').attr('content');

    // 2. නැතිනම් script ටැග්ස් වලින් JSON ඩේටා සෙවීම
    if (!videoUrl) {
      $('script').each((i, el) => {
        const text = $(el).html();
        if (text && (text.includes('contentUrl') || text.includes('video_url'))) {
          try {
            const match = text.match(/"(https:\/\/[^"]+\.mp4[^"]*)"/);
            if (match && match[1]) {
              videoUrl = match[1].replace(/\\u002F/g, '/');
            }
          } catch (e) {}
        }
      });
    }

    if (videoUrl) {
      res.json({ success: true, download_url: videoUrl });
    } else {
      res.status(404).json({ error: "Video not found. Make sure the link contains a video." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch video", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
