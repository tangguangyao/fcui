/**
 * @file 物料选择控件button
 * @author Guangyao Tang(tangguangyao@baidu.com)
 * 2014-06-23
 */

define(function (require) {
    var ui = require('esui');
    var lib = require('esui/lib');
    var Control = require('esui/Control');
    var Button = require('esui/Button');
    var Tree = require('esui/Tree');
    var TreeStrategy = require('esui/TreeStrategy');
    var Selector = require('./TreeSelector');

    /**
     * 控件默认选项值
     * @type {Object}
     */
    var defaultOptions = {
        /**
         * 控件button 名称
         * @type {string}
         */
        buttonName: '请选择执行对象',

        /**
         * 控件数据类型——数据同步/异步获取
         * 默认为同步
         * @type {boolean}
         */
        sync: true,

        /**
         * 控件数据源
         * @type {Object}
         */
        datasource: {
            chosenList: [],
            optionList:[]
        },

        /**
         * 控件默认属性
         * @type {Object}
         */
        properties: {
            /**
             * 可选默认属性
             * @type {Object}
             */
            optionList: {
                /**
                 * 可选默认title
                 * @type {string}
                 */
                title: '可选对象'
            },

            /**
             * 已选默认属性
             * @type {Object}
             */
            chosenList: {
                /**
                 * 已选默认title
                 * @type {string}
                 */
                title: '已选对象',
                /**
                 * 已选默认最大值
                 * @type {string}
                 */
                limit: 500
            }
        }
    };

    /**
     * TreeSelector带button选择组件
     * @param {Object} options
     * @constructor
     * @extends Control
     */
    function TreeSelectorButton () {
        Selector.apply(this, arguments);
    }

    /**
     * 继承于Control基类
     */
    lib.inherits(TreeSelectorButton, Selector);

    /**
     * 控件类型，始终为TreeSelector
     * @type {string}
     */
    TreeSelectorButton.prototype.type = 'TreeSelectorButton';

    var buttonTemplate = ''
        + '<div class="ui-tree-selector-button">'
        +     '<div class="ui-ctrl ui-select ${skin} open">'
        +     '<span class="ui-select-text" >${buttonName}</span>'
        + '</div>'
        + '<div class="tree-selector-container">'
        + '<div class="selector-wrapper"></div>'
        + '<div class="button-save-cancel">'
        + '<span data-ui-type="Button" data-ui-id="save"'
        +       'class="save" data-ui-skin="ui-fc-important">确定</span>'
        + '<span data-ui-type="Button" data-ui-id="cancel">取消</span>'
        + '</div></div></div>';
    /**
     * 初始化参数
     * @param {Object} options
     * @override
     */
    TreeSelectorButton.prototype.initOptions = function (options) {
        var properties = $.extend(true, {}, defaultOptions, options);
        this.setProperties(properties);
    };

    /**
     * 初始化控件结构
     * @override
     */
    TreeSelectorButton.prototype.initStructure = function () {
        var skin = this.helper.getPartClasses('select');
        var buttonHtml = lib.format(buttonTemplate, {
            buttonName : this.buttonName,
            skin: skin.join(' ')
        });
        $(this.main).html(buttonHtml);
        clickButton(this);
    };

    /**
     * 点击button按钮事件-展示下拉框，保存和取消
     * @param {Object} TreeSelectorButton 实例
     */
    function clickButton (TreeSelectorButton) {
        var me = TreeSelectorButton;
        var wrapper = $(me.main).find('.selector-wrapper');
        var selectorDom = $(me.main);
        selectorDom.find('.open').on('click', function () {
            if (!selectorDom.find('.ui-tree-selector')[0]) {
                me.runSelector(wrapper);
            }
            // 隐藏，展示下拉框
            if (selectorDom.find('.tree-selector-container').is(':hidden')) {
                selectorDom.find('.tree-selector-container').show();
                me.fire('showed');
            } else {
                selectorDom.find('.tree-selector-container').hide();
                me.fire('hided');
            }
        });

        ui.init(selectorDom.find('.ui-tree-selector-button')[0]);
        ui.get('save').onclick = function () {
            me.fire('save', {
                data: me.getValue(),
                total: +selectorDom.find('.chosen-num').text()
            });
            selectorDom.find('.tree-selector-container').hide();
        };
        ui.get('cancel').onclick = function () {
            me.fire('cancel');
            selectorDom.find('.tree-selector-container').hide();
        };
    }

    // 注册控件
    ui.register(TreeSelectorButton);

    return TreeSelectorButton;
});