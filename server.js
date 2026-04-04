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

// Load static data files
let tokensData, ysddData, subdirFileMap;
let tokenSet, ysddSource, ysddDict, tonedChinglish, ysddPhraseToKey;

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
    // Create reverse mapping from Chinese phrases to YSDD keys
    ysddPhraseToKey = new Map();
    
    // ysdd.json is an object where keys are pinyin sequences and values are arrays of Chinese phrases
    // We need to create mappings from pinyin to filenames and from Chinese phrases to pinyin keys
    if (typeof ysddData === 'object' && ysddData !== null) {
      Object.entries(ysddData).forEach(([pinyinKey, phrases]) => {
        if (Array.isArray(phrases)) {
          // Use the pinyin key as the filename for YSDD audio files
          ysddSource.set(pinyinKey, pinyinKey);
          ysddDict.set(pinyinKey, pinyinKey);
          
          // Create reverse mapping from Chinese phrases to pinyin keys
          phrases.forEach(phrase => {
            ysddPhraseToKey.set(phrase, pinyinKey);
          });
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

// Enhanced ysdd parsing for backend with phrase matching
function ysddParse(tonedPinyins, originalText, isYsddFlag) {
  if (!isYsddFlag || tonedPinyins.length === 0) {
    return tonedPinyins;
  }
  
  // First, try to match the entire original text against YSDD phrases
  if (originalText && ysddPhraseToKey.has(originalText)) {
    const pinyinKey = ysddPhraseToKey.get(originalText);
    return [{ p: pinyinKey, t: null, isYsdd: true }];
  }
  
  // For partial matching, we'll use the character-by-character approach
  const result = [];
  let i = 0;
  
  while (i < tonedPinyins.length) {
    let matched = false;
    
    // Try to match the longest possible phrase first (check from longest to shortest)
    // Maximum reasonable phrase length (avoid excessive computation)
    const maxPhraseLength = Math.min(10, tonedPinyins.length - i);
    
    for (let phraseLength = maxPhraseLength; phraseLength >= 1; phraseLength--) {
      if (i + phraseLength > tonedPinyins.length) continue;
      
      // Build both full pinyin and abbreviated pinyin for this phrase
      const phrasePinyinParts = [];
      const phraseAbbrevParts = [];
      let hasEnglishWord = false;
      
      for (let j = 0; j < phraseLength; j++) {
        const item = tonedPinyins[i + j];
        phrasePinyinParts.push(item.p.toLowerCase());
        if (item.isEnglishWord) {
          hasEnglishWord = true;
          // For English words, use the word itself as both full and abbreviated
          phraseAbbrevParts.push(item.p.toLowerCase());
        } else {
          // For Chinese characters, get the first letter of pinyin for abbreviation
          const firstLetter = item.p.toLowerCase().charAt(0);
          phraseAbbrevParts.push(firstLetter);
        }
      }
      
      const fullPinyin = phrasePinyinParts.join('');
      const abbrevPinyin = phraseAbbrevParts.join('');
      
      // Check if either full or abbreviated pinyin exists in ysddDict
      let matchKey = null;
      if (ysddDict.has(fullPinyin)) {
        matchKey = fullPinyin;
      } else if (ysddDict.has(abbrevPinyin)) {
        matchKey = abbrevPinyin;
      }
      
      if (matchKey) {
        // Found a match! Add as YSDD item
        result.push({
          p: matchKey,
          t: null,
          isYsdd: true,
          isEnglishWord: hasEnglishWord
        });
        i += phraseLength;
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // No phrase match found, add the current item as-is
      result.push(tonedPinyins[i]);
      i++;
    }
  }
  
  return result;
}

// Convert text to audio sequence (similar to frontend logic)
function textToAudioSequence(text, options = {}) {
  const {
    isYsdd = false,
    isSliced = false
    // useNonDdbPinyin is not needed here as it only affects audio file selection, not sequence generation
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

  const ysdded = ysddParse(tonedPinyins, cleaned, isYsdd);

  const chinglishfied = ysdded.reduce((prev, v) => {
    if (v.isEnglishWord) {
      if (isYsdd) {
        // Check for English word in YSDD
        const lowerWord = v.p.toLowerCase();
        if (ysddSource.has(lowerWord)) {
          prev.push({ p: lowerWord, t: null, isYsdd: true });
          return prev;
        }
        if (ysddDict.has(lowerWord)) {
          prev.push({ p: lowerWord, t: null, isYsdd: true });
          return prev;
        }
      }
      // Not found in YSDD, convert to chinglish
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

    if (!v.p.match(/^[.A-Z0-9!？；：、...，。(){}_=+\-*/\\|~@#$%^&'"<>]$/)) {
      prev.push(v);
      return prev;
    }

    prev.push(...(tonedChinglish.get(v.p) || [{ p: '_', t: null }]));
    return prev;
  }, []);

  const sliced = chinglishfied.reduce((prev, { p, isYsdd }) => {
    if (isYsdd) {
      // For original sound tracks, try to get filename from ysddSource first
      let filename = ysddSource.get(p);
      
      // If not found in ysddSource, try to find in ysddDict 
      if (!filename && ysddDict.has(p)) {
        filename = ysddDict.get(p);
      }
      
      // If found, use original sound track format
      if (filename) {
        prev.push(`<${filename}>`);
      } else {
        // If not found, fall back to regular token processing
        if (tokenSet.has(p)) {
          prev.push(p);
        } else {
          prev.push('_');
        }
      }
    } else {
      // Regular token processing
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

// Helper function to get audio file path based on useNonDdbPinyin setting
function getAudioFilePath(token, useNonDdbPinyin = false) {
  // If it's an original sound track (<filename>), always use ysddTokens directory
  if (/<.+>/.test(token)) {
    const filename = token.replace(/<(.+)>/, '$1');
    return path.join(__dirname, 'public', 'static', 'ysddTokens', `${filename}.mp3`);
  }

  // For regular tokens
  const baseTokensPath = path.join(__dirname, 'public', 'static', 'tokens');
  
  // If useNonDdbPinyin is false, use direct tokens directory
  if (!useNonDdbPinyin) {
    return path.join(baseTokensPath, `${token}.wav`);
  }

  // If useNonDdbPinyin is true, implement random selection logic
  const subdirs = ['amns', 'ddj', 'dxl', 'hg1', 'hg2', 'hjm', 'hm', 'mb', 'mbo', 'nyyszgr', 'pbb', 'uzi', 'yzd', 'yy'];
  const availableSubdirs = [];
  
  // Check which subdirectories contain this token
  for (const subdir of subdirs) {
    const files = subdirFileMap.get(subdir) || [];
    const matchingFiles = files.filter(file => file.startsWith(token + '_') && file.endsWith('.wav'));
    if (matchingFiles.length > 0) {
      availableSubdirs.push({ subdir, files: matchingFiles });
    }
  }
  
  // If no subdirectories have this token, fall back to direct tokens directory
  if (availableSubdirs.length === 0) {
    return path.join(baseTokensPath, `${token}.wav`);
  }
  
  // Randomly choose between subdirectories and direct tokens directory
  // Total options = available subdirectories + 1 (for direct tokens)
  const totalOptions = availableSubdirs.length + 1;
  const randomChoice = Math.floor(Math.random() * totalOptions);
  
  // If random choice is the last option, use direct tokens directory
  if (randomChoice === availableSubdirs.length) {
    return path.join(baseTokensPath, `${token}.wav`);
  }
  
  // Otherwise, use the selected subdirectory
  const selectedOption = availableSubdirs[randomChoice];
  const randomFile = selectedOption.files[Math.floor(Math.random() * selectedOption.files.length)];
  return path.join(baseTokensPath, selectedOption.subdir, randomFile);
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
    const { 
      text, 
      isYsdd = true, 
      useNonDdbPinyin = true,
      isSliced = false
    } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Invalid text parameter' });
    }

    if (text.length > 1000) {
      return res.status(400).json({ error: 'Text too long (max 1000 characters)' });
    }

    // Convert text to audio sequence (useNonDdbPinyin doesn't affect sequence generation)
    const audioSequence = textToAudioSequence(text, { isYsdd, isSliced });
    
    if (audioSequence.length === 0) {
      return res.status(400).json({ error: 'No valid audio sequence generated' });
    }

    // Read all audio files based on useNonDdbPinyin setting
    const audioBuffers = [];
    for (const item of audioSequence) {
      const filePath = getAudioFilePath(item, useNonDdbPinyin);
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
    // Note: Audio effects are applied client-side using Pizzicato library
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