/**
 * @file 选择控件数据处理
 * @author Guangyao Tang(tangguangyao@baidu.com)
 * 2014-05-23
 */

define(function (require, exports) {
    /**
     * 重新组织id,eg，id:1,父id:4 -> "4-1"
     * @param {Array} arr 需要组织的数组
     * @param {?string} id 父id
     */
    exports.adaptId = function (arr, id) {
        var newArr = [];
        adorn(arr, newArr, id);
        return newArr;
    };

    /**
     * 递归适配id, adaptId中调用
     * @param {Array} 需要转译的数组
     * @param {Array} 改写后存放数组
     * @param {?string} 需要转译的数组父id
     */
    function adorn (arr, newArr, parentId) {
        for (var i = arr.length - 1; i >= 0; i--) {
            var item = arr[i];
            if (typeof(parentId) != 'undefined') {
                item.id = parentId + '-' + item.id;
            }
            if (item.children && item.children.length > 0) {
                var children = item.children;
                item.children = [];
                adorn(children, item.children, item.id);
            }
            newArr.unshift(item);
        }
    }

    /**
     * 还原id
     * @param {Array} arr 需要组织的数组
     * @param {?string} id 父id
     */
    exports.restoreId = function (arr) {
        for (var i = arr.length - 1; i >= 0; i--) {
            var item = arr[i];
            var idx = -1;
            item.id = item.id + '';
            if ((idx = item.id.lastIndexOf('-')) > -1) {
                item.id = item.id.substr(idx+1);
            }
            if (item.children && item.children.length > 0) {
                this.restoreId(item.children);
            }
        }
    };

    /**
     * 解析‘2-3-4’模式的id为tree类型的id,父id信息
     * @param {string} 解析的id
     * @return {Array} arr 数组eg.['2-3-4', '2-3', '2']
     */
    exports.getIdArr = function (str) {
        var arr = [str];
        var idx = -1;
        while ((idx = str.lastIndexOf('-')) > -1) {
            str = str.substr(0, idx);
            arr.push(str);
        }
        return arr;
    };

    /**
     * 解析‘2-3-4’模式的id为初始id信息
     * 解析结果 arr = ['4', '3', '2']
     * arr[0]当前id, arr[1]当前的父id, arr[2]为arr[1]的父id
     * @param {string} 解析的id字符串
     * @param {Array} 存放解析id的数组
     * @return {Array} arr 数组
     */
    exports.getIdOriginalArr = function (str, idArr) {
        idArr = idArr || { arr: [] };
        var idx = -1;
        if ((idx = str.lastIndexOf('-')) > -1) {
            var id = str.substr(idx + 1);
            idArr.arr.push(id);
            str = str.substr(0, idx);
            this.getIdOriginalArr(str, idArr);
        } else {
            idArr.arr.push(str);
        }
        return idArr.arr;
    };

    /**
     * 在Tree结构中找到指定id的children
     * @param {Array} arr Tree结构
     * @param {string} id
     * @param {?Object} newArr 存放返回数组的对象
     * @return {Array} children
     */
    exports.findChildren = function (arr, id, newArr) {
        newArr = newArr || { arr: [] };
        for (var i = arr.length - 1; i >= 0; i--) {
            if (arr[i].id == id) {
                newArr.arr = arr[i].children;
            } else {
                this.findChildren(arr[i].children, id, newArr);
            }
        }
        return newArr.arr;
    };

    /**
     * 从数组中删除指定id的内容
     * @param {string} 父节点id
     * @param {Array} 展开的内容
     */
    exports.delItemInArr = function (id, arr) {
        var newArr = [];
        for (var i = arr.length - 1; i >= 0; i--) {
            if (arr[i].id == id) {
                continue;
            }
            newArr.unshift(arr[i]);
        }
        return newArr;
    };

    /**
     * 将数组中标记展开的属性设置为展开
     * @param {Array} arr
     */
    exports.expandArr = function (arr) {
        for (var i = arr.length - 1; i >= 0; i--) {
            var item = arr[i];
            item.isExpand = true;
            if (item.children && item.children.length > 0) {
                this.expandArr(item.children);
            }
        }
    };

    /**
     * 将节点内容设置为已添加标记
     * @param {Object} obj
     * @param {boolean} true 表示为已添加，false 表示取消添加
     * @param {boolean=} true 表示为深度设置
     */
    exports.setNodeAdded = function (node, isAdd, deep) {
        node.isAdd = isAdd;
        var arr = node.children;
        if (deep && arr && arr.length) {
            this.setListAdded(arr, isAdd);
        }
    };

    /**
     * 将数组中标记已添加的属性设置为已添加
     * @param {Array} list
     * @param {boolean} isAdd true 表示为已添加，false 表示取消添加
     */
    exports.setListAdded = function (list, isAdd) {
        for (var i = list.length - 1; i >= 0; i--) {
            var item = list[i];
            item.isAdd = isAdd;
            if (item.children && item.children.length > 0) {
                this.setListAdded(item.children, isAdd);
            }
        }
    };

    /**
     * 获取数组中叶子节点的个数
     * @param {Array} arr
     * @param {?Object} counter 存入已有叶子节点的个数
     */
    exports.findLeafTotal = function (arr, counter) {
        if (!arr) return null;
        counter = counter || {count: 0};
        for (var i = arr.length - 1; i >= 0; i--) {
            var children = arr[i].children;
            if (children && children.length > 0) {
                this.findLeafTotal(children, counter);
            } else if (arr[i].isLeaf){
                counter.count++;
            }
        }
        return counter.count;
    };
});