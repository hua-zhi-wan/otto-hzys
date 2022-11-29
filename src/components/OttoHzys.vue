<template>
  <div class="common-layout">
    <el-container>
      <el-main>
        <el-row>
          <el-col :md="2" :lg="4">
          </el-col>
          <el-col :md="20" :lg="16">
            <h2>大电老师活字印刷 <small> 纯前端版{{ version }}</small></h2>
            <el-divider/>
            <h4>参数设置</h4>
            <el-form :model="formData" label-width="auto" label-position="left">
              <el-form-item label="文本">
                <el-input v-model="formData.text" type="textarea" rows="4"/>
              </el-form-item>
              <el-form-item label="原声大碟模式">
                <el-switch v-model="formData.isYsdd"/>
              </el-form-item>
              <el-form-item label="字间添加短暂停顿">
                <el-switch v-model="formData.isSliced"/>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="generate" :loading="!isComplete">{{
                    isComplete ? "生成otto鬼叫" : "生成中"
                  }}
                </el-button>
              </el-form-item>
            </el-form>
            <el-divider/>
            <h4>生成音频</h4>
            <audio :src="audioSrc" autoplay controls></audio>
            <el-divider/>
            <h4>艺术殿堂</h4>

          </el-col>
        </el-row>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import Crunker from 'crunker'
import {reactive, ref} from 'vue'
import pinyin from "js-pinyin"

const TOKENS_PATH = '/static/tokens/'
const YSDD_TOKEN_PATH = '/static/ysddTokens/'

const TOKEN_DICT = new Map();

const crunker = new Crunker()

export default {
  setup() {
    const formData = reactive({
      text: '大家好啊，我是说的道理',
      isYsdd: false,
      isSliced: false,
    })
    const isComplete = ref(true)
    const version = ref('v1.0')
    const audioSrc = ref("#")

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
            }
          })
          .then(() => console.log(ysddDict))
          .catch(err => console.error('加载原声大碟配置失败', err))
      const chinglish = new Map()
      fetch('/static/chinglish.json')
          .then((resp) => resp.json())
          .then((data) => {
            for (const [key, value] of Object.entries(data))
              chinglish.set(key, value)
          })
          .catch(err => console.error('加载中式英文读音配置失败', err))
      return {
        tokenSet, ysddDict, chinglish
      }
    }

    const {tokenSet, ysddDict, chinglish} = configInit()

    async function generate() {
      // 判空
      if (formData.text === "") return

      // 等待处理
      isComplete.value = false

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

      // 缓存音频素材，防止重复请求
      const tmpFetchList = [...new Set(sliced).keys(), '_']
      await Promise.all(
          tmpFetchList
              .filter(v => !TOKEN_DICT.has(v))
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
          TOKEN_DICT.set(key, blob)
        }
        console.log('TokenDict', TOKEN_DICT)
      })

      // 音频拼接
      await crunker
          .fetchAudio(...sliced.map(v => TOKEN_DICT.get(v)))
          .then((buffers) => crunker.concatAudio(buffers))
          .then((merged) => crunker.export(merged, 'audio/wav'))
          .then((output) => {
            audioSrc.value = output.url
          })
          .catch((err) => console.error(err))
          .finally(() => isComplete.value = true)
    }

    return {
      formData,
      isComplete,
      version,
      audioSrc,
      generate,
    }
  }
}
</script>

<style scoped>
h2, h4 {
  color: #606266;
}

h2 {
  text-align: center;
}
</style>