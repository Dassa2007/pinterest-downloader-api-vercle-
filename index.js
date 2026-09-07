const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: "Pinterest Downloader API is running smoothly!" });
});

app.get('/download', async (req, res) => {
  const pinUrl = req.query.url;
  if (!pinUrl) {
    return res.status(400).json({ error: "Please provide a Pinterest URL using ?url=" });
  }

  try {
    // නොමිලේ ක්‍රියාත්මක වන වෙනත් ස්ථාවර Pinterest API එකක් භාවිතය
    const apiResponse = await axios.get(`https://pinterest-video-api.vercel.app/api/pinterest?url=${encodeURIComponent(pinUrl)}`);

    if (apiResponse.data && apiResponse.data.videoUrl) {
      res.json({ success: true, download_url: apiResponse.data.videoUrl });
    } else {
      // තවත් විකල්ප පබ්ලික් ඇප් එකක්
      const altResponse = await axios.get(`https://getpin.pro/api/download?url=${encodeURIComponent(pinUrl)}`);
      if (altResponse.data && altResponse.data.download_url) {
        res.json({ success: true, download_url: altResponse.data.download_url });
      } else {
        res.status(404).json({ error: "Could not fetch video. Please check the link." });
      }
    }
  } catch (err) {
    // අවසාන උත්සාහය ලෙස වෙනත් මට්ටමක API එකක්
    try {
      const fallback = await axios.get(`https://api.giftedtech.my.id/api/download/pinterest?apikey=gifted&url=${encodeURIComponent(pinUrl)}`);
      if (fallback.data && fallback.data.result) {
        return res.json({ success: true, download_url: fallback.data.result.video || fallback.data.result });
      }
    } catch (e) {}

    res.status(500).json({ error: "Failed to fetch video", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
