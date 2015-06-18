/**
 * @file table扩展，当行数据包含某一个属性时增加表格行相应的css class
 * @author Hu Jian(hujian02@baidu.com)
 */

define(function (require) {
    var _ = require('underscore');
    var Table = require('esui/Table');
    var esui = require('esui');
    var lib = require('esui/lib');
    var Extension = require('esui/Extension');

    /**
     * table扩展
     *
     * @constructor
     * @extends {Extension}
     */
    function TableRowClass () {
        Extension.apply(this, arguments);
    }

    /**
     * 指定扩展类型
     *
     * @type {string}
     */
    TableRowClass.prototype.type = 'TableRowClass';

    /**
     * 获取行参数
     *
     * @param {esui/Table} table Table组件对象
     * @param {number} rowIndex 行索引
     * @return {Object}
     * @private
     */
    function getRowArgs(table, rowIndex) {
        var datasource = table.datasource;
        var data = datasource[rowIndex];
        var prop = this.prop;
        if (prop && data && data[prop]) {
            return {
                rowClass: table.getClass(this.rowClass)
            };
        }
        return null;
    }

    /**
     * 激活扩展
     *
     * @override
     */
    TableRowClass.prototype.activate = function () {
        var target = this.target;
        if (!(target instanceof Table)) {
            return;
        }
        target.addRowBuilders([{
            getRowArgs: _.bind(getRowArgs, this),
            getColHtml: $.noop
        }]);
        Extension.prototype.activate.apply(this, arguments);
    };

    /**
     * 取消扩展的激活状态
     *
     * @override
     */
    TableRowClass.prototype.inactivate = function () {
        var target = this.target;
        if (!(target instanceof Table)) {
            return;
        }
        Extension.prototype.inactivate.apply(this, arguments);
    };

    lib.inherits(TableRowClass, Extension);
    esui.registerExtension(TableRowClass);

    return TableRowClass;
});
