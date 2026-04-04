const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');
const app = express();
const port = process.env.PORT || 3000;

// Import frontend logic dependencies - use Node.js compatible versions
const { pinyin: pinyinLib } = require('pinyin/lib/pinyin');
const jsPinyin = require('js-pinyin');

// Middleware
app.use(express.json({ limit: '10mb' }));

// Load static data files
let tokensData, ysddData, subdirFileMap;
let tokenSet, ysddSource, ysddDict, tonedChinglish, ysddLastWordLengthIndex;

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
    ysddLastWordLengthIndex = new Map();
    
    // ysdd.json is an object where keys are filenames and values are arrays of phrases.
    // Mirror the frontend by deriving pinyin indexes from each phrase.
    if (typeof ysddData === 'object' && ysddData !== null) {
      Object.entries(ysddData).forEach(([filename, phrases]) => {
        if (Array.isArray(phrases)) {
          phrases.forEach(phrase => {
            const fullChars = jsPinyin.getFullChars(phrase);
            ysddDict.set(fullChars, filename);

            const normalPinyin = pinyinLib(phrase, { style: 'normal' }).map(v => v[0]);
            ysddSource.set(normalPinyin.join(''), filename);

            const lastWord = normalPinyin[normalPinyin.length - 1];
            if (!ysddLastWordLengthIndex.has(lastWord)) {
              ysddLastWordLengthIndex.set(lastWord, new Map());
            }
            if (!ysddLastWordLengthIndex.get(lastWord).has(normalPinyin.length)) {
              ysddLastWordLengthIndex.get(lastWord).set(normalPinyin.length, []);
            }
            ysddLastWordLengthIndex.get(lastWord).get(normalPinyin.length).push(normalPinyin);
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
      tonedChinglish.set(char.toUpperCase(), pinyins.map(p => ({ p: p.toLowerCase(), t: null, isYsdd: false })));
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

function getChinglishKey(value) {
  if (typeof value !== 'string' || value.length === 0) return value;
  return /^[a-z]$/i.test(value) ? value.toUpperCase() : value;
}

function segmentText(text) {
  const characters = [];
  const parts = text.split(/([a-zA-Z]+)/);

  for (const part of parts) {
    if (!part) continue;

    if (/^[a-zA-Z]+$/.test(part)) {
      // Match frontend behavior: preserve contiguous English words as one token.
      characters.push(part.toUpperCase());
      continue;
    }

    const cleaned = part.toUpperCase().replace(/[^.0-9a-zA-Z\u4e00-\u9fff]+/g, ' ');
    characters.push(...Array.from(cleaned));
  }

  return characters;
}

// Match the frontend dynamic-programming YSDD parse behavior.
function ysddParse(tonedPinyins, isYsddFlag) {
  if (!isYsddFlag || tonedPinyins.length === 0) {
    return tonedPinyins;
  }

  const optMatch = [];
  const optMatchCount = [];

  function setOptMatch(fromIndex, matchCount, tonedPinyin, ysddKey) {
    const toIndex = fromIndex + matchCount + !matchCount;
    if (!optMatch[fromIndex]) {
      optMatch[toIndex] = [{
        p: tonedPinyin?.p || ysddKey,
        t: tonedPinyin?.t || null,
        isYsdd: !!ysddKey,
        isEnglishWord: tonedPinyin?.isEnglishWord || false
      }];
      optMatchCount[toIndex] = matchCount;
      return;
    }

    const optNew = [];
    optNew.push(...optMatch[fromIndex]);
    const countNew = optMatchCount[fromIndex] + matchCount;

    if (matchCount) {
      optNew.push({ p: ysddKey, t: null, isYsdd: true });
    } else {
      optNew.push({
        p: tonedPinyin.p,
        t: tonedPinyin.t,
        isYsdd: false,
        isEnglishWord: tonedPinyin.isEnglishWord || false
      });
    }

    optMatch[toIndex] = optNew;
    optMatchCount[toIndex] = countNew;
  }

  for (let i = 0; i < tonedPinyins.length; i += 1) {
    const lastWord = tonedPinyins[i];
    const lastWordYsdd = ysddLastWordLengthIndex.get(lastWord.p);
    const optionalMatches = [];

    if (lastWordYsdd) {
      for (const length of lastWordYsdd.keys()) {
        for (const woTonePinyins of lastWordYsdd.get(length)) {
          let isEqual = true;
          for (let j = 0; j < length - 1; j += 1) {
            if (woTonePinyins[j] === tonedPinyins[i - length + j + 1]?.p) continue;
            isEqual = false;
            break;
          }
          if (!isEqual) continue;
          optionalMatches.push({ length, woTonePinyins });
        }
      }
    }

    optionalMatches.sort((a, b) => a.length - b.length);
    let selectMatchLength = optMatchCount[i - 1] || 0;
    let selectMatch = null;

    for (const { length, woTonePinyins } of optionalMatches) {
      if ((optMatchCount[i - length] || 0) + length < selectMatchLength) continue;
      selectMatchLength = (optMatchCount[i - length] || 0) + length;
      selectMatch = woTonePinyins;
    }

    if (!selectMatch) {
      setOptMatch(i - 1, 0, lastWord, null);
    } else {
      setOptMatch(i - selectMatch.length, selectMatch.length, null, selectMatch.join(''));
    }
  }

  return optMatch.pop();
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

  const characters = segmentText(cleaned);

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

  const ysdded = ysddParse(tonedPinyins, isYsdd);

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
        // Match frontend behavior for English words: try raw letter key first,
        // then fall back to the plain letter token.
        const mapped = tonedChinglish.get(ch);
        if (mapped) {
          prev.push(...mapped);
        } else {
          prev.push({ p: ch.toLowerCase(), t: null, isYsdd: false });
        }
      }
      return prev;
    }

    if (!v.p.match(/^[.A-Za-z0-9!？；：、...，。(){}_=+\-*/\\|~@#$%^&'"<>]$/)) {
      prev.push(v);
      return prev;
    }

    prev.push(...(tonedChinglish.get(getChinglishKey(v.p)) || [{ p: '_', t: null }]));
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
      
      if (filename) {
        prev.push(`<${filename}>`);
      } else {
        if (tokenSet.has(p)) {
          prev.push(p);
        } else if (prev[prev.length - 1] === '_') {
          return prev;
        } else {
          prev.push('_');
        }
      }
    } else {
      if (tokenSet.has(p)) {
        prev.push(p);
      } else if (prev[prev.length - 1] === '_') {
        return prev;
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

async function resolveAudioFilePath(filePath) {
  try {
    await fs.access(filePath);
    return filePath;
  } catch (error) {
    console.warn(`Audio file not found: ${filePath}`);
    return path.join(__dirname, 'public', 'static', 'tokens', '_.wav');
  }
}

async function concatAudioFilesToWav(filePaths) {
  const ffmpegArgs = [
    '-hide_banner',
    '-loglevel', 'error'
  ];

  for (const filePath of filePaths) {
    ffmpegArgs.push('-i', path.resolve(filePath));
  }

  const filterInputs = filePaths.map((_, index) => `[${index}:a]`).join('');
  ffmpegArgs.push(
    '-filter_complex',
    `${filterInputs}concat=n=${filePaths.length}:v=0:a=1[aout]`,
    '-map', '[aout]',
    '-ac', '1',
    '-ar', '44100',
    '-f', 'wav',
    'pipe:1'
  );

  const outputBuffer = await new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    const stdoutChunks = [];
    const stderrChunks = [];

    ffmpeg.stdout.on('data', chunk => stdoutChunks.push(chunk));
    ffmpeg.stderr.on('data', chunk => stderrChunks.push(chunk));
    ffmpeg.on('error', reject);
    ffmpeg.on('close', code => {
      if (code === 0) {
        resolve(Buffer.concat(stdoutChunks));
        return;
      }

      reject(new Error(`ffmpeg exited with code ${code}: ${Buffer.concat(stderrChunks).toString('utf8')}`));
    });
  });

  return outputBuffer;
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

    // Resolve all source audio files and let ffmpeg produce a valid single WAV.
    const audioFilePaths = [];
    for (const item of audioSequence) {
      const filePath = getAudioFilePath(item, useNonDdbPinyin);
      audioFilePaths.push(await resolveAudioFilePath(filePath));
    }

    if (audioFilePaths.length === 0) {
      return res.status(400).json({ error: 'No audio files found' });
    }

    const resultBuffer = await concatAudioFilesToWav(audioFilePaths);

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

// Catch-all route for non-API requests - return JSON error instead of HTML
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found', 
    message: 'This backend server only provides API endpoints. Valid endpoints: POST /api/text-to-wav, GET /health' 
  });
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
