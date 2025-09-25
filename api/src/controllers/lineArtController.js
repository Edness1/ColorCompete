const LineArt = require('../models/LineArt');
const crypto = require('crypto');

function dailySeed(dateStr) {
  return crypto.createHash('md5').update(dateStr).digest('hex');
}

function pickFrom(arr, seedHash, slice) {
  const segment = seedHash.slice(slice * 2, slice * 2 + 2);
  const idx = parseInt(segment, 16) % arr.length;
  return arr[idx];
}

exports.getDaily = async (req, res) => {
  try {
    const date = (req.query.date || new Date().toISOString().split('T')[0]).substring(0,10);
    let record = await LineArt.findOne({ date });
    if (record) return res.json(record);

    const seed = dailySeed(date);
    const styles = ['standard','anime','matisse'];
    const keywordsPool = ['coloring','challenge','creative','fun','design','shapes','whimsy','pattern','nature','animals'];
    const artStyle = pickFrom(styles, seed, 0);
    const title = `${date} ${artStyle === 'standard' ? 'Daily' : artStyle.charAt(0).toUpperCase()+artStyle.slice(1)} Line Art`;
    const description = 'Auto-generated daily line art placeholder. Replace with curated artwork via admin tool.';
    const baseImage = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&q=80';
    const imageUrl = baseImage;
    const bwImageUrl = baseImage;
    const keywords = [];
    for (let i=0;i<5;i++) keywords.push(pickFrom(keywordsPool, seed, i+1));
    const attribution = 'Placeholder image via Unsplash (demo)';
    record = new LineArt({ date, title, description, imageUrl, bwImageUrl, keywords, artStyle, attribution });
    await record.save();
    res.json(record);
  } catch (err) {
    console.error('Error fetching daily line art', err);
    res.status(500).json({ message: err.message });
  }
};

exports.upsertDaily = async (req, res) => {
  try {
    const { date, title, description, imageUrl, bwImageUrl, keywords, artStyle, attribution } = req.body;
    if (!date || !title || !description || !imageUrl || !bwImageUrl) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const update = await LineArt.findOneAndUpdate(
      { date },
      { title, description, imageUrl, bwImageUrl, keywords: keywords || [], artStyle: artStyle || 'standard', attribution, updated_at: new Date() },
      { new: true, upsert: true }
    );
    res.json(update);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.list = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const items = await LineArt.find().sort({ date: -1 }).limit(limit);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
