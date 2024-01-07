<template>
  <div class="common-layout">
    <el-container>
      <el-header>
        <h2>
          <el-avatar src="/static/img/lizi.jpg" size="small"></el-avatar>
          大电老师活字印刷 <small> 纯前端版{{ version }}</small>
        </h2>
      </el-header>
      <el-main>
        <el-row>
          <el-col :lg="3" :xl="4">
          </el-col>
          <el-col :lg="18" :xl="16">
            <h4>参数设置</h4>
            <el-card shadow="never">
              <el-form :model="formData" label-width="auto" label-position="left">
                <el-form-item label="转换文本">
                  <el-input v-model="formData.text" type="textarea" rows="4"/>
                </el-form-item>
                <el-form-item label="原声大碟模式">
                  <el-switch v-model="formData.isYsdd"/>
                </el-form-item>
                <el-form-item label="字间添加短暂停顿">
                  <el-switch v-model="formData.isSliced"/>
                </el-form-item>
                <el-form-item label="生成">
                  <el-button type="primary" @click="generate" :loading="!isComplete">{{
                      isComplete ? "生成otto鬼叫" : "生成中"
                    }}
                  </el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <h4>生成音频</h4>
            <el-card shadow="never" :header="'效果组 - 已加载音频：' + audioSrc.name">
              <el-collapse>
                <el-collapse-item title="均衡">
                  <el-form :model="audioEffects.eq" label-width="auto" label-position="left" @change="applyEffects">
                    <el-form-item label="开启">
                      <el-switch v-model="audioEffects.eq.enable"/>
                    </el-form-item>
                    <el-form-item label="低切频率">
                      <el-slider v-model="audioEffects.eq.options.lowFrequency" show-input :min="0" :max="1000"
                                 :step="1"/>
                    </el-form-item>
                    <el-form-item label="高切频率">
                      <el-slider v-model="audioEffects.eq.options.highFrequency" show-input :min="10000" :max="22050"
                                 :step="10"/>
                    </el-form-item>
                    <el-form-item label="低切锐度">
                      <el-slider v-model="audioEffects.eq.options.lowPeak" :max="20" :min="0.001" :step="0.001"
                                 show-input/>
                    </el-form-item>
                    <el-form-item label="高切锐度">
                      <el-slider v-model="audioEffects.eq.options.highPeak" :max="20" :min="0.001" :step="0.001"
                                 show-input/>
                    </el-form-item>
                  </el-form>
                </el-collapse-item>
                <el-collapse-item title="压缩">
                  <el-form :model="audioEffects.comp" label-width="auto" label-position="left" @change="applyEffects">
                    <el-form-item label="开启">
                      <el-switch v-model="audioEffects.comp.enable"/>
                    </el-form-item>
                    <el-form-item label="阈值">
                      <el-slider v-model="audioEffects.comp.options.threshold" show-input :max="0" :min="-50"
                                 :step="0.01"/>
                    </el-form-item>
                    <el-form-item label="拐点">
                      <el-slider v-model="audioEffects.comp.options.knee" show-input :min="0" :max="40" :step="1"/>
                    </el-form-item>
                    <el-form-item label="触发时间">
                      <el-slider v-model="audioEffects.comp.options.attack" show-input :min="0" :max="1" :step="0.01"/>
                    </el-form-item>
                    <el-form-item label="释放时间">
                      <el-slider v-model="audioEffects.comp.options.release" show-input :min="0" :max="1"
                                 :step="0.01"/>
                    </el-form-item>
                    <el-form-item label="压缩比">
                      <el-slider v-model="audioEffects.comp.options.ratio" show-input :min="1" :max="20" :step="0.01"/>
                    </el-form-item>
                  </el-form>
                </el-collapse-item>
                <el-collapse-item title="延迟">
                  <el-form :model="audioEffects.delay" label-width="auto" label-position="left" @change="applyEffects">
                    <el-form-item label="开启">
                      <el-switch v-model="audioEffects.delay.enable"/>
                    </el-form-item>
                    <el-form-item label="反弹">
                      <el-slider v-model="audioEffects.delay.options.feedback" show-input :min="0" :max="0.6"
                                 :step="0.01"/>
                    </el-form-item>
                    <el-form-item label="时长">
                      <el-slider v-model="audioEffects.delay.options.time" show-input :min="0" :max="1" :step="0.01"/>
                    </el-form-item>
                    <el-form-item label="干湿比">
                      <el-slider v-model="audioEffects.delay.options.mix" show-input :min="0" :max="1" :step="0.01"/>
                    </el-form-item>
                  </el-form>
                </el-collapse-item>
                <el-collapse-item title="混响">
                  <el-form :model="audioEffects.reverb" label-width="auto" label-position="left" @change="applyEffects">
                    <el-form-item label="开启">
                      <el-switch v-model="audioEffects.reverb.enable"/>
                    </el-form-item>
                    <el-form-item label="时长">
                      <el-slider v-model="audioEffects.reverb.options.time" show-input :min="0" :max="3"
                                 :step="0.01"/>
                    </el-form-item>
                    <el-form-item label="衰减">
                      <el-slider v-model="audioEffects.reverb.options.decay" show-input :min="0" :max="3"
                                 :step="0.01"/>
                    </el-form-item>
                    <el-form-item label="干湿比">
                      <el-slider v-model="audioEffects.reverb.options.mix" show-input :min="0" :max="1" :step="0.01"/>
                    </el-form-item>
                  </el-form>
                </el-collapse-item>
              </el-collapse>
              <el-divider/>
              <el-button-group>
                <DeBounceButton @click="soundPlay({isReversed: false})" type="success">播放</DeBounceButton>
                <DeBounceButton @click="soundPlay({isReversed: true})" type="warning">倒放</DeBounceButton>
                <DeBounceButton @click="soundStop()" type="danger">停止播放</DeBounceButton>
                <el-button @click="downloadSound()" type="primary">下载原音频</el-button>
                <el-button @click="downloadReversed()" type="info">下载倒放音频</el-button>
              </el-button-group>
            </el-card>

            <h4>艺术殿堂</h4>
            <el-card shadow="never">
              <el-space wrap>
                <el-avatar src="/static/img/lizi.jpg" size="large"
                           @click="showArt('/static/music/Bones - 欠债调音师.mp3', 'Bones - 欠债调音师')"/>
                <el-avatar src="/static/img/rk5.jpg" size="large"
                           @click="showArt('/static/music/I Got Smoke - V在燃烧.mp3', 'I Got Smoke - V在燃烧')"/>
                <el-avatar src="/static/img/ccvbn.jpg" size="large"
                           @click="showArt('/static/music/Ccvbn -（完）电棍：波西唢呐狂想曲.mp3', 'Ccvbn -（完）电棍：♿波西唢呐狂想曲♿')"/>
                <div>点击头像听音乐</div>
              </el-space>
            </el-card>
            <h4>注意事项</h4>
            <el-card shadow="never">
              <el-space wrap class="proj-info">
                <ul>
                  <li>
                    <div>
                      原声大碟模式：当匹配到特定拼音会使用原声大碟，当前版本的原声大碟包括以下内容
                      <ul>
                        <li v-for="item of ysddShow.value" :key="item">{{ item }}</li>
                      </ul>
                    </div>
                  </li>
                  <li>
                    <div>
                      字间停顿：开启后会在每字中间增加0.25秒的空白时间，方便将生成结果作为剪辑素材。
                    </div>
                  </li>
                  <li>
                    <div>
                      下载音频仅支持下载效果通道前的音频。
                    </div>
                  </li>
                  <li>
                    <div>
                      感谢光临并使用本项目。如果对项目有其他构想或建议或Bug也欢迎到Github链接下方提Issue，合理的建议会及时采纳。
                    </div>
                  </li>
                </ul>
              </el-space>
            </el-card>
            <el-divider/>
            <el-descriptions title="作品信息"
                             border
                             :column="2">
              <el-descriptions-item label="作者">
                会唱歌的花枝丸
                的
                <el-link href="https://space.bilibili.com/496956009" type="primary">Bilibili</el-link>
                和
                <el-link href="https://github.com/HanaYabuki" type="primary">Github</el-link>
              </el-descriptions-item>
              <el-descriptions-item label="Github仓库">
                <el-link href="https://github.com/HanaYabuki/otto-hzys/tree/master" type="primary">
                  HanaYabuki/otto-hzys
                </el-link>
              </el-descriptions-item>
              <el-descriptions-item label="鸣谢">
                <el-link href="https://github.com/DSP-8192" type="primary">DSP-8192</el-link>
                和
                <el-link href="https://github.com/sakaneko117" type="primary">sakaneko117</el-link>
                (两位原作者) 提供了原版的完整实现 以及部分开发素材
                <br>
                <el-link href="https://github.com/TheUnknownThing" type="primary">TheUnknownThing</el-link>
                新增了音频倒放和倒放下载功能 增加了更多原声大碟
              </el-descriptions-item>
            </el-descriptions>
          </el-col>
        </el-row>
      </el-main>
      <el-footer>

      </el-footer>
    </el-container>
  </div>
</template>

<script>
import Crunker from 'crunker'
import {reactive, ref} from 'vue'
import pinyin from "js-pinyin"
import pinyin2 from "pinyin"
import Pizzicato from 'pizzicato'
import {ElMessage} from 'element-plus'

const TOKENS_PATH = '/static/tokens/'
const YSDD_TOKEN_PATH = '/static/ysddTokens/'

const crunker = new Crunker()

export default {
  setup() {
    const formData = reactive({
      text: '大家好啊，我是说的道理',
      isYsdd: true,
      isSliced: false,
    })
    const isComplete = ref(true)
    const version = ref('v1.2')
    const audioSrc = reactive({value: '#', blob: undefined, name: '#'})
    const ysddShow = reactive({value: []})

    function configInit() {
      const tokenSet = new Set()
      fetch('/static/tokens.json')
          .then((resp) => resp.json())
          .then((data) => {
            for (const v of data) {
              tokenSet.add(v)
            }
          })
          .catch(err => console.error('加载初始配置文件失败', err))
      const ysddDict = new Map()
      const ysddLastWordLengthIndex = new Map(), ysddSource = new Map()
      fetch('/static/ysdd.json')
          .then((resp) => resp.json())
          .then((data) => {
            for (const [filename, textlist] of Object.entries(data)) {
              for (const text of textlist) {
                const py = pinyin.getFullChars(text)
                ysddDict.set(py, filename)
              }
              ysddShow.value.push(...textlist)
            }
            for (const [filename, textlist] of Object.entries(data)) {
              for (const text of textlist) {
                const py2 = pinyin2(text, {style: "normal"}).map(v => v[0])
                ysddSource.set(py2.join(""), filename)
                const lastword = py2[py2.length - 1]
                !ysddLastWordLengthIndex.has(lastword) && ysddLastWordLengthIndex.set(lastword, new Map())
                !ysddLastWordLengthIndex.get(lastword).has(py2.length) && ysddLastWordLengthIndex.get(lastword).set(py2.length, [])
                ysddLastWordLengthIndex.get(lastword).get(py2.length).push(py2)
              }
            }
          })
          .catch(err => console.error('加载原声大碟配置失败', err))
      const chinglish = new Map()
      const tonedChinglish = new Map()
      fetch('/static/chinglish.json')
          .then((resp) => resp.json())
          .then((data) => {
            for (const [key, value] of Object.entries(data))
              chinglish.set(key, value)
            for (const [key, value] of Object.entries(data)) {
              const newValue = value
                  .match(/[A-Z][a-z]*/g)
                  .map(v => ({p: v.toLowerCase(), t: null, isYsdd: false}))
              tonedChinglish.set(key.toUpperCase(), newValue)
            }
          })
          .catch(err => console.error('加载中式英文读音配置失败', err))
      const tokenDict = new Map()
      return {
        tokenSet, ysddDict, chinglish, tokenDict,
        ysddLastWordLengthIndex, ysddSource, tonedChinglish
      }
    }

    const {
      tokenSet, ysddDict, chinglish, tokenDict,
      ysddLastWordLengthIndex, ysddSource, tonedChinglish
    } = configInit()

    async function generate() {
      // 判空
      if (formData.text === "") return

      // 将英文字母转为拼音，保存为[xxx]，防止插入空白
      const chinglishifyed = formData.text
          .replace(/[a-zA-Z0-9.]/g, (m) => `<${m.toLowerCase().charCodeAt(0)}>`)
          .replace(/<[0-9]+>/g, (m) => `[${chinglish.get(String.fromCharCode(parseInt(m.slice(1, -1))))}]`)
      console.log(chinglishifyed)

      // 将汉字转为拼音，过滤不可识别标识
      const purePinyin = pinyin.getFullChars(chinglishifyed).replace(/[^a-zA-Z[\]]/g, '');
      // 将[xxx]放入短数组中
      const pinyinTokens = purePinyin.split(/(?=\[)|(?<=])/).map(i => /\[.+]/.test(i) ? [i.slice(1, -1)] : i)
      console.log(pinyinTokens)

      // 匹配原声大碟，将完整句子替换为原声大碟
      function ysdd(pinyinTokens) {
        return pinyinTokens.map((item) => {
          if (typeof (item) === 'string') {
            return [...ysddDict.entries()].reduce((total, item) => {
              const regexp = new RegExp(item[0], 'g')
              return total.replace(regexp, `<${item[1]}>`)
            }, item)
          } else {
            return item
          }
        })
      }

      const tokens = formData.isYsdd ? (ysdd(pinyinTokens)) : pinyinTokens

      // 切分小音频，将非整块的音频全部切开，整块音频不变
      const cut = [];
      for (const v of tokens) {
        if (typeof (v) === 'string') {
          const tmp = v.split(/(?=<)|(?<=>)|(?=[A-Z])/).filter(i => i !== '')
          cut.push(...tmp)
        } else {
          const tmp = v[0].split(/(?=[A-Z])/)
          cut.push(tmp)
        }
      }
      console.log('cut', cut)

      // 生成最终的可构造音频序列
      function slice(cut, flag) {
        const tmp = [];
        for (const v of cut) {
          if (typeof (v) === 'string') {
            tmp.push(v)
          } else {
            tmp.push(...v)
          }
          if (flag) tmp.push('_')
        }
        return tmp
      }

      let sliced = slice(cut, formData.isSliced)
          .map(i => i.toLowerCase())
          .filter(i => tokenSet.has(i) || /<.+>|_/.test(i))
      console.log('sliced', sliced)

      /* 20240106 更换的可构造音频序列生成 BEGIN */
      // 小写字母转换为大写字母，非中英数字（含点）字符转换为空
      // 大小写之后用来区分是 拼音 还是 chinglish字母
      const characters = Array.from(formData.text
          .toUpperCase()
          .replace(/[^.0-9a-zA-Z\u4e00-\u9fff]+/g, " "));
      const tonedPinyins = characters.map(v => {
        const [, p, t] = (pinyin2(v, {style: "tone2"})[0][0].match(/^([a-z]+)([0-9]?)$/) || [null, v, null]);
        return {p, t: {[null]:null, [""]:0, 1:1, 2:2, 3:3, 4:4}[t]}
      });
      console.log("20240106 tonedPinyins", tonedPinyins);

      // 无声调匹配活字印刷
      function ysddParse(tonedPinyins) {
        // 临时保存最优匹配信息和长度
        const optMatch = [], optMatchCount = [];
        function setOptMatch(fromIndex, matchCount, tonedPinyin, ysddKey) {
          const toIndex = fromIndex + matchCount + !matchCount;
          if (!optMatch[fromIndex]) {
            optMatch[toIndex] = [{p: tonedPinyin?.p || ysddKey, t: tonedPinyin?.t || null, isYsdd: !!ysddKey}];
            optMatchCount[toIndex] = matchCount;
            return
          }
          const optNew = [];
          optNew.push(...optMatch[fromIndex]);
          const countNew = optMatchCount[fromIndex] + matchCount;
          if (matchCount) {
            optNew.push({p: ysddKey, t: null, isYsdd: true});
          } else {
            optNew.push({p: tonedPinyin.p, t: tonedPinyin.t, isYsdd: false});
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
                let is_equal = true;
                for (let j = 0; j < length - 1; j += 1){
                  if (woTonePinyins[j] === tonedPinyins[i - length + j + 1]?.p) continue;
                  is_equal = false;
                  break;
                }
                if (!is_equal) continue;
                optionalMatches.push({length, woTonePinyins});
              }
            }
          }
          optionalMatches.sort((a, b) => a.length - b.length);
          // 将候选的匹配初始化为直接追加单字
          // 即：如果所有匹配的selectMatchLength都比直接追加单字低就直接追加单字
          let selectMatchLength = optMatchCount[i - 1] || 0, selectMatch = null;
          for (const {length, woTonePinyins} of optionalMatches) {
            if ((optMatchCount[i - length] || 0) + length < selectMatchLength) continue;
            selectMatchLength = (optMatchCount[i - length] || 0) + length;
            selectMatch = woTonePinyins;
          }
          if (!selectMatch) {
            setOptMatch(i - 1, 0, lastWord, null);
          } else {
            setOptMatch(i - selectMatch.length, selectMatch.length, null, selectMatch.join(""));
          }
        }
        return optMatch.pop()
      }
      const ysdded = ysddParse(tonedPinyins);

      // 数字和英文字母（含.）转拼音
      console.log("20240106 ysdded", ysdded);
      const chinglishfied = ysdded.reduce((prev, v) => {
        if(!v.p.match(/^[.A-Z0-9]$/)) {
          prev.push(v);
          return prev
        }
        prev.push(...tonedChinglish.get(v.p));
        return prev
      }, []);
      console.log("20240106 chinglishfied", chinglishfied);

      // 合并连续出现的短暂停顿
      sliced = chinglishfied.reduce((prev, {p, isYsdd}) => {
        if (isYsdd) prev.push(`<${ysddSource.get(p)}>`)
        else if (tokenSet.has(p)) prev.push(p);
        else if (prev[prev.length - 1] === "_") return prev;
        else prev.push("_");
        if (formData.isSliced) prev.push("_");
        return prev
      }, []);
      console.log("20240106 sliced", sliced);
      /* 20240106 更换的可构造音频序列生成 END */

      // 等待处理
      isComplete.value = false

      // 缓存音频素材，防止重复请求
      const tmpFetchList = [...new Set(sliced).keys(), '_']
      await Promise.all(
          tmpFetchList
              .filter(v => !tokenDict.has(v))
              .map((v) => {
                    const uri = /<.+>/.test(v) ? (`${YSDD_TOKEN_PATH}/${v.replace(/<(.+)>/, '$1')}.mp3`) : (`${TOKENS_PATH}/${v}.wav`)
                    return fetch(uri, {
                      method: 'GET',
                      cache: 'force-cache'
                    }).then(resp => resp.blob()).then(data => [v, data])
                  }
              )
      ).then(arr => {
        for (const [key, blob] of arr) {
          tokenDict.set(key, blob)
        }
        //console.log('TokenDict', tokenDict)
      }).catch(err => {
        console.error(err)
        ElMessage({
          message: '音频请求失败，请尝试关闭迅雷插件，IDM插件等接管浏览器下载行为的软件',
          type: 'error'
        })
      })

      // 音频拼接
      await crunker
          .fetchAudio(...sliced.map(v => tokenDict.get(v)))
          .then((buffers) => crunker.concatAudio(buffers))
          .then((merged) => crunker.export(merged, 'audio/wav'))
          .then((output) => {
            audioSrc.value = output.url
            audioSrc.blob = output.blob
            audioSrc.name = `otto-hzys-${Date.now()}`
            ElMessage({
              message: `答辩<${audioSrc.name}>生成完成，请享用`,
              type: 'success'
            })
          })
          .catch((err) => {
            console.error(err)
            ElMessage({
              message: '音频拼接失败，请重试。或联系作者反馈Bug',
              type: 'error'
            })
          })
          .finally(() => isComplete.value = true)
    }

    const defaultEffects = {
      eq: {
        enable: false,
        options: {
          lowPeak: 10,
          highPeak: 10,
          lowFrequency: 20,
          highFrequency: 20000,
        }
      },
      comp: {
        enable: false,
        options: {
          threshold: -24,
          knee: 30,
          attack: 0.003,
          release: 0.25,
          ratio: 3,
        }
      },
      delay: {
        enable: false,
        options: {
          feedback: 0.3,
          time: 0.3,
          mix: 0.2
        }
      },
      reverb: {
        enable: false,
        options: {
          time: 0.3,
          decay: 1,
          mix: 0.2
        }
      }
    }
    const audioEffects = reactive(JSON.parse(JSON.stringify(defaultEffects)))
    const sound = {value: undefined, effects: []}

    function applyEffects() {
      sound.effects = []
      if (audioEffects.eq.enable) {
        const lowpass = new Pizzicato.Effects.LowPassFilter({
          frequency: audioEffects.eq.options.highFrequency,
          peak: audioEffects.eq.options.highPeak
        })
        const highpass = new Pizzicato.Effects.HighPassFilter({
          frequency: audioEffects.eq.options.lowFrequency,
          peak: audioEffects.eq.options.lowPeak
        })
        sound.effects.push(lowpass, highpass)
      }
      if (audioEffects.comp.enable) {
        const comp = new Pizzicato.Effects.Compressor(audioEffects.comp.options)
        sound.effects.push(comp)
      }
      if (audioEffects.delay.enable) {
        const delay = new Pizzicato.Effects.Delay(audioEffects.delay.options)
        sound.effects.push(delay)
      }
      if (audioEffects.reverb.enable) {
        const delay = new Pizzicato.Effects.Delay({
          ...audioEffects.reverb.options,
          reverse: false
        })
        sound.effects.push(delay)
      }
    }

    function soundPlay({ isReversed }) {
      if (audioSrc.value !== '#') {
        if (sound.value !== undefined && sound.value.playing) {
          sound.value.stop()
        }
        applyEffects();
        sound.value = new Pizzicato.Sound({
          source: 'file',
          options: {
            path: audioSrc.value
          }
        }, () => {
          sound.effects.forEach(eff => sound.value.addEffect(eff));
          // 如果是倒放
          if (isReversed === true) {
            const refAudioBuffer = sound.value.getRawSourceNode().buffer;
            for (let c = 0; c < refAudioBuffer.numberOfChannels; c += 1) {
              refAudioBuffer.getChannelData(c).reverse();
            }
          }
          sound.value.play()
        })
      }
    }

    function soundStop() {
      if (sound.value !== undefined) {
        sound.value.stop()
      }
    }

    function downloadSound() {
      if (audioSrc.blob !== undefined) {
        crunker.download(audioSrc.blob, audioSrc.name)
      }
    }

    function downloadReversed() {
      if (audioSrc.blob !== undefined) {
        var audioContext = Pizzicato.context;
        var request = new XMLHttpRequest();
        request.open('GET', audioSrc.value, true);
        request.responseType = 'arraybuffer';
        request.onload = function () {
          audioContext.decodeAudioData(request.response, function (buffer) {
            var reversedBuffer = reverseBuffer(buffer);
            var blob = bufferToWave(reversedBuffer, buffer.length);
            crunker.download(blob, audioSrc.name + '_reversed');
          });
        };
        request.send();
      }
    }

    function bufferToWave(abuffer, len) {
      var numOfChan = abuffer.numberOfChannels,
          length = len * numOfChan * 2 + 44,
          buffer = new ArrayBuffer(length),
          view = new DataView(buffer),
          channels = [],
          i,
          sample,
          offset = 0,
          pos = 0;

      setUint32(0x46464952); // "RIFF"
      setUint32(length - 8); // file length - 8
      setUint32(0x45564157); // "WAVE"

      setUint32(0x20746d66); // fmt子块
      setUint32(16); // length = 16
      setUint16(1); // PCM (uncompressed)
      setUint16(numOfChan);
      setUint32(abuffer.sampleRate);
      setUint32(abuffer.sampleRate * 2 * numOfChan);
      setUint16(numOfChan * 2);
      setUint16(16);

      setUint32(0x61746164);
      setUint32(length - pos - 4);

      for (i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

      while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
          // interleave channels
          sample = Math.max(-1, Math.min(1, channels[i][offset]));
          sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
          view.setInt16(pos, sample, true);
          pos += 2;
        }
        offset++;
      }

      // create Blob
      return new Blob([buffer], {type: "audio/wav"});

      function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
      }

      function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
      }
    }

    function reverseBuffer(buffer) {
      var audioContext = Pizzicato.context;
      var numberOfChannels = buffer.numberOfChannels;
      var channelData = [];
      for (var i = 0; i < numberOfChannels; i++) {
        channelData[i] = buffer.getChannelData(i).reverse();
      }
      var reversedBuffer = audioContext.createBuffer(
          numberOfChannels,
          buffer.length,
          buffer.sampleRate
      );
      for (var j = 0; j < numberOfChannels; j++) {
        reversedBuffer.getChannelData(j).set(channelData[j]);
      }
      return reversedBuffer;
    }

    function showArt(src, name) {
      audioSrc.value = src
      audioSrc.blob = undefined
      audioSrc.name = name
      //soundPlay() //点完后点播放容易导致快速重复点击播放的this.getRawSourceNode is not a function的bug，考虑移除
    }

    return {
      formData,
      isComplete,
      version,
      generate,
      ysddShow,

      audioSrc,
      applyEffects,
      soundPlay,
      downloadReversed,
      audioEffects,
      soundStop,
      downloadSound,
      showArt
    }
  }
}
</script>

<style scoped>
h1, h2, h3, h4, h5, h6 {
  color: #606266;
}

div {
  color: #606266;
}

h2 {
  text-align: center;
}

.proj-info {
  line-height: 1.5rem;
}
</style>