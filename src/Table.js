/**
 * FCUI (Fengchao UI)
 * Copyright 2014 Baidu Inc. All rights reserved.
 *
 * @file 表格控件
 * @author Han Bing Feng (hanbingfeng@baidu.com)
 * @param {Function} require require
 * @return {Table} 表格控件类
 */
define(function (require) {
    var u = require('underscore');
    var eoo = require('eoo');
    var etpl = require('etpl');

    require('./TipLayer');
    require('./Panel');
    require('./Button');
    require('./TextBox');

    var ui = require('./main');
    var lib = require('./lib');
    var Control = require('./Control');
    var handlers = require('./TableHandlers');

    /**
     * @class Table
     *
     * 表格控件。派生自ESUI 3.1.0-beta.3。
     *
     * @extends Control
     */
    var proto = {};

    /**
     * FCUI 表格控件构造函数。
     * @param  {Object} options 构建参数
     * @property {etpl/Engine} options.templateEngine
     *         自定义的ETPL engine。如不提供将使用默认的模板引擎。
     * @constructor
     */
    proto.constructor = function (options) {
        this.$super(arguments);

        var engine;
        if (options.templateEngine) {
            engine = options.templateEngine;
        }
        else {
            engine = new etpl.Engine();

            var tableTemplate = require('./text!./Table.tpl.html');
            engine.compile(tableTemplate);
        }

        this.helper.setTemplateEngine(engine);
    };

    proto.eventHandlers = handlers;

    /**
     * 表示一个表格field的对象。
     * 关于列宽：与ESUI Table相比，这个Table布局实现采用
     * 'table-layout: auto' 。
     * 具体的：
     * 1. 属性width将作为列的建议宽度，即，对于一个声明了width的列，
     * 表格将先满足width指定的宽度，若表格有剩余宽度，将可能会分配
     * 到这一列上。若表格容器宽度不够，将可能从这一列上减去宽度。
     * 2. 属性maxWidth声明列的最大宽度，对于这样的列，首先将会在列上每一个
     * 单元格中包裹一个div以限制表格内容的最大宽度。这个div的默认样式是
     * overflow hidden。可以选择配合ellipse属性隐藏超长的文本。
     * 3. 列不可以显式的设置最小宽度。当表格容器宽度不够时，浏览器自动减小列宽
     * 到内容允许的最小宽度，即，连续的西文字母及数字不折行。中文字及单词会
     * 折行。当空间仍不够时，表格容器出现横向滚动条。
     *
     * @typedef {Object} Table~field
     * @property {Table~content} content
     * @property {Table~content} extraContent
     * @property {boolean} select 是否是一个选择用field
     * @property {number} width
     *           当前field的建议宽度。当table有空余空间时，将会加到这个field
     *           上。当table没有空余空间时，将从这个field上减少宽度直至可能的
     *           最小。
     * @property {number} maxWidth 当前field的最大允许宽度
     *           当maxWidth存在时，width被忽略。
     * @property {boolean} breakLine 是否应用breakLine的css class，暂不支持
     * @property {boolean} sortable 是否可排序
     * @property {Array<Table~sortField>} sortFields 排序的字段列表，可选
     *           如不提供，则默认按照当列的field排序
     * @property {Function|string} tip 本列的tip内容。
     *           如果是string，则是静态tip
     *           如果是function，则调用来获得tip内容，参数供给和content一样
     * @property {Object} tipOptions 本列的tip内容，用于复杂tip的配置
     *           与field.tip二选一。属性tip优先。
     *           如存在，则使用这一组options初始化该列的tip。
     * @property {string} align 列的排序，可选left，right，center，justify
     * @property {string} tdClassName 附加在本列单元格TD上的class names
     * @property {boolean} editable 本列单元格是否可编辑
     * @property {string} editType 若editable为true，表示编辑的类型。若不提供
     *           则默认为text
     * @property {boolean} ellipse 是否需要为表内长文本内容加上'...'。
     */

    /**
     * 一个可排序字段的配置。
     * 显示在排序浮层中时，将显示 name + ascText 和 name + descText。
     * 点击排序后，sort事件中将有
     *     1. orderBy，发生了排序的field本身，传field对象
     *     2. order，排序顺序，asc或者desc
     *     3. realOrderBy，下面配置的field的值
     * @typedef {Object} Table~sortField
     * @property {string} field 排序的字段名
     * @property {string} name 排序字段显示出的名字
     * @property {string} ascText 升序的后缀文字，默认为“从低到高”
     * @property {string} descText 降序的后缀文字，默认为“从高到低”
     */

    /**
     * 默认属性值
     *
     * @type {Object}
     * @protected
     */
    proto.defaultProperties = {
        /**
         * 整个表格的最大高度，px为单位，设置为非0值会设置表格区
         * 的max-height css属性。当表格超高时，会出现竖向滚动条。
         * 不可通过setProperties修改
         * @property {number}
         * @default 0
         */
        tableMaxHeight: 0,
        /**
         * Table主体的z-index
         * 不可通过setProperties修改
         * @type {Number}
         * @default 0
         */
        zIndex: 0,
        /**
         * 表格外容器的宽度，可以设置为绝对宽度，也可以设置为百分比宽度
         * 不可通过setProperties修改
         * @type number
         * @default 100%
         */
        width: '100%',
        /**
         * 表格是否支持排序
         * 不可通过setProperties修改
         * @type {boolean}
         * @default false
         */
        sortable: false,
        /**
         * 是否对单元格内容进行HTML encode
         * 不可通过setProperties修改
         * @type {boolean}
         * @default false
         */
        encode: false,
        /**
         * 支持的行选中模式。可以为 'single' 或 'multi'
         * 不可通过setProperties修改
         * @type {String}
         * @defalut ''
         */
        select: '',
        /**
         * 是否要有竖向的边框
         * 不可通过setProperties修改
         * @type {boolean}
         * @default false
         */
        hasVborder: false,
        /**
         * 是否锁定表头在屏幕顶部。
         * 不可通过setProperties修改
         * 不可与tableMaxHeight同用。
         * @type {boolean}
         * @default {boolean}
         */
        fixHeadAtTop: false,
        /**
         * 给定另一个绘制在表头DOM之上的DOM。当表头锁定在屏幕顶时，将从这个
         * 给定的DOM开始锁定。
         * 这个给定的DOM一定必须在表头DOM之上，并且与表头DOM之间没有任何占
         * 高度的内容。
         * 这个给定的DOM需要保持背景非透明。否则表格内容将从这个DOM底露出来
         * 当fixHeadAtTop为false时，这个属性无意义。
         * 不可通过setProperties修改
         * @type {HTMLElement}
         * @default null
         */
        fixAtDom: null,
        /**
         * 是否是锁定列表格子控件中的右边控件
         * 不可通过setProperties修改
         * @type {boolean}
         * @default false
         */
        isLockedLeft: false,
        /**
         * 是否是锁定列表格子控件中的右边控件
         * 不可通过setProperties修改
         * @type {boolean}
         * @default false
         */
        isLockedRight: false,
        /**
         * 表格体是否含有任何ESUI控件。如果有的话Table将每次刷新表格体时
         * 初始化所有控件
         * @type {boolean}
         * @default false
         */
        bodyHasControls: false,
        /**
         * 不画表头部分
         * @type {boolean}
         * @default false
         */
        noHead: false,
        /**
         * 表格编辑的handler，默认支持text类型的
         * @type {Object}
         * @property {string} handler.id handler所处理的editType
         * @property {Function} handler方法
         */
        editHandlers: {
            text: textEditHandler
        },
        /**
         * 表格的数据源。
         * @type {Array}
         * @default []
         */
        datasource: [],
        /**
         * 表格的fields定义。
         * @type {Array<Table~field>}
         * @default []
         */
        fields: [],
        /**
         * 表格尾的fields配置。
         * @type {Array<Object>} footInfo
         * @default null
         * @property {number} colspan colspan
         *           foot和body、head域绘制在一个表格中。列宽自由伸展，
         *           使用时需要保证foot域的个数和表格体一致，包括colspan
         * @property {Function|string} content 获得表尾单元格内容
         * @property {string} align
         *           文字对齐方式，可以为left、right、center、justify
         */
        foot: null,
        /**
         * 按照哪个field排序，提供field名字
         * @type {string}
         * @default ''
         */
        orderBy: '',
        /**
         * 排序顺序
         * @default ''
         */
        order: '',
        /**
         * 已经选择了的行。设置为-1表示全部选中。当select为multi时，是数组。
         * 当select为single时，为单个行号。
         * @type {Array|number}
         */
        selectedRowIndex: []
    };

    /**
     * 控件类型
     *
     * @type {string}
     */
    proto.type = 'Table';

    /**
     * 获取表格相关ID
     *
     * @private
     * @param {Table} table 表格控件
     * @param {string} name 控件零件名字
     * @return {string} 控件零件的DOM id
     */
    function getId(table, name) {
        return table.helper.getId(name);
    }

    /**
     * 判断值是否为空
     *
     * @private
     * @param {Object} obj 某值
     * @return {bool}
     */
    function hasValue(obj) {
        return !(typeof obj === 'undefined' || obj === null);
    }

    /**
     * 判断值是否为空,包括空字符串
     *
     * @private
     * @param {Object} obj 待检测的字符串
     * @return {bool}
     */
    function isNullOrEmpty(obj) {
        return !hasValue(obj) || !obj.toString().length;
    }

    /**
     * 文本表格内编辑的处理
     * @this Table
     * @param {number} rowIndex 发生编辑的行号
     * @param {number} columnIndex 发生编辑的列号
     * @param {HTMLElement} el 发生了点击事件的元素
     */
    function textEditHandler(rowIndex, columnIndex, el) {
        var field = this.realFields[columnIndex];
        var editor = this.createInlineEditor(
            'text', rowIndex, columnIndex, el
        );
        this.fire('startedit', {
            field: field,
            rowIndex: rowIndex,
            columnIndex: columnIndex
        });
        editor.show();
    }

    /**
     * 拿取part所属的ui group名字
     * @param {string} part ui部件
     * @return {string} group名字
     */
    proto.getGroupName = function (part) {
        return this.id + part;
    };

    var guid = 1;

    proto.getChildControlId = function () {
        return this.id + '-' + (guid++);
    };

    /**
     * 获取整个表格体
     *
     * @public
     * @return {HTMLElement} 表格元素
     */
    proto.getTable = function () {
        return lib.g(getId(this, 'table'));
    },

    /**
     * 表头锁定顶部时，拿cover table的wrapper div
     * @return {HTMLElement} wrapper元素
     */
    proto.getCoverTableWrapper = function () {
        return lib.g(getId(this, 'cover-table-wrapper'));
    };

    /**
     * 获取Cover用整个表格体
     *
     * @public
     * @return {HTMLElement} 表格元素
     */
    proto.getCoverTable = function () {
        return lib.g(getId(this, 'cover-table'));
    },

    /**
     * 获取列表头容器元素
     *
     * @public
     * @return {HTMLElement} 表头元素
     */
    proto.getHead = function () {
        return lib.g(getId(this, 'thead'));
    },

    /**
     * 获取Cover用列表头容器元素
     *
     * @public
     * @return {HTMLElement} 表头元素
     */
    proto.getCoverHead = function () {
        return lib.g(getId(this, 'cover-thead'));
    },

    /**
     * 获取列表头colgroup元素
     *
     * @public
     * @return {HTMLElement} colgroup元素
     */
    proto.getColGroup = function () {
        return lib.g(getId(this, 'colgroup'));
    },

    /**
     * 获取Cover用列表colgroup元素
     *
     * @public
     * @return {HTMLElement} 表头元素
     */
    proto.getCoverColGroup = function () {
        return lib.g(getId(this, 'cover-colgroup'));
    },

    /**
     * 获取列表体容器元素
     *
     * @public
     * @return {HTMLElement} 表格体元素
     */
    proto.getBody = function () {
        return lib.g(getId(this, 'tbody'));
    };

    /**
     * 获取列表尾容器元素
     *
     * @public
     * @return {HTMLElement} 表格体元素
     */
    proto.getFoot = function () {
        return lib.g(getId(this, 'tfoot'));
    };

    /**
     * 取得某一行的TR元素
     * @param {number} index 行号
     * @return {HTMLElement} TR元素
     */
    proto.getRow = function (index) {
        return lib.getChildren(this.getBody())[index];
    };

    /**
     * Callback，在Table~field中定义，返回当前单元格应显示的文本内容的HTML。
     * @callback Table~content
     * @this {Table}
     * @param {Object} data 本行要显示的数据
     * @param {number} rowIndex 本行序号，0起始
     * @param {number} columnIndex 本列序号，0起始
     * @return {string} 本行的HTML
     *         默认的getCellHtml实现会将HTML包裹在一个DIV中
     */

    /**
     * Callback，在Table~field中定义，返回当前单元格额外显示的HTML。
     * 默认布局将显示在文本内容的下一行。
     * @callback Table~extraContent
     * @this {Table}
     * @param {Object} data 本行要显示的数据
     * @param {number} rowIndex 本行序号，0起始
     * @param {number} columnIndex 本列序号，0起始
     * @return {string} 本行的HTML
     *         默认的getCellHtml实现会将HTML包裹在一个DIV中
     */

    /**
     * 初始化表格的字段
     *
     * @private
     */
    proto.initFields = function () {
        if (!this.fields) {
            return;
        }

        // 避免刷新时重新注入
        var fields = this.fields;
        var realFields = fields.slice(0);
        var len = realFields.length;

        while (len--) {
            if (!realFields[len]) {
                realFields.splice(len, 1);
            }
        }

        this.realFields = realFields;

        if (!this.select) {
            this.fieldsMap = indexFields(this.realFields);
            return;
        }

        u.each(realFields, function (field) {
            if (field.sortField) {
                u.each(field.sortField, function (sfield) {
                    sfield.ascText = sfield.ascText || '由低到高';
                    sfield.descText = sfield.descText || '由高到低';
                });
            }
        });

        var me = this;
        switch (!this.isLockedRight && this.select.toLowerCase()) {
            // 如果表是锁定表的右子控件，不要画select fields
            case 'multi':
                realFields.unshift({
                    select: true,
                    maxWidth: 30,
                    title: function (item, index) {
                        return me.helper.renderTemplate('table-select-all', {
                            index: index,
                            disabled: me.disabled ? 'disabled="disabled"' : '',
                            checked: ''
                        });
                    },
                    content: function (item, index) {
                        return me.helper.renderTemplate('table-select-multi', {
                            index: index,
                            disabled: me.disabled ? 'disabled="disabled"' : '',
                            checked: ''
                        });
                    }
                });
                break;
            case 'single':
                realFields.unshift({
                    title: '&nbsp;',
                    select: true,
                    maxWidth: 30,
                    content: function (item, index) {
                        return me.helper.renderTemplate('table-select-single', {
                            index: index,
                            disabled: me.disabled ? 'disabled="disabled"' : '',
                            checked: ''
                        });
                    }
                });
                break;
        }

        this.fieldsMap = indexFields(this.realFields);
    };

    /**
     * 返回fields的索引，以field.field为key，field序号为value
     * @param {Array} fields fields
     * @return {Object} field索引
     */
    function indexFields(fields) {
        var obj = {};
        u.each(fields, function (field, index) {
            if (field.field) {
                obj[field.field] = index;
            }
        });
        return obj;
    }

    /**
     * 同步表格列的宽度到cover table上。
     */
    proto.syncWidth = function () {
        var tr = lib.getChildren(this.getBody());
        var coverCols = lib.getChildren(this.getCoverColGroup());
        if (tr.length) {
            var tds = lib.getChildren(tr[0]);
            u.each(tds, function (td, index) {
                coverCols[index].style.width = td.offsetWidth + 'px';
            });
        }
        if (this.fixHeadAtTop) {
            this.getCoverTableWrapper().style.width =
                this.getTable().offsetWidth + 'px';
        }
    };

    /**
     * 将一组TR或col的html 包装到thead、tfoot或者tbody中。
     * @param {string} wrapper colgroup、thead、tfoot或者tbody
     * @param {string} html 表示行或col的一组html
     * @return {HTMLElement} 包装好的一个HTML元素，可以加入到table结构中
     */
    function wrapTableHtml(wrapper, html) {
        var frag = document.createDocumentFragment();
        var div = document.createElement('div');
        div.innerHTML = ''
            + '<table>'
            + '<' + wrapper + '>'
            + html
            + '</' + wrapper + '>'
            + '</table>';
        frag.appendChild(div);
        var fragTable = div.firstChild;
        switch (wrapper) {
            case 'thead':
                return fragTable.tHead;
            case 'tbody':
                return fragTable.tBodies[0];
            case 'tfoot':
                return fragTable.tFoot;
            case 'colgroup':
                return fragTable.firstChild;
            default:
                return null;
        }
    }

    /**
     * IE9下，设置colgroup html
     * @param {string} html 新的html
     * @param {boolean} isCover true则为cover table设置colgroup
     */
    proto.ieSetColGroup = function (html, isCover) {
        var tableEl = isCover ? this.getCoverTable() : this.getTable();
        tableEl.removeChild(tableEl.firstChild);
        var colgroup = wrapTableHtml('colgroup', html);
        this.helper.addPartClasses('colgroup', colgroup);
        colgroup.id = this.helper.getId('colgroup');
        tableEl.insertBefore(colgroup, tableEl.firstChild);
    };

    /**
     * IE9下，设置thead html
     * @param {string} html 新的html
     * @param {boolean} isCover true则为cover table设置thead
     */
    proto.ieSetTHead = function (html, isCover) {
        var tableEl = isCover ? this.getCoverTable() : this.getTable();
        tableEl.deleteTHead();
        var thead = wrapTableHtml('thead', html);
        this.helper.addPartClasses('thead', thead);
        thead.id = this.helper.getId('thead');
        tableEl.insertBefore(thead, tableEl.tBodies[0]);
    };

    /**
     * IE9下，设置tbody html
     * @param {string} html 新的html
     */
    proto.ieSetTBody = function (html) {
        var tableEl = this.getTable();
        tableEl.removeChild(tableEl.tBodies[0]);
        var tbody = wrapTableHtml('tbody', html);
        this.helper.addPartClasses('tbody', tbody);
        tbody.id = this.helper.getId('tbody');
        tableEl.insertBefore(tbody, tableEl.tHead.nextElementSibling);
    };

    /**
     * IE9下，设置tfoot html
     * @param {string} html 新的html
     */
    proto.ieSetTFoot = function (html) {
        var tableEl = this.getTable();
        tableEl.deleteTFoot();
        var tfoot = wrapTableHtml('tfoot', html);
        this.helper.addPartClasses('tfoot', tfoot);
        tfoot.id = this.helper.getId('tfoot');
        tableEl.appendChild(tfoot);
    };

    /**
     * dispose掉所有表格头部的子控件
     */
    proto.disposeHeadChildren = function () {
        // getGroup 遇到空会新建一个空的，所以不怕空
        this.viewContext.getGroup(this.getGroupName('head')).disposeGroup();
        if (this.isNeedCoverHead) {
            this.viewContext.getGroup(this.getGroupName('head')).disposeGroup();
            this.helper.disposeChildrenInGroup('cover-head');
        }
    };

    /**
     * dispose掉所有表格体的子控件
     */
    proto.disposeBodyChildren = function () {
        if (this.bodyHasControls) {
            this.viewContext.getGroup(this.getGroupName('body')).disposeGroup();
        }
    };

    /**
     * 初始化所有的表格头部子控件
     */
    proto.initHeadChildren = function () {
        var options = this.getTipOptions() || {};
        options.group = this.getGroupName('head');
        this.helper.initChildren(this.getHead(), options);
        if (this.isNeedCoverHead) {
            options.group = this.getGroupName('coverhead');
            this.helper.initChildren(this.getCoverHead(), options);
        }
        if (this.sortable) {
            this.initSort();
        }
    };

    /**
     * 初始化所有的表格体子控件
     */
    proto.initBodyChildren = function () {
        if (this.bodyHasControls) {
            this.helper.initChildren(this.getBody(), {
                group: this.getGroupName('body')
            });
        }
    };

    /**
     * 绘制表格头。
     * @protected
     */
    proto.renderHead = function () {
        if (this.noHead) {
            return;
        }

        var html = this.helper.renderTemplate('table-head', {
            realFields: this.realFields,
            fieldsLength: this.realFields.length,
            order: this.order,
            orderBy: this.orderBy
        });

        this.disposeHeadChildren();

        if (lib.ie && lib.ie <= 9) {
            this.ieSetTHead(html, false);
            if (this.isNeedCoverHead) {
                this.ieSetTHead(html, true);
            }
        }
        else {
            this.getHead().innerHTML = html;
            if (this.isNeedCoverHead) {
                this.getCoverHead().innerHTML = html;
            }
        }

        this.initHeadChildren();
    };

    /**
     * 初始化排序
     */
    proto.initSort = function () {
        var head = this.isNeedCoverHead ? this.getCoverHead() : this.getHead();
        var hsorts = lib.findAll(head, '.ui-table-hcell-hsort');
        u.each(hsorts, function (el) {
            var columnIndex = +lib.getAttribute(el, 'data-column');
            var field = this.realFields[columnIndex];
            var me = this;
            var tipLayer = ui.create('TipLayer', {
                id: this.getSortLayerId(field),
                content: this.getSortLayerContent(columnIndex),
                layerClasses: this.helper.getPartClasses('sort-layer'),
                eventHandlers: {
                    click: {
                        eventType: 'click',
                        query: '.ui-table-sort-item-wrapper',
                        handler: function (e, el) {
                            this.fire('close');
                            this.hide();

                            var order = lib.getAttribute(el, 'data-order');
                            var field = lib.getAttribute(el, 'data-order-by');
                            var realField = lib.getAttribute(el,
                                'data-real-order-by');
                            me.doSort(order, field, realField);
                        }
                    }
                }
            });
            tipLayer.appendTo(document.body);
            tipLayer.render();
            this.addChild(tipLayer, tipLayer.id);
            tipLayer.attachTo({
                targetDOM: el,
                showMode: 'over',
                delayTime: 500,
                positionOpt: lib.DockPosition.TOP_BOTTOM_RIGHT_RIGHT
            });
        }, this);
    };

    /**
     * 重绘排序
     * @param {Object} changesIndex 给repaint的changesIndex，其中
     *        order，orderBy，realOrderBy至少一项不是空的
     */
    proto.renderSort = function (changesIndex) {
        if (changesIndex == null) {
            return;
        }

        var columnIndex;
        var head = this.isNeedCoverHead ? this.getCoverHead() : this.getHead();
        var sorted;
        var layer;
        var field;
        if (typeof changesIndex.orderBy !== 'undefined') {
            var change = changesIndex.orderBy;
            if (!isNullOrEmpty(change.oldValue)) {
                columnIndex = this.fieldsMap[change.oldValue];
                // 去掉原来表头的排序样式
                sorted = lib.getChildren(lib.dom.first(head))[columnIndex];
                this.helper.removePartClasses('hcell-asc', sorted);
                this.helper.removePartClasses('hcell-desc', sorted);
                // 去掉原来表体的-cell-sorted class
                sorted = lib.findAll(this.getBody(), '.ui-table-cell-sorted');
                u.each(sorted, function (el, index) {
                    this.helper.removePartClasses('cell-sorted', el);
                }, this);
                // 重绘排序浮层的内容
                field = this.realFields[columnIndex];
                layer = this.getChild(this.getSortLayerId(field));
                layer.setContent(this.getSortLayerContent(columnIndex));
            }
            columnIndex = this.fieldsMap[change.newValue];
            sorted = lib.getChildren(lib.dom.first(head))[columnIndex];
            this.helper.addPartClasses('hcell-' + this.order, sorted);
            // 给表体对应的cell加上-cell-sorted class
            sorted = lib.findAll(this.getBody(),
                '.ui-table-cell:nth-child(' + (columnIndex + 1) + ')'
            );
            u.each(sorted, function (el, index) {
                this.helper.addPartClasses('cell-sorted', el);
            }, this);
        }

        if (typeof changesIndex.order !== 'undefined') {
            change = changesIndex.order;
            columnIndex = this.fieldsMap[this.orderBy];
            if (!isNullOrEmpty(change.oldValue)) {
                // 去掉原来表头的排序样式
                sorted = lib.getChildren(lib.dom.first(head))[columnIndex];
                this.helper.removePartClasses(
                    'hcell-' + change.oldValue, sorted
                );
            }
            sorted = lib.getChildren(lib.dom.first(head))[columnIndex];
            this.helper.addPartClasses(
                'hcell-' + change.newValue, sorted
            );
        }

        columnIndex = this.fieldsMap[this.orderBy];
        field = this.realFields[columnIndex];
        layer = this.getChild(this.getSortLayerId(field));
        layer.setContent(this.getSortLayerContent(columnIndex));
    };

    /**
     * 取得排序浮层的内容
     * @param {number} columnIndex 列号，从0开始
     * @return {string} 排序浮层HTML
     */
    proto.getSortLayerContent = function (columnIndex) {
        var field = this.realFields[columnIndex];
        return this.helper.renderTemplate('table-sort', {
            sortField: field.sortField || [],
            sortFieldLength: field.sortField ? field.sortField.length : 0,
            field: field,
            index: columnIndex,
            order: this.order,
            orderBy: this.orderBy,
            realOrderBy: this.realOrderBy
        });
    };

    /**
     * 执行排序动作
     * @param {string} order 排序方向
     * @param {string} orderBy 排序的字段名称
     * @param {string} realOrderBy 当配置了多字段排序时，真正的排序字段
     * @fires {Event} sort
     * @property {string} sort.order 排序方向
     * @property {string} sort.orderBy 发生排序的字段名称
     * @proeprty {string} sort.realOrderBy 当配置了多字段排序时，真正的排序字段
     */
    proto.doSort = function (order, orderBy, realOrderBy) {
        var props = {
            order: order,
            orderBy: orderBy,
            realOrderBy: realOrderBy
        };
        this.setProperties(props);
        if (isNullOrEmpty(props.realOrderBy)) {
            delete props.realOrderBy;
        }
        this.fire('sort', props);
    };

    /**
     * 取得每一列tip的id。
     * @param {Table~field} field 列对象
     * @return {string} id
     */
    proto.getTipId = function (field) {
        return this.id + '-' + field.field + '-htip';
    };

    /**
     * 取得每一列排序浮层的id。
     * @param {Object} field 列对象
     * @return {string} id
     */
    proto.getSortLayerId = function (field) {
        return this.id + '-' + field.field + '-hsort';
    };

    proto.getTipOptions = function () {
        var obj = {};
        u.each(this.realFields, function (field) {
            if (field.tipOptions) {
                obj[this.getTipId(field)] = field.tipOptions;
            }
        }, this);
        if (Object.keys(obj).length > 0) {
            return {properties: obj};
        }
    };

    /**
     * 根据容器宽度和field中的列宽string计算列宽。支持百分比。
     * @param  {string | number} width 列宽值
     * @param  {number} totalWidth 容器列宽
     * @return {number} 列宽值
     */
    function computeColumnWidth(width, totalWidth) {
        if (width.indexOf && width.indexOf('%') > 0) {
            // 是百分比
            var num = parseFloat(width);
            if (!isNaN(num)) {
                return num / 100 * totalWidth;
            }

            return null;
        }
        return width;
    }

    /**
     * 绘制表格colgroup。
     */
    proto.renderColGroup = function () {
        var cols = lib.getChildren(this.getColGroup());
        var fields = this.realFields;
        if (cols.length === fields.length) {
            // cols 够用了，不用重画了
            return;
        }

        var html = this.helper.renderTemplate('table-colgroup', {
            fields: fields,
            fieldsLength: fields.length
        });

        if (lib.ie && lib.ie <= 9) {
            this.ieSetColGroup(html, false);
            if (this.isNeedCoverHead) {
                this.ieSetColGroup(html, true);
            }
        }
        else {
            this.getColGroup().innerHTML = html;
            if (this.isNeedCoverHead) {
                this.getCoverColGroup().innerHTML = html;
            }
        }
    };

    /**
     * 初设表格列宽。
     * 直接将列宽信息写到table-colgroup中。待第一轮render
     * 完成后，还会针对列的最大列宽进行第二轮调整。
     * 此次绘制同时还会第一次设置this.columnsWidth
     */
    proto.setColumnsWidth = function () {
        var columnsWidth = this.columnsWidth = [];
        var totalMaxWidth = 0;
        var maxWidthColumns = this.maxWidthColumns = {};
        var width = this.getWidth();
        u.each(this.realFields, function (field, columnIndex) {
            var w = null;

            if (typeof field.maxWidth !== 'undefined') {
                w = computeColumnWidth(field.maxWidth, width);
                totalMaxWidth += w;
                maxWidthColumns[columnIndex] = w;
            }

            // 如果没有max-width，才考虑width
            if (w == null && typeof field.width !== 'undefined') {
                w = computeColumnWidth(field.width, width);
            }

            // 无论是maxWidth还是width，都当做width style画上去
            columnsWidth.push(Math.round(w));
        });

        this.totalMaxWidth = totalMaxWidth;

        var cols = lib.getChildren(this.getColGroup());
        u.each(cols, function (col, columnIndex) {
            var w = columnsWidth[columnIndex];
            if (w != null) {
                col.style.width = w + 'px';
            }
        });
    };

    /**
     * 获取表格所在区域宽度
     *
     * @protected
     * @return {number}
     */
    proto.getWidth = function () {
        if (typeof this.width !== 'undefined') {
            if (!this.width.indexOf) {
                // this.width 不是一个string，是一个绝对数
                return this.width;
            }
        }
        return lib.measureWidth(this.main);
    };

    /**
     * 设置具有最大列宽的列的单元格中的限宽div的宽度。
     */
    proto.setCellMaxWidth = function () {
        if (this.totalMaxWidth > 0) {
            var me = this;
            var tbody = this.getBody();
            var trs = lib.getChildren(tbody);
            // 设置每一行的columnIndex列的max-width
            u.each(trs, function (tr, rowIndex) {
                var tds = lib.getChildren(tr);
                u.each(me.maxWidthColumns, function (maxWidth, columnIndex) {
                    var td = tds[columnIndex];
                    var div = lib.dom.first(td);
                    div.style.maxWidth = maxWidth + 'px';
                });
            });
        }
    };

    /**
     * 调整最大列宽。
     * 当表格有富裕的空间时，加大其余没有声明max-width的列的width，
     * 迫使max-width的列变小到恰好等于max-width
     */
    proto.adjustMaxColumnWidth = function () {
        var containerWidth = this.getWidth();
        var tableWidth = this.getTable().offsetWidth;
        var me = this;
        if (this.totalMaxWidth > 0) {
            if (tableWidth <= containerWidth) {
                var availWidth = containerWidth - this.totalMaxWidth;
                // 要将availWidth分配到没设置maxWidth的列上
                // 先看看其他列都设置了多少的width
                u.each(this.columnsWidth, function (width, index) {
                    if (me.maxWidthColumns[index] == null) {
                        if (width != null) {
                            availWidth -= width;
                        }
                    }
                });

                if (availWidth > 0) {
                    // 声明的列宽有剩余，平均分配到除声明了
                    // 最大列宽的列之外的列上
                    var fieldsLength = this.realFields.length;
                    var avgWidth = availWidth /
                        (fieldsLength
                            - Object.keys(this.maxWidthColumns).length);
                    avgWidth = Math.round(avgWidth);

                    u.each(this.columnsWidth, function (width, index) {
                        if (me.maxWidthColumns[index] == null) {
                            me.columnsWidth[index] == null ?
                                me.columnsWidth[index] = avgWidth
                                : me.columnsWidth[index] += avgWidth;
                        }
                    });
                }
            }
            // else，表格自己的宽度已经超过了容器的宽度，有横滚动条了，
            // 没什么能做的了
        }

        // 设置更新的columnsWidth到colgroup上
        var cols = lib.getChildren(this.getColGroup());
        u.each(cols, function (col, index) {
            if (me.columnsWidth[index] != null) {
                col.style.width = me.columnsWidth[index] + 'px';
            }
        });
    };

    /**
     * 默认的获得一个表头TH元素文本内容的方法。会作为filter从模板中调用。
     * @protected
     * @param {Table~field} field 当前单元格对应的field对象
     * @param {number} index field所对应的列index
     * @return {string} HTML片段
     */
    proto.renderHeadTextContent = function (field, index) {
        var title = field.title;
        var contentHtml;
        // 计算内容html
        if (typeof title === 'function') {
            contentHtml = title.apply(this, arguments);
        }
        else {
            contentHtml = title;
        }
        if (isNullOrEmpty(contentHtml)) {
            contentHtml = '&nbsp;';
        }
        return contentHtml;
    };

    /**
     * 绘制表格体
     * @protected
     */
    proto.renderBody = function () {
        var html = this.helper.renderTemplate('table-body', {
            datasource: this.datasource || [],
            dataLength: this.datasource.length,
            realFields: this.realFields,
            fieldsLength: this.realFields.length,
            order: this.order,
            orderBy: this.orderBy
        });

        this.disposeBodyChildren();

        if (lib.ie && lib.ie <= 9) {
            // IE 9不能set tbody的innerHTML，用outerHTML
            this.ieSetTBody(html);
        }
        else {
            this.getBody().innerHTML = html;
        }

        this.initBodyChildren();
    };

    /**
     * 绘制表格tip内容
     * @param {Table~field} field field对象
     * @param {number} columnIndex 列index
     * @return {string} tip内容
     */
    proto.renderTipContent = function (field, columnIndex) {
        var tip = field.tip;
        // 计算内容html
        if (typeof tip === 'function') {
            return tip.call(this, field, columnIndex);
        }

        return tip;
    };

    /**
     * 默认的获取单元格内文本内容的方法。经由表格模板回调。
     * 调用field.content，获得cell的文字内容。
     * 如果没有field.content，会尝试画出data[content]。
     *
     * @protected
     * @this Table
     * @param {Object} data 当前行的数据
     * @param {Table~field} field 本单元格的field对象
     * @param {number} rowIndex 当前行的序号，0开始
     * @param {number} columnIndex 当前列的序号，0开始
     * @return {string} HTML的string。
     */
    proto.renderCellTextContent = function (
        data, field, rowIndex, columnIndex
    ) {
        // 先生成基本的content
        var content = field.content;
        var contentHtml = 'function' === typeof content
            ? content.call(this, data, rowIndex, columnIndex)
            : (this.encode
                ? lib.encodeHTML(data[content])
                : data[content]
            );
        // content需要有一个默认值
        if (isNullOrEmpty(contentHtml)) {
            contentHtml = '&nbsp;';
        }
        return contentHtml;
    };

    /*
     * 调用field.extraContent，获得额外的内容，显示在
     * div.{-cell-extra}内。如果没有额外的内容，div.{-cell-extra}
     * 不会画出来。
     * @protected
     * @this Table
     * @param {Object} data 当前行的数据
     * @param {Table~field} field 本单元格的field对象
     * @param {number} rowIndex 当前行的序号，0开始
     * @param {number} columnIndex 当前列的序号，0开始
     * @return {string} HTML的string。
     */
    proto.renderCellExtraContent = function (
        data, field, rowIndex, columnIndex
    ) {
        var extraContent = field.extraContent;
        var extraHtml = 'function' === typeof extraContent
            ? extraContent.call(this, data, rowIndex, columnIndex)
            : '';
        // 若没有extra，不生成任何东西
        if (isNullOrEmpty(extraHtml)) {
            return '';
        }

        return this.helper.renderTemplate('table-cell-extra', {
            content: extraHtml
        });
    };

    /**
     * 绘制表尾
     */
    proto.renderFoot = function () {
        if (this.foot == null) {
            return;
        }

        var html = this.helper.renderTemplate('table-foot', {
            footArray: this.foot,
            footLength: this.foot.length
        });

        if (lib.ie && lib.ie <= 9) {
            // IE 9不能set tbody的innerHTML，用outerHTML
            this.ieSetTFoot(html);
        }
        else {
            this.getFoot().innerHTML = html;
        }
    };

    /**
     * 绘制表尾单元格内容
     * @param {Object} footInfo 表尾信息Object
     * @param {number} columnIndex 表尾列index
     * @return {string} 表尾单元格内容
     */
    proto.renderFootCellContent = function (footInfo, columnIndex) {
        // 先生成基本的content
        var content = footInfo.content;
        var contentHtml;
        if (typeof content === 'function') {
            contentHtml = content.call(this, footInfo, columnIndex);
        }
        else {
            contentHtml = content;
        }
        // content需要有一个默认值
        if (isNullOrEmpty(contentHtml)) {
            contentHtml = '&nbsp;';
        }
        return contentHtml;
    };

    /**
     * 绘制已选中行
     * @param {boolean} isRevert 函数将去掉row上的selected class
     *      目标row由selected提供。默认为false
     * @param {Array|number} selected 已选行。isRevert == true时候需要
     */
    proto.renderSelectedRows = function (isRevert, selected) {
        var trs = lib.getChildren(this.getBody());
        if (typeof selected === 'undefined') {
            selected = this.selectedRowIndex;
        }
        isRevert = !!isRevert;

        switch (this.select.toLowerCase()) {
            case 'multi':
                if (selected === -1) {
                    // 所有行都选中
                    if (isRevert) {
                        u.each(trs, function (tr) {
                            lib.removeClasses(tr,
                                this.helper.getPartClasses('row-selected'));
                        }, this);
                    }
                    else {
                        u.each(trs, function (tr) {
                            lib.addClasses(tr,
                                this.helper.getPartClasses('row-selected'));
                        }, this);
                    }

                    u.each(
                        lib.findAll(this.getBody(), '.ui-table-multi-select'),
                        function (el) {
                            el.checked = !isRevert;
                        }
                    );
                }
                else {
                    if (isRevert) {
                        u.each(selected, function (rowIndex) {
                            lib.removeClasses(trs[rowIndex],
                                this.helper.getPartClasses('row-selected'));
                        }, this);
                    }
                    else {
                        u.each(selected, function (rowIndex) {
                            lib.addClasses(trs[rowIndex],
                                this.helper.getPartClasses('row-selected'));
                        }, this);
                    }
                }
                break;
            case 'single':
                if (typeof selected.length === 'undefined') {
                    if (isRevert) {
                        lib.removeClasses(trs[selected],
                            this.helper.getPartClasses('row-selected'));
                    }
                    else {
                        lib.addClasses(trs[selected],
                            this.helper.getPartClasses('row-selected'));
                    }
                }
                break;
            default:
                break;
        }
    };

    /**
     * 初始化参数
     *
     * @param {Object} options 构造函数传入的参数
     * @override
     * @protected
     */
    proto.initOptions = function (options) {
        var properties = {};

        if (options.hasVborder === 'false') {
            options.hasVborder = false;
        }

        u.extend(properties, this.defaultProperties, options);

        this.setProperties(properties);
    };

    /**
     * 初始化DOM结构
     *
     * @override
     * @protected
     */
    proto.initStructure = function() {
        this.$super(arguments);

        if (this.hasVborder) {
            lib.addClasses(this.main,
                this.helper.getStateClasses('has-vborder'));
        }

        if (typeof this.width !== 'undefined') {
            if (this.width.indexOf && this.width.indexOf('%') > -1) {
                // 设置了'%'形式的宽度
                this.main.style.width = this.width;
            }
            else {
                this.main.style.width = this.width + 'px';
            }
        }
        else {
            this.main.style.width = '100%';
        }

        this.isNeedCoverHead = false;

        if (this.tableMaxHeight !== 0) {
            this.main.style.maxHeight = this.tableMaxHeight + 'px';
            lib.addClasses(this.main,
                this.helper.getStateClasses('has-max-height'));

            this.isNeedCoverHead = true;
        }

        if (this.fixHeadAtTop) {
            this.isNeedCoverHead = true;
        }

        var tableHtml = '';
        if (this.isNeedCoverHead) {
            tableHtml += this.helper.renderTemplate('cover-table', {
                fixHeadAtTop: this.fixHeadAtTop
            });
        }

        tableHtml += this.helper.renderTemplate('table');

        if (this.noHead) {
            this.helper.addPartClasses('no-head');
        }

        if (this.foot == null) {
            this.helper.addPartClasses('no-foot');
        }

        this.main.innerHTML = tableHtml;

        this.setZIndex();

        if (this.fixHeadAtTop) {
            this.initFixHead();
        }
    };

    /**
     * 处理锁表头相关
     */
    proto.initFixHead = function () {
        lib.addClasses(this.main,
            this.helper.getStateClasses('fix-head'));
        this.refreshFixTop();
    };

    /**
     * 根据fixAtDom的高度，刷新this.fixHeight。
     * 当fixAtDom有变化时，需要主动调用
     */
    proto.refreshFixTop = function () {
        if (this.fixAtDom) {
            var position = this.fixAtDom.style.position;
            this.fixAtDom.style.position = 'inherit';
            this.fixHeight = lib.getOuterHeight(this.fixAtDom);
            this.fixTop = lib.getOffset(this.fixAtDom).top;
            this.fixAtDom.style.position = position;
        }
        else {
            this.fixHeight = 0;
            this.fixTop = lib.getOffset(this.getTable()).top;
        }
    };

    /**
     * 设置table主体的z-index。
     * @protected
     */
    proto.setZIndex = function () {
        this.main.style.zIndex = this.zIndex || '';
        if (this.isNeedCoverHead) {
            lib.g(getId(this, 'cover-table')).style.zIndex =
                this.getCoverZIndex;
        }
    };

    /**
     * 取得cover table的z-index。默认为table主z-index加1。
     * @return {number} z-index
     */
    proto.getCoverZIndex = function () {
        return this.zIndex + 1;
    };

    /**
     * 渲染控件
     *
     * @override
     * @fire headchanged
     * @fire bodychanged
     * @fire columnswidthchanged
     */
    proto.repaint = function (changes, changesIndex) {
        this.$super(arguments);
         // 初始化控件主元素上的行为
        var defaultProperties = this.defaultProperties;
        var allProperities = {};

        if (!changes) {
            for (var property in defaultProperties) {
                if (defaultProperties.hasOwnProperty(property)) {
                    allProperities[property] = true;
                }
            }
        }
        else {
            // 局部渲染
            for (var i = 0; i < changes.length; i++) {
                var record = changes[i];
                allProperities[record.name] = true;
            }
        }

        var fieldsChanged = false;
        var tHeadChanged = false;
        var tBodyChanged = false;
        var columnsWidthChanged = false;

        // 列的定义发生变化，重算fields
        if (allProperities.fields) {
            this.initFields();
            fieldsChanged = true;
        }

        // fields 发生变化，重画colgroup，初设列宽，绘制表头
        if (fieldsChanged) {
            this.renderColGroup();
            this.setColumnsWidth();
            columnsWidthChanged = true;

            this.renderHead();
            tHeadChanged = true;
        }

        // fields 发生变化，或者表体内容发生变化，重画表体
        if (fieldsChanged || allProperities.datasource) {
            this.renderBody();
            tBodyChanged = true;
        }

        // fields 发生变化，或者tfoot内容发生变化，重画tfoot
        if (fieldsChanged || allProperities.foot) {
            this.renderFoot();
            tBodyChanged = true;
        }

        // 列宽发生了变化，重调最大列宽
        if (columnsWidthChanged || tBodyChanged) {
            this.setCellMaxWidth();
            this.adjustMaxColumnWidth();
            if (this.isNeedCoverHead) {
                this.syncWidth();
            }
        }

        if (allProperities.order
            || allProperities.orderBy
            || allProperities.realOrderBy) {
            this.renderSort(changesIndex);
        }

        if (tBodyChanged || allProperities.selectedRowIndex) {
            if (changesIndex && changesIndex.selectedRowIndex) {
                var selectedObject = changesIndex.selectedRowIndex;
                if (typeof selectedObject.oldValue !== 'undefined') {
                    this.renderSelectedRows(true, selectedObject.oldValue);
                }
            }
            this.renderSelectedRows();
        }

        if (tHeadChanged) {
            this.fire('headchanged');
        }

        if (tBodyChanged) {
            this.fire('bodychanged');
        }

        if (columnsWidthChanged) {
            this.fire('columnswidthchanged');
        }
    };

    /**
     * 设置Table的datasource，并强制更新
     *
     * @param {Array} datasource 数据源
     * @public
     */
    proto.setDatasource = function(datasource) {
        this.datasource = datasource;
        this.selectedRowIndex = [];
        var record = {name: 'datasource'};
        var record2 = {name: 'selectedRowIndex'};

        this.repaint([record, record2],
            {
                datasource: record,
                selectedRowIndex: record2
            }
        );
    };

    /**
     * 创建一个表格的行内编辑器。
     * 这个方法创建的行内编辑器会覆盖在发生了编辑的TD之上。编辑器的内容
     * 为表格模板'table-edit-${type}'。模板内有确定和取消按钮，分别有
     * childName 'okButton' 和 'cancelButton'
     * 这个行内编辑器会注册为table的子控件，
     * 名字为inlineEditor-${type}-${rowIndex}-${columnIndex}
     * 若之前已经存在该子控件，将不会再创建它。
     * 返回创建了的编辑器
     * @param {string} type edit type
     * @param {number} rowIndex 行号
     * @param {number} columnIndex 行号
     * @param {HTMLElement} el 发生编辑的entry元素
     * @fires {Event} saveedit 编辑生效，之后会关闭编辑浮层，可被阻止
     * @property {Control} saveedit.editor 发生编辑的editor控件
     * @property {string} saveedit.value 从编辑控件中拿的值
     * @property {number} rowIndex 行号
     * @property {number} columnIndex 列号
     * @fires {Event} canceledit 编辑取消，之后会关闭编辑浮层，可被阻止
     * @property {Control} saveedit.editor 发生编辑的editor控件
     * @property {string} saveedit.value 从编辑控件中拿的值
     * @property {number} rowIndex 行号
     * @property {number} columnIndex 列号
     * @return {Control} 行内编辑器
     */
    proto.createInlineEditor = function (type, rowIndex, columnIndex, el) {
        var childName = 'inlineEditor-' + type + '-' + rowIndex
            + '-' + columnIndex;
        var editor = this.getChild(childName);
        if (!editor) {
            editor = ui.create('Panel', {
                parent: this,
                group: this.getGroupName('body'),
                show: function () {
                    this.setStyle('display', 'block');
                },
                hide: function () {
                    this.setStyle('display', 'none');
                },
                content: this.helper.renderTemplate('table-edit-' + type)
            });
            this.addChild(editor, childName);
            this.helper.addPartClasses('inline-editor', editor.main);
            this.helper.addPartClasses('inline-editor-' + type, editor.main);
            // z-index，大过cover的
            editor.setStyle('z-index', this.zIndex + 2);
            // 挪到body下面
            document.body.appendChild(editor.main);
            editor.render();
            var me = this;
            var field = this.realFields[columnIndex];
            editor.getChild('okButton').on('click', function () {
                var eventArgs = me.fire('saveedit',
                    getEditEventProps(me, editor, rowIndex, columnIndex));
                if (!eventArgs.isDefaultPrevented()) {
                    editor.hide();
                }
            });
            editor.getChild('cancelButton').on('click', function () {
                var eventArgs = me.fire('savecancel',
                    getEditEventProps(me, editor, rowIndex, columnIndex));
                if (!eventArgs.isDefaultPrevented()) {
                    editor.hide();
                }
            });
            var inputControl = editor.getChild('inputControl');
            if (inputControl) {
                var data = this.datasource[rowIndex];
                var content = field.editContent;
                var value = 'function' === typeof content
                    ? content.call(this, data, rowIndex, columnIndex)
                    : data[field.field];
                inputControl.setValue(value);
            }
        }
        // 定位editor到TD
        lib.dock(lib.parent(el, '.ui-table-cell'), editor.main,
            lib.DockPosition.TOP_TOP_LEFT_LEFT);

        return editor;
    };

    /**
     * 取得编辑事件的参数
     * @param {Table} table table
     * @param {Control} editor 编辑器控件
     * @param {number} rowIndex 行号
     * @param {number} columnIndex 行号
     * @return {Object} props
     */
    function getEditEventProps(table, editor, rowIndex, columnIndex) {
        var props = {
            field: table.realFields[columnIndex],
            editor: editor,
            rowIndex: rowIndex,
            columnIndex: columnIndex
        };
        var inputControl = editor.getChild('inputControl');
        if (inputControl) {
            props.value = inputControl.getValue();
        }
        return props;
    }

     /**
     * 获取Table的选中数据项
     *
     * @public
     * @return {Array} 选中的项
     */
    proto.getSelectedItems = function() {
        switch (this.select.toLowerCase()) {
            case 'multi':
                if (this.selectedRowIndex === -1) {
                    return this.datasource;
                }

                var selectedIndex = this.selectedRowIndex;
                var result = [];
                if (selectedIndex) {
                    var datasource = this.datasource;
                    if (datasource) {
                        for (var i = 0; i < selectedIndex.length; i++) {
                            result.push(datasource[selectedIndex[i]]);
                        }
                    }
                }
                return result;
            case 'single':
                return this.datasource[this.selectedRowIndex];
            default:
                break;
        }
        return [];
    };

    /**
     * 表格选中某一行。
     * @param  {number} index 行index
     * @param {string} select 强制以某种select状态执行选择。当Table作为锁定列
     *        表的子控件时有用
     */
    proto.selectRow = function (index, select) {
        select = select || this.select;
        switch (select.toLowerCase()) {
            case 'multi':
                this.selectedRowIndex.push(index);
                this.renderSelectedRows();
                break;
            case 'single':
                this.set('selectedRowIndex', index);
                break;
            default:
                break;
        }
    };

    /**
     * 表格取消选中某一行
     * @param  {number} index 行index
     * @param {string} select 强制以某种select状态执行选择。当Table作为锁定列
     *        表的子控件时有用
     */
    proto.unselectRow = function (index, select) {
        select = select || this.select;
        switch (select.toLowerCase()) {
            case 'multi':
                var selected = this.selectedRowIndex;
                selected.splice(u.indexOf(selected, index), 1);
                this.renderSelectedRows(true, [index]);
                break;
            case 'single':
                break;
            default:
                break;
        }
    };

    /**
     * 销毁释放控件
     *
     * @override
     */
    proto.dispose = function () {
        if (this.helper.isInStage('DISPOSED')) {
            return;
        }

        this.helper.beforeDispose();
        this.helper.dispose();
        this.helper.afterDispose();
    };

    var Table = eoo.create(Control, proto);
    require('./main').register(Table);

    return Table;
});
