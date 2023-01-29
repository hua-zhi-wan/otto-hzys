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
                <el-button @click="soundPlay()" type="success">播放</el-button>
                <el-button @click="soundStop()" type="danger">停止播放</el-button>
                <el-button @click="downloadSound()" type="primary">下载原音频</el-button>
              </el-button-group>
            </el-card>

            <h4>艺术殿堂</h4>
            <el-card shadow="never">
              <el-space wrap>
                <el-avatar src="/static/img/lizi.jpg" size="large"
                           @click="showArt('/static/music/Bones - 欠债调音师.mp3', 'Bones - 欠债调音师')"/>
                <el-avatar src="/static/img/rk5.jpg" size="large"
                           @click="showArt('/static/music/I Got Smoke - V在燃烧.mp3', 'I Got Smoke - V在燃烧')"/>
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
import Pizzicato from 'pizzicato'
import {ElMessage} from 'element-plus'

const TOKENS_PATH = '/static/tokens/'
const YSDD_TOKEN_PATH = '/static/ysddTokens/'

const crunker = new Crunker()

export default {
  setup() {
    const formData = reactive({
      text: '大家好啊，我是说的道理',
      isYsdd: false,
      isSliced: false,
    })
    const isComplete = ref(true)
    const version = ref('v1.1')
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
          })
          .catch(err => console.error('加载原声大碟配置失败', err))
      const chinglish = new Map()
      fetch('/static/chinglish.json')
          .then((resp) => resp.json())
          .then((data) => {
            for (const [key, value] of Object.entries(data))
              chinglish.set(key, value)
          })
          .catch(err => console.error('加载中式英文读音配置失败', err))
      const tokenDict = new Map()
      return {
        tokenSet, ysddDict, chinglish, tokenDict
      }
    }

    const {tokenSet, ysddDict, chinglish, tokenDict} = configInit()

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

      const sliced = slice(cut, formData.isSliced)
          .map(i => i.toLowerCase())
          .filter(i => tokenSet.has(i) || /<.+>|_/.test(i))
      console.log('sliced', sliced)


      // 等待处理
      isComplete.value = false

      // 缓存音频素材，防止重复请求
      const tmpFetchList = [...new Set(sliced).keys(), '_']
      await Promise.all(
          tmpFetchList
              .filter(v => !tokenDict.has(v))
              .map((v) => {
                    const uri = /<.+>/.test(v) ? (`${YSDD_TOKEN_PATH}/${v.replace(/<(.+)>/, '$1')}.wav`) : (`${TOKENS_PATH}/${v}.wav`)
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

    function soundPlay() {
      if (audioSrc.value !== '#') {
        if (sound.value !== undefined && sound.value.playing) {
          sound.value.stop()
        }
        applyEffects()
        sound.value = new Pizzicato.Sound({
          source: 'file',
          options: {
            path: audioSrc.value
          }
        }, () => {
          for (const eff of sound.effects) {
            sound.value.addEffect(eff)
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

    function showArt(src, name) {
      audioSrc.value = src
      audioSrc.blob = undefined
      audioSrc.name = name
      soundPlay()
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
      soundStop,
      audioEffects,
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