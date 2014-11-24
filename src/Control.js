/**
 * FCUI (Fengchao UI)
 * Copyright 2014 Baidu Inc. All rights reserved.
 *
 * @file FCUI 控件基类，由ESUI 3.1.0-beta.3派生。
 * @author Han Bing Feng (hanbingfeng@baidu.com)
 * @param {Function} require require
 * @return {Control} FCUI 控件基类
 */
define(function (require) {
    var u = require('underscore');
    var eControl = require('esui/Control');
    var eoo = require('eoo');
    var Helper = require('./Helper');
    var lib = require('./lib');

    /**
     * @class Control
     *
     * Control类。
     *
     * @extends esui/Control
     * @constructor
     */
    var proto = {
        constructor: function () {
            this.$super(arguments);

            this.helper = new Helper(this);

            this.handlersMap = {};
        }
    };

    /**
     * 初始化事件handler。读取 this.eventHandlers 的配置，生成一组event
     * handlers。
     * @protected
     */
    proto.initEvents = function () {
        this.$super(arguments);
        u.each(this.eventHandlers, function (handler, id) {
            this.enableHandler(id);
        }, this);
    };

    /**
     * 从eventHandlers里找到id对应的handler并启用。
     * @param {string} id handler id
     * @param {boolean} isForce 是否无视enable设置直接启用
     */
    proto.enableHandler = function (id, isForce) {
        var handler = this.eventHandlers[id];
        if (!handler) {
            return;
        }
        var enable = handler.enable;
        if (typeof enable === 'function') {
            enable = enable.call(this);
        }
        if (handler && (typeof enable === 'undefined' || isForce || enable)) {
            var el = handler.el || this.main;
            if (el === this.main) {
                var handlersQueue = this.handlersMap[handler.eventType];
                if (typeof handlersQueue === 'undefined') {
                    handlersQueue = this.handlersMap[handler.eventType] = [];
                    // 第一次为这个类型的事件添加handler
                    this.helper.addDOMEvent(
                        el,
                        handler.eventType,
                        this.createHandler(handlersQueue),
                        handlersQueue.push(handler)
                    );
                }
                else {
                    handlersQueue.push(handler);
                }
            }
            else {
                handler.realHandler = u.bind(handler.handler, this);
                // global的就随他去吧
                this.helper.addDOMEvent(
                    el,
                    handler.eventType,
                    handler.realHandler
                );
            }
        }
    };

    /**
     * 取消一个handler的执行。
     * @param  {string} id handler id
     */
    proto.disableHandler = function (id) {
        var handler = this.eventHandlers[id];
        var el = handler.el || this.main;
        if (el === this.main) {
            var handlersQueue = this.handlersMap[handler.eventType];
            if (handlersQueue) {
                var index = u.indexOf(handlersQueue, handler);
                handlersQueue.splice(index, 1);
            }
        }
        else {
            if (handler && handler.realHandler) {
                this.helper.removeDOMEvent(
                    el,
                    handler.eventType,
                    handler.realHandler
                );
                handler.realHandler = undefined;
            }
        }
    };

    /**
     * 根据单个className的元素匹配函数
     * @param  {HTMLElement}  el HTML元素
     * @param  {string}  className 一个css名字
     * @return {boolean} 是否match
     */
    var rclass = /[\t\r\n]/g;
    function isCssMatch(el, className) {
        var cssClass = ' ' + className + ' ';
        var elClassName = ' ' + el.className + ' ';
        return  elClassName.replace(rclass, ' ').indexOf(cssClass) >= 0;
    }

    /**
     * 根据形如<attr>="<value>" 的string判断el是否匹配attrMatch
     * @param  {HTMLElement} el HTML元素
     * @param  {string} attrMatch attr匹配
     * @return {boolean} 是否匹配
     */
    function isAttrMatch(el, attrMatch) {
        var splitted = attrMatch.split('=');
        var value = lib.getAttribute(el, splitted[0]);
        if (value != null) {
            return value === '"' + splitted[1] + '"';
        }

        return false;
    }

    /**
     * 创建一个delegate handler，在this.main上监听处理eventType。
     * @param {Array<Control~eventHandler>} handlersQueue handler数组
     * @return {Function} delegate handler
     */
    proto.createHandler = function (handlersQueue) {
        return u.bind(function (event) {
            var e = e || window.event;
            var cur = e.target;
            while (cur) {
                if (cur.nodeType === 1) {
                    for (var i = handlersQueue.length - 1; i >= 0; i--) {
                        var handler = handlersQueue[i];
                        if (handler.cssMatch) {
                            if (!isCssMatch(cur, handler.cssMatch)) {
                                continue;
                            }
                        }

                        if (handler.attrMatch) {
                            if (!isAttrMatch(cur, handler.attrMatch)) {
                                continue;
                            }
                        }

                        handler.handler.call(this, e, cur);
                    }
                }
                if (cur === this.main) {
                    break;
                }
                cur = cur.parentNode;
            }
        }, this);
    };

    /**
     * 供子类填写的event handlers配置。id为event的名字，值为handler描述。
     * Event会delegate到this.main上。
     * 可以通过cssMatch和attrMatch锁定需要的event target。
     * @protected
     * @typedef {Object} Control~eventHandler
     * @property {string} id event handler的标识
     * @property {HTMLElement} el 事件的delegate target。
     *           非Global的事件，需要代理到this.main上。也即，这个属性可选值
     *           只有window，document，document.documentElement和document.body
     *           以及this.main。默认为this.main
     * @property {Function|boolean} enable handler是否生效。若为Function则
     *           需要返回一个boolean。Function将以Control为this调用。默认
     *           为true
     * @property {string} eventType event类型，为Element.addEventListener所能
     *           所能接收的type
     * @property {string} cssMatch 一个css名字。
     *           符合此名字的元素将作为event target
     * @property {string} attrMatch 形如 <attr>="value" 的string，用以
     *           匹配元素的属性值。若cssMatch和attrMatch同时存在，将以
     *           AND 的关系同时使用
     * @property {Function} handler 事件handler。以Control为this。以event，
     *           符合matcher的element为参数。
     */
    proto.eventHandlers = {};

    var fControl = eoo.create(eControl, proto);

    return fControl;
});
