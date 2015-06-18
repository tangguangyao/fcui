/**
 * @file 地域单选组件
 * @author XingDa(xingda@baidu.com)
 * @author Su Xin(suxin04@baidu.com)
 */

define(function (require) {
    var etpl = require('etpl');
    var lib = require('esui/lib');
    var main = require('esui/main');
    var Control = require('esui/Control');
    var regionData = require('./regionData');
    require('etpl/tpl!./template.tpl');

    // 每一行最多显示的省份数量
    var LINE_MAX_NUM = 5;
    // 每个省份元素的宽度
    var PROVINCE_ITEM_WIDTH = 90;
    // 父子容器除去省份元素外宽度差
    var WIDTH_DIFF = 157;

    /**
     * 控件默认选项值
     * @type {Object}
     */
    var defaultOptions = {
        /**
         * 控件数据源
         * @type {Array.<Object>}
         */
        datasource: null,

        /**
         * 控件依附的元素ID
         * @type {string}
         */
        attachToElement: '',

        /**
         * 默认选择的地域
         * @type {?number}
         */
        currentRegion: null,

        /**
         * 自定义地域
         * @type {Array}
         */
        customRegions: {}
    };

    /**
     * 根据依附的元素定位控件主体元素
     * @param {jQuery} attachElem
     */
    function positionByAttachElement(attachElem) {
        var offset = attachElem.offset();
        var container = this.getContainerElement();
        var bodyWidth = $(document.body).outerWidth();
        if (!offset) {
            return;
        }

        offset.top += attachElem.outerHeight();
        // 若浮层超过屏幕宽度时，折向左边
        if ((offset.left + container.width()) > bodyWidth) {
            offset.left -= container.width() - attachElem.outerWidth(); 
        }

        this.positionAt(offset.left, offset.top);
    }

    /**
     * 地域单选组件
     * @param {Object} options
     * @constructor
     * @extends Control
     */
    function SingleRegion(options) {
        /**
         * 记录当前选择的地域
         * @type {?Object}
         * @private
         */
        this._currentRegion = null;

        /**
         * 记录当前选择的地域元素
         * @type {?jQuery}
         * @private
         */
        this._currentRegionElement = null;

        /**
         * 记录当前选择的地域元素的父级地域元素
         * @type {?jQuery}
         * @private
         */
        this._currentRegionParentElement = null;

        /**
         * 用户自定义的地域信息记录
         * @type {Object}
         * @private
         */
        this._customRegionInfo = {};

        Control.apply(this, arguments);
    }

    /**
     * 继承于Control基类
     */
    lib.inherits(SingleRegion, Control);

    /**
     * 控件类型，始终为SingleRegion
     * @type {string}
     */
    SingleRegion.prototype.type = 'SingleRegion';

    /**
     * 获取当前选择的地域
     * @returns {?Object}
     */
    SingleRegion.prototype.getCurrentRegion = function () {
        return this._currentRegion;
    };

    /**
     * 重置已选择的地域
     */
    SingleRegion.prototype.restoreRegion = function () {
        var currentRegionElement = this._currentRegionElement;
        var currentRegionParentElement = this._currentRegionParentElement;
        if (currentRegionElement) {
            currentRegionElement.find('input').prop('checked', false);
        }

        if (currentRegionParentElement) {
            this.helper.removePartClasses(
                'parent-active', 
                currentRegionParentElement[0]
            );
        }

        this._currentRegion = null;
        this._currentRegionElement = null;
        this._currentRegionParentElement = null;
    };

    /**
     * 设置当前已选地域
     * @param {number} regionCode 地域编码
     */
    SingleRegion.prototype.selectRegion = function (regionCode) {
        var lastRegion = this.getCurrentRegion();
        var currentRegion = this.getRegion(regionCode);

        // 如果没发生变化就啥也不干
        if (lastRegion && (lastRegion.code === currentRegion.code)) {
            return;
        }

        this.restoreRegion();

        var parentRegion = this.getParentRegion(regionCode);
        var containerElement = this.getContainerElement();
        var currentRegionElement = containerElement.find(
            '[data-item-value="' + regionCode + '"]'
        );
        var currentRegionParentElement = parentRegion
            ? containerElement
                .find('[data-item-value="' + parentRegion.code + '"]')
            : null;

        this._currentRegion = currentRegion;
        this._currentRegionElement = currentRegionElement;

        currentRegionElement.find('input').prop('checked', true);

        if (parentRegion) {
            this._currentRegionParentElement = currentRegionParentElement;
            this.helper.removePartClasses(
                'parent-active',
                currentRegionParentElement[0]
            );
        }

        // 用事件对调用者进行通知
        this.fire('change', {
            last: lastRegion,
            current: currentRegion
        });
    };

    /**
     * 设置自定义地域
     * @param {Object} regionInfo
     */
    SingleRegion.prototype.setCustomRegion = function (regionInfo) {
        var customRegionInfo = this._customRegionInfo;
        if (!customRegionInfo) {
            customRegionInfo = this._customRegionInfo = {};
        }
        customRegionInfo[regionInfo.code] = regionInfo;
    };

    /**
     * 获取地域对象
     * @param {number} regionCode 地域编码
     * @returns {Object}
     */
    SingleRegion.prototype.getRegion = function (regionCode) {
        var customRegionInfo = this._customRegionInfo;
        if (customRegionInfo.hasOwnProperty(regionCode)) {
            return customRegionInfo[regionCode];
        }

        return regionData.getRegion(regionCode);
    };

    /**
     * 获取父级地域对象
     * @param {number} regionCode 地域编码
     * @returns {Object}
     */
    SingleRegion.prototype.getParentRegion = function (regionCode) {
        var region = this.getRegion(regionCode);
        if (!region.parent) {
            return null;
        }

        return this.getRegion(region.parent);
    };

    /**
     * 初始化参数
     * @param {Object} options
     * @override
     */
    SingleRegion.prototype.initOptions = function (options) {
        var properties = $.extend(true, {}, defaultOptions, options);
        if (!properties.datasource) {
            properties.datasource = regionData.buildRegionList();
        }

        var customRegions = properties.customRegions;
        for (var i = 0, customRegion; customRegion = customRegions[i++];) {
            this.setCustomRegion(customRegion);
        }

        this.setProperties(properties);
    };

    /**
     * 初始化控件结构
     * @override
     */
    SingleRegion.prototype.initStructure = function () {
        // 默认隐藏控件
        this.hide();
        // 渲染控件内容
        this.renderContent();
        // 初始化事件
        this.initDomEvents();

        var currentRegion = this.currentRegion;
        if (typeof currentRegion === 'number') {
            this.selectRegion(currentRegion);
        }
    };

    /**
     * 依附元素的点击事件
     * @param {jQuery.Event} event
     */
    function attachElementClickHandler(event) {
        var regionEntity = event.data.regionEntity;

        // 将地域选择控件元素展示在依附元素下方
        positionByAttachElement.call(regionEntity, $(this));
        // 地域选择控件的显示切换
        regionEntity.toggle();

        event.stopPropagation();
    }

    /**
     * 控件元素的鼠标移入处理
     * @param {Object} options 选项参数
     */
    function containerElementMouseEnter(options, me) {
        var elem = options.elem;
        var offset = elem.offset();
        var subContainer = options.subContainer;
        var elemPosition = elem.position();
        var bodyWidth = $(document.body).outerWidth();

        if (subContainer.length > 0) {
            me.helper.addPartClasses('parent-active', elem[0]);
        }
        var left = elemPosition.left;
        var top = elemPosition.top + elem.outerHeight();
        if ((offset.left + subContainer.outerWidth()) > bodyWidth) {
            left -= subContainer.outerWidth() - elem.outerWidth();
        }
        subContainer.css({
            left: left + 'px',
            top: top + 'px',
            'z-index': Math.floor(+new Date / 1000)
        }).show();
    }

    /**
     * 控件元素的鼠标移出处理
     * @param {Object} options 选项参数
     */
    function containerElementMouseLeave(options, me) {
        var elem = options.elem;
        var subContainer = options.subContainer;
        var toElement = options.toElement;

        // 在子地域的container上绑定数据fromElement
        // 其值为鼠标在移入子地域container之前所在的元素
        // 即一级地域的选择所在的元素
        // 作用是在子地域container移出的时候
        // 顺便将这个元素的class清除掉
        subContainer.data('fromElement', elem);

        // 如果鼠标移出，则判断目标元素是否为相应的子地域
        // 在目标元素不是相应的子地域元素时，将子地域的container隐藏
        if (!toElement.closest(subContainer).length) {
            subContainer.hide();
            me.helper.removePartClasses('parent-active', elem[0]);
            return;
        }
    }

    /**
     * 控件元素的鼠标响应代理事件
     * @param {jQuery.Event} event
     */
    function containerElementMouseoverHandler(event) {
        var elem = $(this);
        var type = event.type;
        var regionEntity = event.data.regionEntity;
        var regionCode = elem.attr('data-item-value');
        var toElement = $(event.relatedTarget);
        var subContainer = $('.ui-singleregion-sub-container'
            + '[data-item-parent="' + regionCode + '"]');

        /**
         * 组织必要的参数
         * @type {Object}
         */
        var data = {
            elem: elem,
            subContainer: subContainer,
            toElement: toElement,
            regionCode: regionCode
        };

        if (type === 'mouseover') {
            containerElementMouseEnter(data, regionEntity);
        } else {
            containerElementMouseLeave(data, regionEntity);
        }

        event.stopPropagation();
    }

    /**
     * 控件子地域的容器鼠标移出事件
     * @param {jQuery.Event} event
     */
    function subContainerMouseLeaveHandler(event) {
        var elem = $(this);
        var toElement = $(event.relatedTarget);
        var regionEntity = event.data.regionEntity;
        var originalFromElement = elem.data('fromElement');

        if (!toElement.closest(elem.closest('div')).length) {
            regionEntity.helper.removePartClasses(
                'parent-active', 
                originalFromElement && originalFromElement[0]
            );
            elem.hide();
            elem.removeData('fromElement');
        }

        event.stopPropagation();
    }

    /**
     * 视窗大小改变的事件
     * @param {jQuery.Event} event
     */
    function windowResizeHandler(event) {
        var data = event.data;
        positionByAttachElement.call(data.regionEntity, data.attachElement);
    }

    /**
     * 全局委托点击事件
     * @param {jQuery.Event} event
     */
    function documentClickHandler(event) {
        var data = event.data;
        var target = $(event.target);
        if (!target.closest(data.containerElement).length) {
            data.regionEntity.hide();
        }
    }

    /**
     * 控件元素点击事件
     * @param {jQuery.Event} event
     */
    function regionClickHandler(event) {
        var elem = $(this);
        
        var data = event.data;
        var regionEntity = data.regionEntity;
        var regionCode = elem.attr('data-item-value');
        var regionDisabled = elem.attr('data-item-disabled') === 'true';

        if (!regionDisabled) {
            regionEntity.selectRegion(regionCode);
            data.subContainerElement.hide();
        }

        event.stopPropagation();
    }

    /**
     * 初始化控件事件
     */
    SingleRegion.prototype.initDomEvents = function () {
        var me = this;
        var containerElement = me.getContainerElement();
        var attachElement = me.getAttachElement();
        var subContainerElement = containerElement.find(
            '.ui-singleregion-sub-container'
        );
        var regionElement = containerElement.find(
            '[data-item-type="region"]'
        );

        var parentRegionElement = containerElement.find(
            '[data-item-rank="province"]'
        );

        var data = {
            regionEntity: me,
            containerElement: containerElement,
            attachElement: attachElement,
            subContainerElement: subContainerElement
        };

        // 绑定依附元素的点击事件
        attachElement.on('click', data, attachElementClickHandler);

        // 绑定地域元素的点击事件
        regionElement.on('click', data, regionClickHandler);

        // 绑定控件子地域的容器鼠标移出事件
        subContainerElement.on(
            'mouseout',
            data,
            subContainerMouseLeaveHandler
        );

        // 绑定控件主体的鼠标响应事件
        parentRegionElement.on(
            'mouseover mouseout',
            data,
            containerElementMouseoverHandler
        );

        // 绑定window的resize事件
        $(window).on('resize', data, windowResizeHandler);

        // 在document上委托click
        $(document).on('click', data, documentClickHandler);
    };

    /**
     * 渲染控件内容
     */
    SingleRegion.prototype.renderContent = function () {
        var container = this.getContainerElement();
        var datasource = this.get('datasource');
        var content = etpl.render('library-ui-single-region', {
            list: datasource,
            className: {
                container: this.helper.getPartClassName('container'),
                area: this.helper.getPartClassName('area'),
                itemChina: this.helper.getPartClassName('item-for-china'),
                itemForeign: this.helper.getPartClassName('item-for-foreign'),
                sectorItem: this.helper.getPartClassName('sector-item'),
                provinceItem: this.helper.getPartClassName('province-item'),
                subContainer: this.helper.getPartClassName('sub-container'),
                subLast: this.helper.getPartClassName('sub-last')
            }
        });

        container.html(content);
        this.changeContainerWidth(datasource, container);
    };

    /**
     * 根据展示地域的个数设置容器宽度
     *
     * @param {Object} data 显示的地域数据
     * @param {jQuery} container 父容器
     */
    SingleRegion.prototype.changeContainerWidth = function (data, container) {
        var sectorContainer = container.find(
            '.ui-singleregion-sector-item'
        );

        var length = 0;
        for (var i = 0; i < data.length; i++) {
            var item = data[i].provinces;
            var len = 0;
            for (var j = 0; j < item.length; j++) {
                if (item[j].status) {
                    len++;
                }
            }
            if (len > length) {
                length = len;
            }
        }
        if (length < LINE_MAX_NUM) {
            sectorContainer.css('width', length * PROVINCE_ITEM_WIDTH);
            container.css(
                'width', 
                length * PROVINCE_ITEM_WIDTH + WIDTH_DIFF
            );
        }
        return;
    }

    /**
     * 获取控件主体元素
     * @returns {jQuery}
     */
    SingleRegion.prototype.getContainerElement = function () {
        return $(this.main);
    };

    /**
     * 获取控件所依附的元素
     * @returns {jQuery}
     */
    SingleRegion.prototype.getAttachElement = function () {
        return $(this.get('attachToElement'));
    };

    /**
     * 控件定位
     * @param {number} left
     * @param {number} top
     */
    SingleRegion.prototype.positionAt = function (left, top) {
        this.getContainerElement().css({
            left: left + 'px',
            top: top + 'px'
        });
    };

    /**
     * 销毁控件
     * @override
     */
    SingleRegion.prototype.dispose = function () {
        if (this.helper.isInStage('DISPOSED')) {
            return;
        }

        // 解除window的resize事件
        $(window).off('resize', windowResizeHandler);

        // 解除document上委托click
        $(document).off('click', documentClickHandler);

        Control.prototype.dispose.apply(this, arguments);
    };

    // 注册控件
    main.register(SingleRegion);

    return SingleRegion;
});