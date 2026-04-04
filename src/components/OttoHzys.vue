<template>
  <div class="bk-img" :style="{ backgroundImage: `url(${imgUrl})` }"></div>
  <div class="common-layout">
    <el-container>
      <el-header>
        <h2>
          <el-avatar src="static/img/lizi.jpg" size="small"></el-avatar>
          大电老师活字印刷 <small> 纯前端版{{ version }}</small>
        </h2>
      </el-header>
      <el-main>
        <el-row>
          <el-row></el-row>
          <el-col :lg="3" :xl="4">
          </el-col>
          <el-col :lg="18" :xl="16">
            <el-row>
              <el-col :lg="14">
                <el-card class="blur-card">
                  <template #header>
                    <div class="card-header">
                      <span>参数设置</span>
                    </div>
                  </template>
                  <el-form :model="formData" label-width="auto" label-position="left">
                    <el-form-item label="转换文本">
                      <el-input v-model="formData.text" type="textarea" rows="10" />
                    </el-form-item>
                    <el-form-item label="原声大碟模式">
                      <el-switch v-model="formData.isYsdd" />
                    </el-form-item>
                    <el-form-item label="使用非电棍拼音">
                      <el-switch v-model="formData.useNonDdbPinyin" />
                    </el-form-item>
                    <el-form-item label="字间添加短暂停顿">
                      <el-switch v-model="formData.isSliced" />
                    </el-form-item>
                    <el-form-item label="生成">
                      <el-button type="primary" @click="generate" :loading="!isComplete">{{
                        isComplete ? "生成otto鬼叫" : "生成中"
                      }}
                      </el-button>
                    </el-form-item>
                  </el-form>
                </el-card>
              </el-col>
              <el-col :lg="1">
                <br>
                <br>
              </el-col>
              <el-col :lg="9">
                <el-card class="blur-card">
                  <template #header>
                    <div class="card-header">
                      <span>生成音频</span>
                    </div>
                  </template>
                  <span>{{ '效果组 - 已加载音频：' + audioSrc.name }}</span>
                  <el-divider />
                  <el-collapse>
                    <el-collapse-item title="均衡">
                      <el-form :model="audioEffects.eq" label-width="auto" label-position="left" @change="applyEffects">
                        <el-form-item label="开启">
                          <el-switch v-model="audioEffects.eq.enable" />
                        </el-form-item>
                        <el-form-item label="低切频率">
                          <el-slider v-model="audioEffects.eq.options.lowFrequency" show-input :min="0" :max="1000"
                            :step="1" />
                        </el-form-item>
                        <el-form-item label="高切频率">
                          <el-slider v-model="audioEffects.eq.options.highFrequency" show-input :min="10000"
                            :max="22050" :step="10" />
                        </el-form-item>
                        <el-form-item label="低切锐度">
                          <el-slider v-model="audioEffects.eq.options.lowPeak" :max="20" :min="0.001" :step="0.001"
                            show-input />
                        </el-form-item>
                        <el-form-item label="高切锐度">
                          <el-slider v-model="audioEffects.eq.options.highPeak" :max="20" :min="0.001" :step="0.001"
                            show-input />
                        </el-form-item>
                      </el-form>
                    </el-collapse-item>
                    <el-collapse-item title="压缩">
                      <el-form :model="audioEffects.comp" label-width="auto" label-position="left"
                        @change="applyEffects">
                        <el-form-item label="开启">
                          <el-switch v-model="audioEffects.comp.enable" />
                        </el-form-item>
                        <el-form-item label="阈值">
                          <el-slider v-model="audioEffects.comp.options.threshold" show-input :max="0" :min="-50"
                            :step="0.01" />
                        </el-form-item>
                        <el-form-item label="拐点">
                          <el-slider v-model="audioEffects.comp.options.knee" show-input :min="0" :max="40" :step="1" />
                        </el-form-item>
                        <el-form-item label="触发时间">
                          <el-slider v-model="audioEffects.comp.options.attack" show-input :min="0" :max="1"
                            :step="0.01" />
                        </el-form-item>
                        <el-form-item label="释放时间">
                          <el-slider v-model="audioEffects.comp.options.release" show-input :min="0" :max="1"
                            :step="0.01" />
                        </el-form-item>
                        <el-form-item label="压缩比">
                          <el-slider v-model="audioEffects.comp.options.ratio" show-input :min="1" :max="20"
                            :step="0.01" />
                        </el-form-item>
                      </el-form>
                    </el-collapse-item>
                    <el-collapse-item title="延迟">
                      <el-form :model="audioEffects.delay" label-width="auto" label-position="left"
                        @change="applyEffects">
                        <el-form-item label="开启">
                          <el-switch v-model="audioEffects.delay.enable" />
                        </el-form-item>
                        <el-form-item label="反弹">
                          <el-slider v-model="audioEffects.delay.options.feedback" show-input :min="0" :max="0.6"
                            :step="0.01" />
                        </el-form-item>
                        <el-form-item label="时长">
                          <el-slider v-model="audioEffects.delay.options.time" show-input :min="0" :max="1"
                            :step="0.01" />
                        </el-form-item>
                        <el-form-item label="干湿比">
                          <el-slider v-model="audioEffects.delay.options.mix" show-input :min="0" :max="1"
                            :step="0.01" />
                        </el-form-item>
                      </el-form>
                    </el-collapse-item>
                    <el-collapse-item title="混响">
                      <el-form :model="audioEffects.reverb" label-width="auto" label-position="left"
                        @change="applyEffects">
                        <el-form-item label="开启">
                          <el-switch v-model="audioEffects.reverb.enable" />
                        </el-form-item>
                        <el-form-item label="时长">
                          <el-slider v-model="audioEffects.reverb.options.time" show-input :min="0" :max="3"
                            :step="0.01" />
                        </el-form-item>
                        <el-form-item label="衰减">
                          <el-slider v-model="audioEffects.reverb.options.decay" show-input :min="0" :max="3"
                            :step="0.01" />
                        </el-form-item>
                        <el-form-item label="干湿比">
                          <el-slider v-model="audioEffects.reverb.options.mix" show-input :min="0" :max="1"
                            :step="0.01" />
                        </el-form-item>
                      </el-form>
                    </el-collapse-item>
                  </el-collapse>
                  <el-divider />
                  <el-button-group>
                    <DeBounceButton @click="soundPlay({ isReversed: false })" type="success">播放</DeBounceButton>
                    <DeBounceButton @click="soundPlay({ isReversed: true })" type="warning">倒放</DeBounceButton>
                    <DeBounceButton @click="soundStop()" type="danger">停止播放</DeBounceButton>
                  </el-button-group>
                  <el-button-group>
                    <el-button @click="downloadSound()" type="primary">下载原音频</el-button>
                    <el-button @click="downloadReversed()" type="info">下载倒放音频</el-button>
                  </el-button-group>
                </el-card>
              </el-col>
            </el-row>
            <br>
            <br>
            <el-card class="blur-card">
              <template #header>
                <div class="card-header">
                  <span>注意事项</span>
                </div>
              </template>
              <el-space wrap>
                <ul>
                  <li>
                    <div>
                      原声大碟模式：当匹配到特定拼音会使用原声大碟。
                    </div>
                  </li>
                  <li>
                    <div>
                      使用非电棍拼音：开启后活字印刷会在电棍语音和其他语音中随机选择音频，关闭后仅使用电棍语音。
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
            <br>
            <br>
            <el-card class="blur-card">
              <template #header>
                <div class="card-header">
                  <span>原声大碟一览</span>
                </div>
              </template>
              <el-space wrap alignment="flex-start">
                <el-card v-for="item of ysddShow.value" :key="item" class="blur-card">
                  <template #header>
                    <DeBounceButton @click="previewPlay(item)" type="primary">试听</DeBounceButton>
                  </template>
                  <div v-for="nameitem of item.name" :key="nameitem">
                    {{ nameitem }}
                  </div>
                </el-card>
              </el-space>
            </el-card>
            <br>
            <br>
            <el-card class="blur-card">
              <template #header>
                <div class="card-header">
                  <span>艺术殿堂</span>
                </div>
              </template>
              <el-space wrap>
                <el-avatar src="static/img/lizi.jpg" size="large"
                  @click="showArt('static/music/Bones - 欠债调音师.mp3', 'Bones - 欠债调音师')" />
                <el-avatar src="static/img/rk5.jpg" size="large"
                  @click="showArt('static/music/I Got Smoke - V在燃烧.mp3', 'I Got Smoke - V在燃烧')" />
                <el-avatar src="static/img/ccvbn.jpg" size="large"
                  @click="showArt('static/music/Ccvbn -（完）电棍：波西唢呐狂想曲.mp3', 'Ccvbn -（完）电棍：♿波西唢呐狂想曲♿')" />
                <el-avatar src="static/img/耄耋A梦.jpg" size="large"
                  @click="showArt('static/music/耄耋A梦 - 会唱歌的花枝丸.mp3', '耄耋A梦（不跑调版） - 会唱歌的花枝丸')" />
                <div>点击头像加载音乐</div>
              </el-space>
            </el-card>
            <el-divider />

            <el-card class="blur-card">
              <template #header>
                <div class="card-header">
                  <span>关于</span>
                </div>
              </template>
              <el-descriptions title="作品信息" border :column="2">
                <el-descriptions-item label="作者">
                  会唱歌的花枝丸
                  的
                  <el-link href="https://space.bilibili.com/496956009" type="primary">Bilibili</el-link>
                  和
                  <el-link href="https://github.com/hua-zhi-wan" type="primary">Github</el-link>
                </el-descriptions-item>
                <el-descriptions-item label="Github仓库">
                  <el-link href="https://github.com/hua-zhi-wan/otto-hzys/tree/master" type="primary">
                    hua-zhi-wan/otto-hzys
                  </el-link>
                </el-descriptions-item>
                <el-descriptions-item label="鸣谢">
                  <el-link href="https://github.com/DSP-8192" type="primary">DSP-8192</el-link>
                  和
                  <el-link href="https://github.com/sakaneko117" type="primary">sakaneko117</el-link>
                  (两位原作者) 提供了原版的完整实现 以及部分开发素材
                  <br />
                  <el-link href="https://github.com/fivepotato" type="primary">fivepotato</el-link>
                  重构了原声大碟匹配、音频倒放等诸多算法 修复了历史罪人“TheUnknownThing”造成的倒放音频失控问题
                  <br />
                  <el-link href="https://github.com/PeterTea5822" type="primary">PeterTea5822</el-link>
                  重构UI，引入更多原声大碟
                  <br />
                  <el-link href="https://github.com/TheUnknownThing" type="primary">TheUnknownThing</el-link>
                  新增了音频倒放和倒放下载功能 增加了更多原声大碟
                  <br />
                  <el-link href="https://github.com/kaixinol" type="primary">Kaesinol</el-link>
                  加入后端API支持
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
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
import { reactive, ref } from 'vue'
import pinyin from "js-pinyin"
import pinyin2 from "pinyin"
import Pizzicato from 'pizzicato'
import { ElMessage } from 'element-plus'

const TOKENS_PATH = 'static/tokens'
const YSDD_TOKEN_PATH = 'static/ysddTokens'

const crunker = new Crunker()

export default {
  setup() {
    const formData = reactive({
      text: '大家好啊，我是说的道理',
      isYsdd: true,
      isSliced: false,
      useNonDdbPinyin: true,
    })
    const isComplete = ref(true)
    const version = ref('v1.3')
    const audioSrc = reactive({ value: '#', blob: undefined, name: '#' })
    const ysddShow = reactive({ value: [] })

    const imgUrl = require("@/assets/bk/" + randomNum(1, 8) + ".webp")
    function randomNum(minNum, maxNum) {
      switch (arguments.length) {
        case 1:
          return parseInt(Math.random() * minNum + 1, 10);
        case 2:
          return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
        default:
          return 0;
      }
    }
    function configInit() {
      const tokenSet = new Set()
      fetch('static/tokens.json')
        .then((resp) => resp.json())
        .then((data) => {
          for (const v of data) {
            tokenSet.add(v)
          }
        })
        .catch(err => console.error('加载初始配置文件失败', err))
      const ysddDict = new Map()
      const ysddLastWordLengthIndex = new Map(), ysddSource = new Map()
      fetch('static/ysdd.json')
        .then((resp) => resp.json())
        .then((data) => {
          for (const [filename, textlist] of Object.entries(data)) {
            for (const text of textlist) {
              const py = pinyin.getFullChars(text)
              ysddDict.set(py, filename)
            }
            ysddShow.value.push({ name: textlist, filename: filename })
          }
          for (const [filename, textlist] of Object.entries(data)) {
            for (const text of textlist) {
              const py2 = pinyin2(text, { style: "normal" }).map(v => v[0])
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
      fetch('static/chinglish.json')
        .then((resp) => resp.json())
        .then((data) => {
          for (const [key, value] of Object.entries(data))
            chinglish.set(key, value)
          for (const [key, value] of Object.entries(data)) {
            const newValue = value
              .match(/[A-Z][a-z]*/g)
              .map(v => ({ p: v.toLowerCase(), t: null, isYsdd: false }))
            tonedChinglish.set(key.toUpperCase(), newValue)
          }
        })
        .catch(err => console.error('加载中式英文读音配置失败', err))
      return {
        tokenSet, ysddDict, chinglish,
        ysddLastWordLengthIndex, ysddSource, tonedChinglish
      }
    }

    const {
      tokenSet, ysddDict, chinglish,
      ysddLastWordLengthIndex, ysddSource, tonedChinglish
    } = configInit()

    // 预加载子目录文件列表信息
    const subdirFileMap = new Map()

    // 初始化子目录文件映射
    async function initSubdirFileMap() {
      const subdirFileLists = {
        'amns': ['a_0001.wav', 'ha_0001.wav', 'mo_0001.wav', 'ni_0001.wav', 'niu_0001.wav', 'nuo_0001.wav', 'wo_0001.wav'],
        'ddj': ['chu_0001.wav', 'da_0001.wav', 'da_0002.wav', 'da_0003.wav', 'da_0004.wav', 'dai_0001.wav', 'dai_0002.wav', 'ding_0001.wav', 'ding_0002.wav', 'ding_0003.wav', 'dong_0001.wav', 'dong_0002.wav', 'dong_0003.wav', 'duan_0001.wav', 'duan_0002.wav', 'gao_0001.wav', 'gou_0001.wav', 'he_0001.wav', 'ji_0001.wav', 'ji_0002.wav', 'ji_0003.wav', 'ji_0004.wav', 'jian_0001.wav', 'jiao_0001.wav', 'jiao_0002.wav', 'jiao_0003.wav', 'jiao_0004.wav', 'jiao_0005.wav', 'jing_0001.wav', 'kang_0001.wav', 'lou_0001.wav', 'shang_0001.wav', 'shen_0001.wav', 'shen_0002.wav', 'shi_0001.wav', 'shu_0001.wav', 'suan_0001.wav', 'yi_0001.wav', 'yi_0002.wav', 'zheng_0001.wav'],
        'dxl': ['a_0001.wav', 'han_0001.wav', 'han_0002.wav', 'jian_0001.wav', 'jian_0002.wav', 'ma_0001.wav', 'ma_0002.wav', 'ne_0001.wav', 'shui_0001.wav'],
        'hg1': ['chui_0001.wav', 'chun_0001.wav', 'ha_0001.wav', 'li_0001.wav', 'li_0002.wav', 'mi_0001.wav', 'mi_0002.wav', 'shang_0001.wav', 'sui_0001.wav', 'ye_0001.wav', 'yi_0001.wav', 'you_0001.wav', 'yuan_0001.wav'],
        'hg2': ['ha_0001.wav', 'ji_0001.wav', 'kang_0001.wav', 'kong_0001.wav', 'la_0001.wav', 'long_0001.wav', 'mi_0001.wav'],
        'hjm': ['duo_0001.wav', 'ga_0001.wav', 'ga_0002.wav', 'ga_0003.wav', 'gu_0001.wav', 'ha_0001.wav', 'ha_0002.wav', 'ha_0003.wav', 'ha_0004.wav', 'ha_0005.wav', 'ji_0001.wav', 'ji_0002.wav', 'mi_0001.wav', 'mi_0002.wav', 'mi_0003.wav', 'mi_0004.wav', 'mie_0001.wav', 'na_0001.wav', 'wo_0001.wav', 'xi_0001.wav', 'ya_0001.wav'],
        'hm': ['ha_0001.wav', 'mu_0001.wav', 'mu_0002.wav'],
        'mb': ['bo_0001.wav', 'bo_0002.wav', 'bo_0003.wav', 'bo_0004.wav', 'man_0001.wav', 'man_0002.wav', 'man_0003.wav', 'man_0004.wav'],
        'mbo': ['man_0001.wav'],
        'nyyszgr': ['guo_0001.wav', 'ren_0001.wav', 'shi_0001.wav', 'yong_0001.wav', 'yuan_0001.wav', 'zhong_0001.wav'],
        'pbb': ['ai_0001.wav', 'bai_0001.wav', 'bai_0002.wav', 'bao_0001.wav', 'bao_0002.wav', 'bao_0003.wav', 'bao_0004.wav', 'bao_0005.wav', 'bao_0006.wav', 'ha_0001.wav', 'ha_0002.wav', 'ha_0003.wav', 'hao_0001.wav', 'ke_0001.wav', 'mi_0001.wav', 'mi_0002.wav', 'mi_0003.wav', 'mi_0004.wav', 'pang_0001.wav', 'pang_0002.wav', 'pang_0003.wav', 'shou_0001.wav', 'tao_0001.wav', 'wei_0001.wav', 'xiao_0001.wav'],
        'uzi': ['de_0001.wav', 'shen_0001.wav', 'wu_0001.wav', 'yong_0001.wav', 'yuan_0001.wav', 'zi_0001.wav'],
        'yzd': ['dan_0001.wav', 'yuan_0001.wav', 'zi_0001.wav'],
        'yy': ['hui_0001.wav', 'jia_0001.wav', 'jie_0001.wav', 'lai_0001.wav', 'men_0001.wav', 'ni_0001.wav', 'wo_0001.wav', 'ya_0001.wav', 'ya_0002.wav']
      }

      for (const [subdir, files] of Object.entries(subdirFileLists)) {
        subdirFileMap.set(subdir, files)
        console.log(`子目录 ${subdir} 预加载了 ${files.length} 个音频文件: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`)
      }
    }

    // 初始化子目录文件映射
    const subdirFileMapPromise = initSubdirFileMap()

    async function generate() {
      // 判空
      if (formData.text === "") return

      // 等待子目录文件映射初始化完成
      await subdirFileMapPromise
      console.log('子目录文件映射初始化完成，开始音频获取')

      // 将英文字母转为拼音，保存为[xxx]，防止插入空白
      const chinglishifyed = formData.text
        .replace(/[a-zA-Z0-9.]/g, (m) => `<${m.toLowerCase().charCodeAt(0)}>`)
        .replace(/<[0-9]+>/g, (m) => `[${chinglish.get(String.fromCharCode(parseInt(m.slice(1, -1))))}]`)
      console.log(chinglishifyed)

      // 将汉字转为拼音，过滤不可识别标识
      const purePinyin = pinyin.getFullChars(chinglishifyed).replace(/[^a-zA-Z[\]]/g, '');
      // 将[xxx]放入短数组中
      const pinyinTokens = purePinyin.split(/(?=\[)|(?<=])/).map(i => /\[.+\]/.test(i) ? [i.slice(1, -1)] : i)
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
      // 先将文本分割为: 连续英文单词(保持完整) 和 其他字符(逐字拆开)
      const characters = [];
      // 按连续英文字母 vs 非英文部分分割
      const parts = formData.text.split(/([a-zA-Z]+)/);
      for (const part of parts) {
        if (/^[a-zA-Z]+$/.test(part)) {
          // 连续英文字母，作为完整单词保留
          characters.push(part.toUpperCase());
        } else {
          // 非英文部分，转大写后逐字拆开
          const cleaned = part.toUpperCase().replace(/[^.0-9a-zA-Z\u4e00-\u9fff]+/g, " ");
          characters.push(...Array.from(cleaned));
        }
      }
      const tonedPinyins = characters.map(v => {
        // 如果是多字母的完整英文单词，直接保留，不转拼音，标记为英文单词
        if (v.length > 1 && /^[A-Z]+$/i.test(v)) {
          return { p: v, t: null, isEnglishWord: true }
        }
        const [, p, t] = (pinyin2(v, { style: "tone2" })[0][0].match(/^([a-z]+)([0-9]?)$/) || [null, v, null]);
        return { p, t: { [null]: null, [""]: 0, 1: 1, 2: 2, 3: 3, 4: 4 }[t] }
      });
      console.log("20240106 tonedPinyins", tonedPinyins);

      // 无声调匹配活字印刷
      function ysddParse(tonedPinyins) {
        // 临时保存最优匹配信息和长度
        const optMatch = [], optMatchCount = [];
        function setOptMatch(fromIndex, matchCount, tonedPinyin, ysddKey) {
          const toIndex = fromIndex + matchCount + !matchCount;
          if (!optMatch[fromIndex]) {
            optMatch[toIndex] = [{ p: tonedPinyin?.p || ysddKey, t: tonedPinyin?.t || null, isYsdd: !!ysddKey, isEnglishWord: tonedPinyin?.isEnglishWord || false }];
            optMatchCount[toIndex] = matchCount;
            return
          }
          const optNew = [];
          optNew.push(...optMatch[fromIndex]);
          const countNew = optMatchCount[fromIndex] + matchCount;
          if (matchCount) {
            optNew.push({ p: ysddKey, t: null, isYsdd: true });
          } else {
            optNew.push({ p: tonedPinyin.p, t: tonedPinyin.t, isYsdd: false, isEnglishWord: tonedPinyin.isEnglishWord || false });
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
                for (let j = 0; j < length - 1; j += 1) {
                  if (woTonePinyins[j] === tonedPinyins[i - length + j + 1]?.p) continue;
                  is_equal = false;
                  break;
                }
                if (!is_equal) continue;
                optionalMatches.push({ length, woTonePinyins });
              }
            }
          }
          optionalMatches.sort((a, b) => a.length - b.length);
          // 将候选的匹配初始化为直接追加单字
          // 即：如果所有匹配的selectMatchLength都比直接追加单字低就直接追加单字
          let selectMatchLength = optMatchCount[i - 1] || 0, selectMatch = null;
          for (const { length, woTonePinyins } of optionalMatches) {
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
      const ysdded = formData.isYsdd ? ysddParse(tonedPinyins) : tonedPinyins;

      // 数字和英文字母（含.）转拼音
      console.log("20240106 ysdded", ysdded);
      const chinglishfied = ysdded.reduce((prev, v) => {
        // 检查是否是原始输入的完整英文单词（通过isEnglishWord标记区分中文拼音）
        if (v.isEnglishWord) {
          // 完整英文单词，检查是否在原声大碟中有匹配
          if (formData.isYsdd) {
            const lowerWord = v.p.toLowerCase();
            // 检查ysddSource中是否有匹配
            if (ysddSource.has(lowerWord)) {
              prev.push({ p: lowerWord, t: null, isYsdd: true });
              return prev;
            }
            // 检查ysddDict中是否有匹配（通过getFullChars生成的键）
            if (ysddDict.has(lowerWord)) {
              prev.push({ p: lowerWord, t: null, isYsdd: true });
              return prev;
            }
          }
          // 不在原声大碟中，逐字母转为chinglish拼音
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

        if (!v.p.match(/^[.A-Z0-9!？；：、...，。()\[\]{}_+=\-*/\\\\|~@#$%^&'"<>]$/)) { // eslint-disable-line no-useless-escape
          prev.push(v);
          return prev
        }

        prev.push(...tonedChinglish.get(v.p));
        return prev
      }, []);
      console.log("20240106 chinglishfied", chinglishfied);

      // 合并连续出现的短暂停顿
      sliced = chinglishfied.reduce((prev, { p, isYsdd }) => {
        if (isYsdd) {
          // 对于原声大碟，先尝试从ysddSource获取文件名
          let filename = ysddSource.get(p);

          // 如果ysddSource中没有，尝试从ysddDict中查找
          if (!filename) {
            // 查找英文单词对应的原声大碟文件名
            // 例如："man"应该对应到"男人"的拼音键"man"
            for (const [pyKey, file] of ysddDict.entries()) {
              if (pyKey === p) {
                filename = file;
                break;
              }
            }
          }

          // 如果找到了文件名，使用原声大碟格式
          if (filename) {
            prev.push(`<${filename}>`);
          } else {
            // 如果没有找到，回退到普通拼音处理
            if (tokenSet.has(p)) prev.push(p);
            else if (prev[prev.length - 1] === "_") return prev;
            else prev.push("_");
          }
        } else {
          if (tokenSet.has(p)) prev.push(p);
          else if (prev[prev.length - 1] === "_") return prev;
          else prev.push("_");
        }
        if (formData.isSliced) prev.push("_");
        return prev
      }, []);
      console.log("20240106 sliced", sliced);
      /* 20240106 更换的可构造音频序列生成 END */

      // 等待处理
      isComplete.value = false

      // Helper: fetch audio with resp.ok check to avoid decoding HTML error pages
      async function safeFetchAudio(uri) {
        const resp = await fetch(uri, { method: 'GET', cache: 'force-cache' })
        if (!resp.ok) {
          console.warn(`Audio fetch failed (${resp.status}): ${uri}`)
          return null
        }
        // Check content-type to avoid decoding HTML error pages as audio
        const contentType = resp.headers.get('content-type') || ''
        if (contentType.includes('text/html')) {
          console.warn(`Audio fetch returned HTML instead of audio: ${uri}`)
          return null
        }
        return resp.blob()
      }

      // 为每个字独立获取音频，而不是预先缓存
      const audioPromises = sliced.map(async (v) => {
        // 如果是原声大碟，直接获取
        if (/<.+>/.test(v)) {
          const uri = `${YSDD_TOKEN_PATH}/${v.replace(/<(.+)>/, '$1')}.mp3`
          const blob = await safeFetchAudio(uri)
          if (blob) return blob
          // Fallback to tokens if ysdd file not found
          const fallbackUri = `${TOKENS_PATH}/${v.replace(/<(.+)>/, '$1')}.wav`
          const fallbackBlob = await safeFetchAudio(fallbackUri)
          if (fallbackBlob) return fallbackBlob
          // Return silent audio as last resort
          return await safeFetchAudio(`${TOKENS_PATH}/_.wav`)
        }

        // 检查是否是标点符号，尝试从ysddTokens获取
        if (v.match(/^[!？；：、...，。()\[\]{}_+=\-*/\\\\|~@#$%^&'"<>]+$/)) { // eslint-disable-line no-useless-escape
          console.log(`检测到标点符号: ${v}，尝试从ysddTokens获取`)
          const ysddBlob = await safeFetchAudio(`${YSDD_TOKEN_PATH}/${v}.mp3`)
          if (ysddBlob) {
            console.log(`标点符号 ${v} 在ysddTokens中找到音频文件`)
            return ysddBlob
          }
          console.log(`标点符号 ${v} 在ysddTokens中未找到音频文件，回退到tokens获取`)
          const tokenBlob = await safeFetchAudio(`${TOKENS_PATH}/${v}.wav`)
          if (tokenBlob) return tokenBlob
          return await safeFetchAudio(`${TOKENS_PATH}/_.wav`)
        }

        // 如果关闭了"使用非电棍拼音"选项，直接从tokens直属目录获取
        if (!formData.useNonDdbPinyin) {
          console.log(`拼音 ${v}: 非电棍拼音已关闭，从tokens直接获取`)
          const blob = await safeFetchAudio(`${TOKENS_PATH}/${v}.wav`)
          if (blob) return blob
          return await safeFetchAudio(`${TOKENS_PATH}/_.wav`)
        }

        // 检查拼音首字母子目录
        const availableSubdirs = []

        // 获取所有包含该拼音的子目录
        const subdirs = ['amns', 'ddj', 'dxl', 'hg1', 'hg2', 'hjm', 'hm', 'mb', 'mbo', 'nyyszgr', 'pbb', 'uzi', 'yzd', 'yy']
        for (const subdir of subdirs) {
          const files = subdirFileMap.get(subdir) || []
          // 检查是否有匹配的文件名
          const matchingFiles = files.filter(file => file.startsWith(v + '_') && file.endsWith('.wav'))
          if (matchingFiles.length > 0) {
            availableSubdirs.push(subdir)
            console.log(`拼音 ${v} 在子目录 ${subdir} 中找到 ${matchingFiles.length} 个匹配文件: ${matchingFiles.join(', ')}`)
          }
        }

        const n = availableSubdirs.length
        console.log(`拼音 ${v} 的可用子目录数量: ${n}, 子目录列表: ${availableSubdirs.join(', ')}`)

        if (n === 0) {
          console.log(`拼音 ${v}: 没有子目录包含该拼音，从tokens直接获取`)
          const blob = await safeFetchAudio(`${TOKENS_PATH}/${v}.wav`)
          if (blob) return blob
          return await safeFetchAudio(`${TOKENS_PATH}/_.wav`)
        } else {
          // 有子目录包含该拼音，进行随机选择
          const randomChoice = Math.floor(Math.random() * (n + 1))
          console.log(`拼音 ${v}: 随机选择结果 ${randomChoice} (范围: 0-${n})`)

          if (randomChoice === n) {
            console.log(`拼音 ${v}: 随机选择为${n}，从tokens直接获取`)
            const blob = await safeFetchAudio(`${TOKENS_PATH}/${v}.wav`)
            if (blob) return blob
            return await safeFetchAudio(`${TOKENS_PATH}/_.wav`)
          } else {
            // 随机选择小于n，从对应子目录获取
            const selectedSubdir = availableSubdirs[randomChoice]
            console.log(`拼音 ${v}: 随机选择为${randomChoice}，从子目录 ${selectedSubdir} 获取`)

            // 获取该子目录中所有匹配的拼音文件
            const files = subdirFileMap.get(selectedSubdir) || []
            const matchingFiles = files.filter(file => file.startsWith(v + '_') && file.endsWith('.wav'))
            console.log(`拼音 ${v}: 在子目录 ${selectedSubdir} 中找到 ${matchingFiles.length} 个匹配文件: ${matchingFiles.join(', ')}`)

            if (matchingFiles.length > 0) {
              // 随机选择一个文件
              const randomFile = matchingFiles[Math.floor(Math.random() * matchingFiles.length)]
              console.log(`拼音 ${v}: 随机选择文件 ${randomFile}`)
              const uri = `${TOKENS_PATH}/${selectedSubdir}/${randomFile}`
              const subdirBlob = await safeFetchAudio(uri)
              if (subdirBlob) return subdirBlob
              console.log(`拼音 ${v}: 文件 ${randomFile} 不存在，回退到tokens直接获取`)
              const fallbackBlob = await safeFetchAudio(`${TOKENS_PATH}/${v}.wav`)
              if (fallbackBlob) return fallbackBlob
              return await safeFetchAudio(`${TOKENS_PATH}/_.wav`)
            } else {
              console.log(`拼音 ${v}: 在子目录 ${selectedSubdir} 中没有找到匹配文件，回退到tokens直接获取`)
              const noMatchBlob = await safeFetchAudio(`${TOKENS_PATH}/${v}.wav`)
              if (noMatchBlob) return noMatchBlob
              return await safeFetchAudio(`${TOKENS_PATH}/_.wav`)
            }
          }
        }
      })

      // 获取所有音频
      const audioBuffersRaw = await Promise.all(audioPromises).catch(err => {
        console.error(err)
        ElMessage({
          message: '音频请求失败，请尝试关闭迅雷插件，IDM插件等接管浏览器下载行为的软件',
          type: 'error'
        })
        throw err
      })
      // Filter out null entries (failed fetches)
      const audioBuffers = audioBuffersRaw.filter(blob => blob !== null && blob !== undefined)
      if (audioBuffers.length === 0) {
        ElMessage({ message: '没有获取到有效的音频数据', type: 'error' })
        isComplete.value = true
        return
      }
      // 将多个声道变为单声道
      const audioCtx = new AudioContext();
      function sliceToOneChannel(audioBuffer) {
        // 判断是否有多个声道
        if (audioBuffer.numberOfChannels === 1) return audioBuffer;
        // 如果有多个声道，只保留第一个声道的数据
        const newAudioBuffer = audioCtx.createBuffer(1, audioBuffer.length, audioBuffer.sampleRate);
        newAudioBuffer.copyToChannel(audioBuffer.getChannelData(0), 0);
        return newAudioBuffer;
      }

      // 音频拼接 - 使用独立获取的音频数组
      await crunker
        .fetchAudio(...audioBuffers)
        .then((buffers) => {
          // 将多个声道变为单声道
          buffers = buffers.map(sliceToOneChannel);
          return crunker.concatAudio(buffers)
        })
        .then((merged) => crunker.export(merged, 'audio/wav'))
        .then((output) => {
          audioSrc.value = output.url
          audioSrc.blob = output.blob
          const filename = formData.text.slice(0, 20).replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '') || 'otto-hzys' // 防止文件名过长或包含特殊字符
          const datestr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15) // YYYYMMDDHHmmss
          audioSrc.name = `${filename}-${datestr}`
          ElMessage({
            message: `答辩<${audioSrc.name}>生成完成，请享用`,
            type: 'success'
          })
        })        .catch((err) => {
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
    const sound = { value: undefined, effects: [] }

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
    function previewPlay({ filename }) {
      const previewSrc = ref(`${YSDD_TOKEN_PATH}/${filename}.mp3`)
      const prsound = { value: undefined, effects: [] }
      if (previewSrc.value !== '#') {
        prsound.value = new Pizzicato.Sound({
          source: 'file',
          options: {
            path: previewSrc.value
          }
        }, () => {
          console.log("now playing " + previewSrc.value)
          prsound.value.play()
        })
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
        crunker
          .fetchAudio(audioSrc.blob)
          .then((audioBuffers) => {
            audioBuffers[0].getChannelData(0).reverse();
            return audioBuffers[0]
          })
          .then((reversedAudioBuffer) => crunker.export(reversedAudioBuffer, 'audio/wav'))
          .then((output) => crunker.download(output.blob, `${audioSrc.name}_reversed`));
      }
    }

    function showArt(src, name) {
      audioSrc.value = src
      audioSrc.blob = undefined
      audioSrc.name = name
    }

    return {
      formData,
      isComplete,
      version,
      generate,
      ysddShow,
      imgUrl,
      audioSrc,
      applyEffects,
      soundPlay,
      previewPlay,
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
@font-face {
  font-family: OPPOSans-H;
  src: url("@/assets/fonts/OPPOSans3.0cn-Bold.woff2") format("woff2");
}

@font-face {
  font-family: OPPOSans-B;
  src: url("@/assets/fonts/OPPOSans3.0cn-Medium.woff2") format("woff2");
}

* {
  font-family: OPPOSans-B, sans-serif;
  text-shadow: 1px 1px 4px #000;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  color: #fafafa;
}

div {
  color: #ffffff;
}

h2 {
  text-align: center;
}

.blur-card {
  backdrop-filter: blur(15px) brightness(90%);
  background-color: #aaa6;
  border: hidden;
  --el-card-border-color: #fff6;
  --el-text-color-regular: #FFFFFF;
}

.el-textarea {
  --el-input-text-color: white;
  --el-fill-color-blank: #2223;
}



.el-collapse {
  --el-collapse-header-bg-color: hidden;
  --el-collapse-border-color: #ebeef524;
  --el-collapse-content-bg-color: hidden;
  --el-collapse-header-text-color:
}

.el-slider {
  --el-slider-runway-bg-color: #e4e7ed78;
  --el-slider-main-bg-color: #409effbf;

}

.el-descriptions {
  --el-fill-color-blank: #67676733;
  --el-fill-color-light: #f5f7fa57;
  --el-text-color-primary: white;
}

.bk-img {
  width: 100%;
  height: 100%;
  background-size: cover;
  position: fixed;
  z-index: -1;
  background-repeat: no-repeat;

}
</style>
<style>
.el-input-number {
  --el-fill-color-blank: #ff000000;
  --el-fill-color-light: #ff000000 !important;
}
</style>