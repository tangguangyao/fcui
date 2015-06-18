/**
 * @file 物料选择控件
 * @author Guangyao Tang(tangguangyao@baidu.com)
 * 2014-05-23
 */

define(function (require) {
    var ui = require('esui');
    var lib = require('esui/lib');
    var Control = require('esui/Control');
    var Button = require('esui/Button');
    var Tree = require('esui/Tree');
    var TreeStrategy = require('esui/TreeStrategy');
    var data = require('./treeData');

    /**
     * 控件默认选项值
     * @type {Object}
     */
    var defaultOptions = {
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
     * Tree选择组件
     * @param {Object} options
     * @constructor
     * @extends Control
     */
    function TreeSelector (options) {
        Control.apply(this, arguments);
    }

    /**
     * 继承于Control基类
     */
    lib.inherits(TreeSelector, Control);

    /**
     * 控件类型，始终为TreeSelector
     * @type {string}
     */
    TreeSelector.prototype.type = 'TreeSelector';

    var TreeSelectorTemplate = ''
        + '<div class="ui-tree-selector">'
        + '<div class="selector-option-list">'
        + '<div class="selector-option-title">${optionTitle}</div>'
        + '<div class="selector-option"></div>'
        + '</div>'
        + '<div class="selector-arrow">'
        + '<i class="font-icon font-icon-largeable-caret-right '
        + 'font-icon-2x"></i></div>'
        + '<div class="selector-chosen-list">'
        + '<div class="selector-chosen-title">${chosenTitle}</div>'
        + '<div class="selector-chosen"></div>'
        + '<div class="selector-total-remove">'
        + '<span class="chosen-limit-num">'
        + '<span class="chosen-num">0</span>/${limit}'
        + '</span>'
        + '<span class="remove-all-chosen">全部删除</span>'
        + '</div></div></div>';

    var addButtonTemplate = ''
        + '<div class="tree-item-edit-container">'
        + '<div class="tree-item-text">${treeText}</div>'
        + '<div class="tree-item-add">'
        + '<i class="font-icon font-icon-${icon} ${addClass}"'
        + 'data-val="${treeId}"'
        + 'data-action="${action}"></i>'
        + '</div></div>';

    /**
     * 获取操作完成的值
     * @return {Object}
     */
    TreeSelector.prototype.getValue = function () {
        var list = this.chosenTree.datasource.children;
        var returnList = [];
        $.extend(true, returnList, list);
        data.restoreId(returnList);
        return returnList;
    };

    /**
     * 初始化参数
     * @param {Object} options
     * @override
     */
    TreeSelector.prototype.initOptions = function (options) {
        var properties = $.extend(true, {}, defaultOptions, options);
        this.setProperties(properties);
    };

    /**
     * 初始化控件结构
     * @override
     */
    TreeSelector.prototype.initStructure = function () {
        var wrapper = $(this.main);
        this.runSelector(wrapper);
    };

    /**
     * 运行选择器
     * @param {Object} wrapper 选择器容器
     */
    TreeSelector.prototype.runSelector = function (wrapper) {
        var me = this;
        var properties = me.properties;
        var selectorHtml = lib.format(TreeSelectorTemplate, {
            chosenTitle: properties.chosenList.title,
            optionTitle: properties.optionList.title,
            limit: properties.chosenList.limit
        });
        wrapper.html(selectorHtml);

        var optionList = data.adaptId(me.datasource.optionList);
        var optionData = {
            id: 'optionRoot',
            text: 'option',
            children: optionList
        };

        var chosenList = data.adaptId(me.datasource.chosenList);
        var chosenData = {
            id: 'chosenRoot',
            text: 'chosen',
            children: chosenList
        };

        var treeStrategy = new TreeStrategy({
            isLeafNode: function (node) {
                return node.isLeaf;
            },
            shouldExpand: function (node) {
                return node.isExpand;
            }
        });

        me.optionTree = ui.create('Tree', {
            datasource: optionData,
            strategy: treeStrategy,
            getItemHTML: function (node) {
                var addClass = node.isAdd ? 'added' : '';
                var data = {
                    id: lib.encodeHTML(node.id),
                    text: lib.encodeHTML(node.text),
                    addClass: addClass
                };
                return lib.format(this.itemTemplate, data);
            },
            itemTemplate: getTemplate('plus', 'add'),
            selectMode: 'single',
            hideRoot: true
        });

        me.chosenTree = ui.create('Tree', {
            datasource: chosenData,
            strategy: treeStrategy,
            itemTemplate: getTemplate('times', 'remove'),
            selectMode: 'single',
            hideRoot: true
        });

        me.optionTree.appendTo($(this.main).find('.selector-option')[0]);
        me.chosenTree.appendTo($(this.main).find('.selector-chosen')[0]);

        initEvent(me);

        // 设置已选总数
        setChosenTotal(me);
    };

    /**
     * 恢复可选按钮
     * @param {Object} treeSelector 实例
     * @param {string} id
     */
    function recoverAddButton (treeSelector, id) {
        var optionDom = $(treeSelector.main).find('.selector-option');
        var optionIndex = treeSelector.optionTree.nodeIndex;
        optionDom.find('li[data-id="'+ id +'"]')
            .find('i.added').removeClass('added');
        var idx = data.getIdArr(id);
        for (var i = idx.length - 1; i >= 0; i--) {
            optionDom.find('i[data-val="'+ idx[i] +'"]')
                .removeClass('added');

            // 可选树节点信息设置为未添加,异步加载时，可能已选内容还没有加载
            if (optionIndex[idx[i]]) {
                data.setNodeAdded(optionIndex[idx[i]], false);
            }
        }
    }

    /**
     * 获取文本模板
     * @param {string} text 动作名称
     * @param {string} action 动作标记
     * @return {string} 树节点的文本模板
     */
    function getTemplate (icon, action) {
        return lib.format(addButtonTemplate, {
                icon: icon,
                action: action,
                treeText: '${text}',
                treeId: '${id}',
                addClass: '${addClass}'
            });
    }

    /**
     * 设置已选的总数
     * @param {number} 总数
     */
    function setChosenTotal (treeSelector) {
        var index = treeSelector.chosenTree.nodeIndex;
        var total = data.findLeafTotal(index['chosenRoot'].children);
        $(treeSelector.main).find('.chosen-num').text(total);
    }

    /**
     * 初始化事件
     * @param {Object} treeSelector 实例
     */
    function initEvent (treeSelector) {
        initExpandOptionTree(treeSelector);
        initOperateTree(treeSelector);
    }

    /**
     * 初始化展开可选树事件
     * @param {Object} treeSelector 实例
     */
    function initExpandOptionTree (treeSelector) {
        var me = treeSelector;
        me.optionTree.on('expand', function (event) {
            var node = event.node;
            node.isExpand = true;
            if (!me.sync) {
                var optionIndex = me.optionTree.nodeIndex;
                if (optionIndex[node.id].children.length > 0) {
                    // 如果有子节点，证明加载过
                    return;
                }
                id = node.id + '';
                data.getIdOriginalArr(id);
                me.fire('asyncexpand', {
                    treeId: node.id,
                    idInfo: data.getIdOriginalArr(id),
                    level: 'next'
                });
            }
        });
    }

    /**
     * 展开可选菜单时，当可选中的叶子节点如果存在右边已选中，为不可点状态
     * @param {Object} treeSelector 实例
     * @param {string} id 展开的id
     * @param {Array} list 展开的数组
     */
    function expandOption (treeSelector, id, list) {
        var chosenIndex = treeSelector.chosenTree.nodeIndex;
        var parentDom = $(treeSelector.main).find('.selector-option')
            .find('li[data-id="'+ id +'"]');

        for (var i = list.length - 1; i >= 0; i--) {
            var item = list[i];
            if (!item.isLeaf) {
                return;
            } else if(chosenIndex[item.id]){
                parentDom.find('li[data-id="'+ item.id +'"]')
                    .find('i').addClass('added');
            }
        }
    }

    /**
     * 初始化操作树事件
     * @param {Object} treeSelector 实例
     */
    function initOperateTree (treeSelector) {
        var me = treeSelector;
        var id; // 选中的id
        // 已选中内容中删除内容
        $(me.main).find('.selector-chosen').on('click', '.tree-item-add',
            function (event){
                var target = $(event.target);
                if (target.attr('data-action') === 'remove') {
                    id = target.attr('data-val');
                    me.removeChosen(id);
                    recoverAddButton(me, id);
                }
            });

        // 已可选内容中添加内容
        $(me.main).find('.selector-option').on('click', '.tree-item-add',
            function (event) {
                var target = $(event.target);
                if (target.attr('data-action') === 'add'
                    && !target.hasClass('added')) {
                    id = target.attr('data-val');
                    me.addNode(id);
                }
            });

        // 全部删除
        $(me.main).find('.remove-all-chosen').on('click', function () {
            me.delAllChosenNode();
        });
    }

    /**
     * 解析层级补充上层结构
     * @param {Object} treeSelector 实例
     * @param {string} ids 节点信息
     * @param {Array} arr 展开的内容
     */
    function structureArr (treeSelector, ids, arr) {
        data.expandArr(arr);
        var optionIndex = treeSelector.optionTree.nodeIndex;
        var i = 1;
        while (ids[i]) {
            var cloneNode = {};
            $.extend(true, cloneNode, optionIndex[ids[i]]);
            arr = [{
                id: cloneNode.id,
                isExpand: true,
                obj: cloneNode.obj,
                text: cloneNode.text,
                children: arr
            }];
            i++;
        }
        return arr;
    }

    /**
     * 全部删除已选列表数据
     */
    TreeSelector.prototype.delAllChosenNode = function () {
        this.chosenTree.expandNode('chosenRoot', []);
        // esui 没有递归清除索引,手动清除
        var nodeIndex = this.chosenTree.nodeIndex;
        var optionIndex = this.optionTree.nodeIndex;
        for (var key in nodeIndex) {
            if (nodeIndex.hasOwnProperty(key) && key !== 'chosenRoot') {
                this.chosenTree.nodeIndex[key] = undefined;
            }
        }
        $(this.main).find('.selector-option')
            .find('.added').removeClass('added');

        // 可选节点标记为未添加
        data.setNodeAdded(optionIndex['optionRoot'], false, true);
        setChosenTotal(this);
    };

    /**
     * 在可选树中添加指定id
     * @param {Object} treeSelector 实例
     * @param {Object} id 已选Tree索引
     */
    TreeSelector.prototype.addNode = function (id) {
        id = id + '';
        var ids = data.getIdArr(id);
        var optionIndex = this.optionTree.nodeIndex;
        // 组合选中的点得上下树结构
        var arr;
        if (this.sync || optionIndex[id].isLeaf) {
            // 如果是同步或者是叶子节点，直接添加
            data.setNodeAdded(optionIndex[id], true, true);
            var cloneNode = {};
            $.extend(true, cloneNode, optionIndex[ids[0]]);
            arr = [cloneNode];

            this.upChosenNode(id, ids, arr);
        } else {
            this.fire('asyncadd',
                {
                    treeId: id,
                    idInfo: data.getIdOriginalArr(id),
                    level: 'all'
                });
        }
    };

    /**
     * 更新已选Tree内容
     * @param {string} id 选中的id
     * @param {Array} ids id的信息
     * @param {Array} arr 添加的数组
     */
    TreeSelector.prototype.upChosenNode = function (id, ids, arr) {
        if (this.isOverlimit(id, arr, this.properties.chosenList.limit)) {
            return;
        }
        var newArr = structureArr(this, ids, arr);
        // 数据添加到右侧
        this.addChosenTree(ids, newArr);
        // 点击完毕灰色不可点
        $(this.main).find('.selector-option li[data-id="'+ id +'"]')
            .find('i').addClass('added');
    };

    /**
     * 添加数据时，是否超过最大限制
     * @param {string} 添加的id
     * @param {Array} 添加的数据
     * @param {number} 最大限制
     * @return {boolean}
     */
    TreeSelector.prototype.isOverlimit = function (id, arr, limit) {
        var chosenIndex = this.chosenTree.nodeIndex;
        var optionIndex = this.optionTree.nodeIndex;
        var existNum = chosenIndex[id] ?
            data.findLeafTotal(chosenIndex[id].children) : 0;
        var newTotal = +$(this.main).find('.chosen-num').text()
                + data.findLeafTotal(arr) - existNum;
        if (newTotal > limit) {
            // 已选状态恢复为未选
            optionIndex[id].isAdd = false;
            this.fire('overlimit', {
                num: newTotal
            });
            return true;
        }
        $(this.main).find('.chosen-num').text(newTotal);
        return false;
    };

    /**
     * 在已选树中删除指定id
     * @param {Object} 已选Tree索引
     */
    TreeSelector.prototype.removeChosen = function (id) {
        var ids = data.getIdArr(id);
        var chosenIndex = this.chosenTree.nodeIndex;
        // 如果上层节点只有删除的这一个元素，等同于删除上层节点
        var selfId;
        var parentId;
        if (ids.length > 1) {
            selfId = ids[0];
            parentId = ids[1];
            var i = 1;
            while (ids[i] && chosenIndex[ids[i]].children.length === 1) {
                selfId = ids[i];
                parentId = ids[i + 1] || null;
                i++;
            }
        } else {
            selfId = ids[0];
            parentId = null;
        }

        // esui的索引清除bug(已反馈github)索引没有递归清除，这里手动处理
        var PRE_REG = new RegExp('^' + selfId + '\\-');
        for (var key in chosenIndex) {
            if (PRE_REG.test(key)) {
                chosenIndex[key] = undefined;
            }
        }
        
        this.delChosenTree(selfId, parentId);

        // 设置已选总数
        setChosenTotal(this);
    };

    /**
     * 删除已选tree
     * @param {string} id 删除的id
     * @param {string} parentId 删除的id上一级
     */
    TreeSelector.prototype.delChosenTree = function (id, parentId) {
        var children = parentId ? this.chosenTree.nodeIndex[parentId].children :
            this.chosenTree.datasource.children;
        var pid = parentId ? parentId : 'chosenRoot';
        var arr = data.delItemInArr(id, children);
        this.chosenTree.expandNode(pid, arr);
    };

    /**
     * 添加已选tree
     * @param {string} ids 添加的id信息
     * @param {Array} arr 添加的上下结构
     */
    TreeSelector.prototype.addChosenTree = function (ids, arr) {
        var chosenIndex = this.chosenTree.nodeIndex;
        var newArr = [];
        var i = 0;
        while (ids[i]) {
            if (chosenIndex[ids[i]]) {
                if (i === 0) {
                    this.chosenTree.expandNode(
                        ids[i],
                        data.findChildren(arr, ids[i])
                    );
                    return;
                } else {
                    newArr = chosenIndex[ids[i]].children
                            .concat(data.findChildren(arr, ids[i]));
                    this.chosenTree.expandNode(ids[i], newArr);
                    return;
                }
            }
            i++;
        }
        newArr = chosenIndex['chosenRoot'].children.concat(arr);
        this.chosenTree.expandNode('chosenRoot', newArr);
    };

    /**
     * 设置子节点，对外接口
     * @param {string} 父节点id
     * @param {Array} 展开的children数组
     */
    TreeSelector.prototype.setChildren = function (id, list) {
        list = data.adaptId(list, id);
        var optionIndex = this.optionTree.nodeIndex;

        // 如果展开的节点已经添加，则子节点都标记为添加
        if (optionIndex[id].isAdd) {
            data.setListAdded(list, true);
        }
        this.optionTree.expandNode(id, list);
        expandOption(this, id, list);
    };

    /**
     * 从外部添加子节点-对外接口
     * @param {string} 父节点id
     * @param {Array} 展开的内容
     */
    TreeSelector.prototype.addChildren = function (id, list) {
        var chosenIndex = this.chosenTree.nodeIndex;
        var optionIndex = this.optionTree.nodeIndex;

        // 添加的根节点和加入的节点已添加标记
        optionIndex[id].isAdd = true;
        var ids = data.getIdArr(id);
        var cloneNode = {};
        $.extend(true, cloneNode, optionIndex[id]);
        list = data.adaptId(list, id);
        cloneNode.children = list;
        arr = [cloneNode];
        this.upChosenNode(id, ids, arr);
    };

    /**
     * 重绘左侧选项树
     * TODO 下面两个repaint方法与runSelector方法代码重复。留待以后tree selector重构
     * 一起解决。这里留着重复code避免影响已用到tree的项目。
     */
    TreeSelector.prototype.repaintOptionTree = function () {
        var optionList = data.adaptId(this.datasource.optionList);
        this.optionTree.expandNode('optionRoot', optionList);
    };

    /**
     * 重绘右侧已选树
     */
    TreeSelector.prototype.repaintChosenTree = function () {
        var chosenList = data.adaptId(this.datasource.chosenList);
        this.chosenTree.expandNode('chosenRoot', chosenList);
    };

    // 注册控件
    ui.register(TreeSelector);

    return TreeSelector;
});