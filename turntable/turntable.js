/**
 * turntable.js
 * @author shengchuang<309522304@qq.com>
 * 2017/9/18
 **/

/**
 * new Turntable ({
 *      turntableId: 'turntable',  //转盘的id
 *      startBtnId: 'startBtn',  //开始抽奖按钮的id
 *      prizes: [],  //奖项（对象）数组且必须有id字段
 *      speed: 'turntable'  //转速正整数，越大越快
 * })
 * event： start(用户点击抽奖按钮，但此时转盘没有转), end(转盘停止转动)
 * methods: run(转动转盘), stop(停止转动，要传中奖项的id)
 **/
;
(function (global) {
  "use strict" //使用js严格模式检查，使语法更规范
  var defaults = {
    turntableId: 'turntable',
    startBtnId: 'startBtn',
    prizes: [], //奖项列表
    luckyId: null, //中奖项
    speed: 1,//转速
    initDeg: 360 * 3,//初始化旋转角度
    _deg: 0,
    interval: 1000,//请求结果间隔时间
    timer: null,
  }
  
  function Turntable(opts) {
    this._listeners = {};
    this.opts = mergeObj(defaults, opts); 
    this._wheel = document.getElementById(this.opts.turntableId)
    this._btn = document.getElementById(this.opts.startBtnId)
    this._initial(opts);
    return this;
  }
  Turntable.prototype = {
    constructor: this,
    _initial: function (opts) {
      this.checkOpts();
      this.createStyleSheet()
      this.bindEvent();
      this.opts.initDeg = this.opts.speed * this.opts.initDeg;
    },
    checkOpts: function () {//检查入参
      if (!this.opts.prizes.length) throw new Error ('奖项不能为空的，是不是傻')
      this.opts.prizes.forEach(function (item) {
        if (__getClass(item) !== 'Object') {
          throw new Error ('奖项必须为对象的，是不是傻')
        }else if(!item.id){
          throw new Error ('奖项id不能为空的，是不是傻')
        } 
      })
    },
    createStyleSheet: function () {
      var styleElement = document.createElement('style')
      var styleStr = '.turntable-run { transition: transform 4s linear;-webkit-transition: -webkit-transform 4s linear; } \
                      .turntable-after { transition: transform 6s ease-out;-webkit-transition: -webkit-transform 6s ease-out; }\
                      .disable {pointer-events: none;}';
      styleElement.type = 'text/css';
      styleElement.innerHTML = styleStr;
      document.getElementsByTagName('head')[0].appendChild(styleElement);
    },
    bindEvent: function () {
      var _this = this;
      _this._btn.onclick = function () {
        _this.emit('start')
      }
     _this._wheel.addEventListener('transitionend',function () {
       var luckPrize = _this.opts.prizes[_this.opts.luckyIndex];
        _this.emit('end', luckPrize)
        _this.opts.luckyIndex = null; //重置
        removeClass(_this._btn, 'disable')
      })
      
      return this;
    },
    doRotate: function() {
      var d = Math.ceil(this.opts._deg);
      this._wheel.style['-webkit-transform'] = 'rotate(' + d + 'deg)';
      this._wheel.style['transform'] = 'rotate(' + d + 'deg)';
    },
    stop: function (id) {//设置奖项.
      if (!id) {
        removeClass(this._btn, 'disable')
        throw new Error('不给我奖项id我怎么知道停在什么角度，是不是傻')
      }
      for(var i = 0, len = this.opts.prizes.length; i < len; i++) {
          if (this.opts.prizes[i].id === id) {
            return this.opts.luckyIndex = i;
          }
      }
      removeClass(this._btn, 'disable')
      throw new Error('给我的id在奖项列表里找不到我怎么停，是不是傻')
    },
    run: function () {//旋转
        var _this = this;
        if (hasClass(_this._btn, 'disable')) return
        removeClass(_this._wheel, 'turntable-after')
        addClass(_this._wheel, 'turntable-run')
        addClass(_this._btn, 'disable')
        _this.opts._deg += _this.opts.initDeg + (360 - _this.opts._deg % 360); //保持中奖后的初始度数还是360的倍数
        _this.doRotate();
        _this.opts.timer = null;
        _this.opts.timer = setInterval(function () {
          if (_this.opts.luckyIndex || _this.opts.luckyIndex === 0) {
            _this.opts._deg +=  360 - (360 / _this.opts.prizes.length * _this.opts.luckyIndex)
            _this.doRotate();
            removeClass(_this._wheel, 'turntable-run')
            addClass(_this._wheel, 'turntable-after')
            clearInterval(_this.opts.timer);
          } else {
            _this.opts._deg += 360 * _this.opts.speed
            _this.doRotate()
          }
        }, _this.opts.interval)
        return this;
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
            for (var i=0, length=arrayEvent.length; i<length; i+=1) {
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
                for (var i=0, length=arrayEvent.length; i<length; i+=1){
                    if (arrayEvent[i] === fn){
                        this._listeners[type].splice(i, 1);
                        break;
                    }
                }
            } else {
                // 如果仅仅参数type, 或参数fn邪魔外道，则所有type类型事件清除
                delete this._listeners[type];
            }
        }
        return this;
    }
  }

  global.Turntable === undefined && (global.Turntable = Turntable);
  /**
 *
 * "Number"  "Object" "RegExp" "String" "Boolean"  "Array" "Window"  "Constructor"
 *
 */
function __getClass(object){
    return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
};
  //合并opts和defaults
  function mergeObj(target, resource) {
    if (typeof resource !== 'object') {
        resource = {};
    }
    for(var property in resource) {
      if (target.hasOwnProperty(property)) {
        target[property] = resource[property];
      }
    }
    return target;
  }
  /**
     * hasClass
     * @param {Object} ele   HTML Object
     * @param {String} cls   className
     * @return {Boolean}
     */
  function hasClass(ele, cls) {
    if (!ele || !cls) 
      return false;
    if (ele.classList) {
      return ele
        .classList
        .contains(cls);
    } else {
      return ele
        .className
        .match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    }
  }

  // addClass
  function addClass(ele, cls) {
    if (ele.classList) {
      ele
        .classList
        .add(cls);
    } else {
      if (!hasClass(ele, cls)) 
        ele.className += '' + cls;
      }
    }

  // removeClass
  function removeClass(ele, cls) {
    if (ele.classList) {
      ele
        .classList
        .remove(cls);
    } else {
      ele.className = ele
        .className
        .replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }
  }
}(window))