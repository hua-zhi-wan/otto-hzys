const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const app = express();
const port = process.env.PORT || 3000;

// Import frontend logic dependencies - use Node.js compatible versions
const { pinyin: pinyinLib } = require('pinyin/lib/pinyin');

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Constants - same as frontend
const TOKENS_PATH = '/static/tokens';
const YSDD_TOKEN_PATH = '/static/ysdd';

// Load static data files
let tokensData, ysddData, chinglishData, subdirFileMap;
let tokenSet, ysddSource, ysddDict, tonedChinglish;

async function loadStaticData() {
  try {
    // Load tokens.json
    const tokensPath = path.join(__dirname, 'public', 'static', 'tokens.json');
    const tokensContent = await fs.readFile(tokensPath, 'utf8');
    tokensData = JSON.parse(tokensContent);
    tokenSet = new Set(tokensData);

    // Load ysdd.json  
    const ysddPath = path.join(__dirname, 'public', 'static', 'ysdd.json');
    const ysddContent = await fs.readFile(ysddPath, 'utf8');
    ysddData = JSON.parse(ysddContent);
    
    // Create ysddSource and ysddDict similar to frontend
    ysddSource = new Map();
    ysddDict = new Map();
    if (Array.isArray(ysddData)) {
      ysddData.forEach(item => {
        if (item.filename && item.pinyin) {
          ysddSource.set(item.pinyin, item.filename);
          ysddDict.set(item.pinyin, item.filename);
        }
      });
    }

    // Load chinglish.json
    const chinglishPath = path.join(__dirname, 'public', 'static', 'chinglish.json');
    const chinglishContent = await fs.readFile(chinglishPath, 'utf8');
    const chinglishRaw = JSON.parse(chinglishContent);
    tonedChinglish = new Map();
    Object.entries(chinglishRaw).forEach(([char, pinyinStr]) => {
      // Split the string into individual pinyin parts (e.g., "AiFu" -> ["Ai", "Fu"])
      const pinyins = pinyinStr.match(/[A-Z][a-z]*/g) || [pinyinStr];
      tonedChinglish.set(char, pinyins.map(p => ({ p: p.toLowerCase(), t: null })));
    });

    // Build subdirFileMap for non-ddb pinyin
    subdirFileMap = new Map();
    const tokensDir = path.join(__dirname, 'public', 'static', 'tokens');
    const subdirs = ['amns', 'ddj', 'dxl', 'hg1', 'hg2', 'hjm', 'hm', 'mb', 'mbo', 'nyyszgr', 'pbb', 'uzi', 'yzd', 'yy'];
    
    for (const subdir of subdirs) {
      try {
        const subdirPath = path.join(tokensDir, subdir);
        const files = await fs.readdir(subdirPath);
        const wavFiles = files.filter(file => file.endsWith('.wav'));
        subdirFileMap.set(subdir, wavFiles);
      } catch (err) {
        // Subdirectory might not exist, that's fine
        subdirFileMap.set(subdir, []);
      }
    }

    console.log('Static data loaded successfully');
  } catch (error) {
    console.error('Failed to load static data:', error);
    throw error;
  }
}

// Helper function to clean text (same as frontend)
function cleanText(text) {
  return text.replace(/[\r\n]/g, '').replace(/\s+/g, ' ');
}

// Simplified Chinese character detection - just split into individual characters
function segmentChinese(text) {
  // For Chinese text, we'll just split into individual characters
  // This matches the frontend behavior which processes character by character
  return Array.from(text);
}

// Convert text to audio sequence (similar to frontend logic)
function textToAudioSequence(text, options = {}) {
  const {
    isYsdd = false,
    useNonDdbPinyin = false,
    isSliced = false
  } = options;

  const cleaned = cleanText(text);
  if (!cleaned) return [];

  let characters;
  if (/[\u4e00-\u9fff]/.test(cleaned)) {
    // Contains Chinese characters - split into individual characters
    characters = segmentChinese(cleaned);
  } else {
    // No Chinese characters - treat as regular text
    characters = Array.from(cleaned);
  }

  const tonedPinyins = characters.map(v => {
    if (v.length > 1 && /^[A-Z]+$/i.test(v)) {
      return { p: v, t: null, isEnglishWord: true };
    }
    // Use the pinyin library correctly
    const result = pinyinLib(v, { style: 'tone2' });
    if (result && result[0] && result[0][0]) {
      const [, p, t] = (result[0][0].match(/^([a-z]+)([0-9]?)$/) || [null, v, null]);
      return { p, t: { [null]: null, [""]: 0, 1: 1, 2: 2, 3: 3, 4: 4 }[t] };
    }
    return { p: v, t: null };
  });

  // Simplified ysdd parsing for backend
  function ysddParse(tonedPinyins) {
    return tonedPinyins.map(item => {
      if (ysddSource.has(item.p)) {
        return { p: item.p, t: null, isYsdd: true };
      }
      return item;
    });
  }

  const ysdded = isYsdd ? ysddParse(tonedPinyins) : tonedPinyins;

  const chinglishfied = ysdded.reduce((prev, v) => {
    if (v.isEnglishWord) {
      if (isYsdd && ysddSource.has(v.p.toLowerCase())) {
        prev.push({ p: v.p.toLowerCase(), t: null, isYsdd: true });
        return prev;
      }
      for (const ch of v.p) {
        const mapped = tonedChinglish.get(ch);
        if (mapped) {
          prev.push(...mapped);
        } else {
          prev.push({ p: ch.toLowerCase(), t: null, isYsdd: false });
        }
      }
      return prev;
    }

    if (!v.p.match(/^[.A-Z0-9!？；：、...，。()\[\]{}_+=\-*/\\\\|~@#$%^&'"<>]$/)) {
      prev.push(v);
      return prev;
    }

    prev.push(...(tonedChinglish.get(v.p) || [{ p: '_', t: null }]));
    return prev;
  }, []);

  const sliced = chinglishfied.reduce((prev, { p, isYsdd }) => {
    if (isYsdd) {
      if (ysddSource.has(p)) {
        prev.push(`<${ysddSource.get(p)}>`);
      } else if (tokenSet.has(p)) {
        prev.push(p);
      } else {
        prev.push('_');
      }
    } else {
      if (tokenSet.has(p)) {
        prev.push(p);
      } else {
        prev.push('_');
      }
    }
    if (isSliced) prev.push('_');
    return prev;
  }, []);

  return sliced;
}

// Helper function to read audio file
async function readAudioFile(filePath) {
  try {
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch (error) {
    console.warn(`Audio file not found: ${filePath}`);
    // Return silent audio as fallback
    const silentPath = path.join(__dirname, 'public', 'static', 'tokens', '_.wav');
    try {
      return await fs.readFile(silentPath);
    } catch (silentError) {
      console.error('Silent audio fallback also failed');
      return Buffer.alloc(0);
    }
  }
}

// Main text-to-wav endpoint
app.post('/api/text-to-wav', async (req, res) => {
  try {
    const { text, isYsdd = false, useNonDdbPinyin = false, isSliced = false } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid text parameter' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: 'Text too long (max 1000 characters)' });
    }

    // Convert text to audio sequence
    const audioSequence = textToAudioSequence(text, { isYsdd, useNonDdbPinyin, isSliced });
    
    if (audioSequence.length === 0) {
      return res.status(400).json({ error: 'No valid audio sequence generated' });
    }

    // Read all audio files
    const audioBuffers = [];
    for (const item of audioSequence) {
      let filePath;
      
      if (/<.+>/.test(item)) {
        // Original sound track
        const filename = item.replace(/<(.+)>/, '$1');
        filePath = path.join(__dirname, 'public', 'static', 'ysdd', `${filename}.mp3`);
      } else {
        // Regular token
        filePath = path.join(__dirname, 'public', 'static', 'tokens', `${item}.wav`);
      }

      const buffer = await readAudioFile(filePath);
      if (buffer.length > 0) {
        audioBuffers.push(buffer);
      }
    }

    if (audioBuffers.length === 0) {
      return res.status(400).json({ error: 'No audio files found' });
    }

    // For simplicity, we'll concatenate the buffers directly
    // In production, you'd want to use a proper audio library like ffmpeg
    const totalLength = audioBuffers.reduce((sum, buf) => sum + buf.length, 0);
    const resultBuffer = Buffer.concat(audioBuffers, totalLength);

    // Set response headers
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="otto-${Date.now()}.wav"`);
    
    res.send(resultBuffer);

  } catch (error) {
    console.error('Text-to-WAV error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend server is running' });
});

// Start server
async function startServer() {
  try {
    await loadStaticData();
    app.listen(port, () => {
      console.log(`Backend server running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

startServer();