const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: "Pinterest API is running perfectly!" });
});

app.get('/download', async (req, res) => {
  const pinUrl = req.query.url;
  if (!pinUrl) {
    return res.status(400).json({ error: "Please provide a Pinterest URL using ?url=" });
  }

  try {
    // Cobalt API හරහා ස්ථාවරව සහ වේගයෙන් වීඩියෝ ලින්ක් එක ලබා ගැනීම
    const response = await axios.post('https://api.cobalt.tools/api/json', {
      url: pinUrl,
      vQuality: 'max'
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });

    if (response.data) {
      let downloadUrl = response.data.url;
      
      // බහු සේවා (picker) තිබේ නම් පළමු එක ලබා ගැනීම
      if (!downloadUrl && response.data.picker && response.data.picker.length > 0) {
        downloadUrl = response.data.picker[0].url;
      }

      if (downloadUrl) {
        return res.json({ success: true, download_url: downloadUrl });
      }
    }

    res.status(404).json({ error: "Could not fetch video. Please check the link." });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch video", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
