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
  let pinUrl = req.query.url;
  if (!pinUrl) {
    return res.status(400).json({ error: "Please provide a Pinterest URL using ?url=" });
  }

  try {
    // pin.it වගේ කෙටි ලින්ක් එකක් නම් සම්පූර්ණ ලින්ක් එකට හරවාගැනීම
    if (pinUrl.includes('pin.it')) {
      const resp = await axios.get(pinUrl, { maxRedirects: 5 });
      pinUrl = resp.request.res.responseUrl || pinUrl;
    }

    const response = await axios.get(pinUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    const $ = cheerio.load(response.data);
    
    // විවිධ ක්‍රම මඟින් වීඩියෝ ලින්ක් එක සෙවීම
    let videoUrl = $('meta[property="og:video"]').attr('content') || 
                   $('meta[property="og:video:secure_url"]').attr('content') ||
                   $('script[name="initial-state"]').html();

    if (!videoUrl) {
      // Script ටැග්ස් හරහා JSON ඩේටා සෙවීම
      $('script').each((i, element) => {
        const scriptContent = $(element).html();
        if (scriptContent && scriptContent.includes('contentUrl')) {
          try {
            const match = scriptContent.match(/"contentUrl"\s*:\s*"([^"]+)"/);
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
      res.status(404).json({ error: "Video not found in this pin. Make sure it's a video pin." });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch video", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
