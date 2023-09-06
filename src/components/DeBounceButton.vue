<template>
  <el-button :type="type" @click="handleClick" :disabled="!valid"><slot/></el-button>
</template>

<script>
// el-button按钮的二次封装
import { ElButton } from "element-plus";
export default {
  name: "DeBounceButton",
  extends: ElButton, // 继承element-ui的Button控件
  props:{
    type:String
  },
  data() {
    return {
      delay: 500,
      timer: null,
      valid: true, // 按钮有效与否，true: 有效,false: 失效
    };
  },
  methods: {
    // 防抖：某个时间期限（如500毫秒）内，事件处理函数只执行一次
    debounceClick(evt) {
      //触发用户点击对应函数
      this.$emit("click", evt);
      this.valid = false;
      this.timer && clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.valid = true;
      }, this.delay);
    },
    // 节流：函数执行一次之后，该在指定的时间（如500毫秒）期限内不再工作，直至过了这段时间才重新生效
    throttleClick(evt) {
      let _this = this;
      // 触发事件之后禁止再次点击
      setTimeout(() => {
        // delay秒之后可再次点击
        _this.valid = true;
      }, this.delay);
      //节流
      if (_this.valid) {
        _this.valid = false;
        // 触发用户点击对应函数
        _this.$emit("click", evt);
      }
    },
    // 重写Button控件中的点击事件handleClick
    handleClick(evt) {
      // 按钮无效, 阻止事件继续执行
      if (!this.valid) {
        return;
      }
      // 防抖
      this.debounceClick(evt);
    },
  },
};
</script>

<style>

</style>