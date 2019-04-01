/**
 * 这是一个宫格抽奖的插件
 *
 * @param    {String}  luckyBoxId     整个容器的id
 * @param    {String}  startBtnId     按钮的id
 * @returns  void
 *
 * @date     2017/10/25
 * @author   shengchuang<309522304@qq.com>
 */
;
(function(global) {
  "use strict" //使用js严格模式检查，使语法更规范
  var defaults = {
    luckyBoxId: 'luckyBox',
    startBtnId: 'startBtn',
    slow: 40, //减速度  越大越慢 初始加速度是此速度的两倍
  }

  function Panel(opts) {
    this._listeners = {};
    this.opts = mergeObj(defaults, opts);
    this.box = $('#' + this.opts.luckyBoxId); //容器
    this.btn = $('#' + this.opts.startBtnId); //按钮
    this.luckys = this.box.find('li');
    this.length = this.luckys.length;
    this.speed = this.length * this.opts.slow; //初始速度与结束速度
    this.index = 0; //当前的下标
    this.luckyIndex = -1; //中奖项的下标
    this.timer = null;
    this.slow = false; //标示是否减速过
    this.init();
    return this;
  }
  Panel.prototype = {
    constructor: this,
    init: function() {
      this.setPosition()
      this.bindEvent()
    },
    setPosition: function() { //定位每个奖项
      // 先计算box的宽度，判断有多少个奖项，
      //  8个 =》 item的宽高 = box的宽度/3  
      //          1 的定位 left:0,        top:0
      //          2 的定位 left:item.宽度,top:0
      //          3 的定位 right:0,       top:0
      //          4 的定位 right:0,       top:item.高度
      //          5 的定位 right:0,       bottom:0
      //          6 的定位 left:item.宽度,bottom:0
      //          7 的定位 left:0,       bottom:0
      //          8 的定位 left:0,       top:item.高度
      //  12个 =》 item的宽高 = box的宽度/4  
      //          1-4 的定位 top:0,left:index*item的宽度 
      var boxWidth = this.box.width();
      // var itemWidth = boxWidth / 4;
      var itemWidth = boxWidth / (this.length / 4 + 1);
      var btnWidth = (this.length / 4 - 1) * itemWidth;
      this.box.height(boxWidth);
      this.btn.css({ position: "absolute", left: itemWidth, top: itemWidth, width: btnWidth, height: btnWidth })
      switch (this.length) {
        case 12: //12宫格
          for (var i = 0, len = this.length; i < len; i++) {
            (i >= 0 && i <= 3) && $(this.luckys[i]).css({ position: 'absolute', top: 0, left: (i * itemWidth), width: itemWidth, height: itemWidth });
            (i > 3 && i <= 6) && $(this.luckys[i]).css({ position: 'absolute', right: 0, top: ((i - 3) * itemWidth), width: itemWidth, height: itemWidth });
            (i > 6 && i <= 9) && $(this.luckys[i]).css({ position: 'absolute', bottom: 0, right: ((i - 6) * itemWidth), width: itemWidth, height: itemWidth });
            (i > 9 && i <= 11) && $(this.luckys[i]).css({ position: 'absolute', left: 0, bottom: ((i - 9) * itemWidth), width: itemWidth, height: itemWidth });
          }
          break;

        default: //8宫格
          for (var i = 0, len = this.length; i < len; i++) {
            (i >= 0 && i <= 2) && $(this.luckys[i]).css({ position: 'absolute', top: 0, left: (i * itemWidth), width: itemWidth, height: itemWidth });
            (i > 2 && i <= 4) && $(this.luckys[i]).css({ position: 'absolute', right: 0, top: ((i - 2) * itemWidth), width: itemWidth, height: itemWidth });
            (i > 4 && i <= 6) && $(this.luckys[i]).css({ position: 'absolute', bottom: 0, right: ((i - 4) * itemWidth), width: itemWidth, height: itemWidth });
            (i > 6 && i <= 7) && $(this.luckys[i]).css({ position: 'absolute', left: 0, bottom: ((i - 6) * itemWidth), width: itemWidth, height: itemWidth });
          }
          break;
      }
    },
    bindEvent: function() { //绑定事件
      var that = this;
      that.btn.on('click', function(params) {
        if (that.timer) return;
        that.emit('start');
      })
      return this;
    },
    roll: function() {
      var luckys = this.luckys;
      if (this.index === luckys.length) {
        this.index = 0;
      }
      $(luckys[this.index]).addClass('active').siblings().removeClass('active')

    },
    stop: function(id) { //停止
      var luckys = this.luckys;
      for (var index = 0, len = this.length; index < len; index++) {
        if (luckys[index].dataset.id === id + '') {
          return this.luckyIndex = index
        }
      }
    },
    run: function() { //旋转
      var that = this;
      clearTimeout(that.timer)
      that.timer = null;
      that.roll();
      if (that.luckyIndex < 0 && that.speed > that.opts.slow * 3) { //慢慢加快速度，直到加到60
        that.speed -= that.opts.slow * 2;
      }
      //获取到了中奖项，并且当前项就是中奖项
      if (that.luckyIndex > -1 && that.luckyIndex == that.index) {
        that.slow = !that.slow; //用来标识是第几次转到中奖项（如果是第一次转到就开始减速度）
        if (!that.slow) { //第二次转到中奖项（停止转动）
          that.emit('end', this.luckys[that.luckyIndex])
          clearTimeout(that.timer)
          that.timer = null;
          return that.luckyIndex = -1;
        }
      }
      if (that.slow) { //如果是第一次转到中奖项就开始减速度
        that.speed += that.opts.slow;
      }
      this.index++; //下一个
      that.timer = setTimeout(function() {
        that.run()
      }, that.speed);

    },
    // 添加
    on: function(type, fn) {
      // type: end, run
      if (typeof this._listeners[type] === "undefined") {
        this._listeners[type] = [];
      }
      if (typeof fn === "function") {
        this._listeners[type].push(fn);
      }
      return this;
    },
    // 触发
    emit: function(type, params) {
      var arrayEvent = this._listeners[type];
      if (arrayEvent instanceof Array) {
        for (var i = 0, length = arrayEvent.length; i < length; i += 1) {
          if (typeof arrayEvent[i] === "function") {
            arrayEvent[i]({ type: type, params: params });
          }
        }
      }
      return this;
    },
    // 删除
    off: function(type, fn) {
      var arrayEvent = this._listeners[type];
      if (typeof type === "string" && arrayEvent instanceof Array) {
        if (typeof fn === "function") {
          // 清除当前type类型事件下对应fn方法
          for (var i = 0, length = arrayEvent.length; i < length; i += 1) {
            if (arrayEvent[i] === fn) {
              this._listeners[type].splice(i, 1);
              break;
            }
          }
        }
        else {
          // 如果仅仅参数type, 或参数fn邪魔外道，则所有type类型事件清除
          delete this._listeners[type];
        }
      }
      return this;
    }
  }

  global.Panel === undefined && (global.Panel = Panel);

  //合并opts和defaults
  function mergeObj(target, resource) {
    if (typeof resource !== 'object') {
      resource = {};
    }
    for (var property in resource) {
      if (target.hasOwnProperty(property)) {
        target[property] = resource[property];
      }
    }
    return target;
  }
}(window))