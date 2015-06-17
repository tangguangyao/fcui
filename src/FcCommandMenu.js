/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2013 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file 命令菜单控件
 * @author Feixiang Yuan(yuanfeixiang@baidu.com)
 * @date 2014-12-01
 * 已合并扩展：
 *      FcCommandMenu 支持单条选项启用/禁用
 *      FcCommandMenuHoverToggle hover时显示浮层
 *      FcCommandButton
 */

define(
    function (require) {
        var u = require('underscore');
        var lib = require('./lib');
        var Control = require('./Control');
        var Layer = require('./Layer');

        /**
         * 选中某一项
         *
         * @param {Event} e DOM事件对象
         * @ignore
         */
        function selectItem(datasource, e) {
            for (var i in this.subLayers) {
                this.subLayers[i].hide();
            }
            this.layer.hide();

            var target = e.target;
            while (target !== e.currentTarget
                && !lib.hasAttribute(target, 'data-index')
            ) {
                target = target.parentNode;
            }

            if (target === e.currentTarget) {
                return;
            }
            // 当前选项是置灰的，不处理
            if (lib.hasClass(
                    target, this.helper.getPartClasses('node-disabled')[0]
                )
            ) {
                return;
            }

            var index = +target.getAttribute('data-index');
            var item = datasource[index];
            if (item) {
                if (typeof item.handler === 'function') {
                    item.handler.call(this, item, index);
                }
            }

            /**
             * @event select
             *
             * 选中菜单中的一项时触发
             *
             * @param {meta.CommandMenuItem} item 选中的项
             * @param {number} index 选中项在{@CommandMenu#datasource}中的的索引
             * @member CommandMenu
             */
            this.fire('select', {item: item, index: index});
        }

        /**
         * CommandMenu用浮层
         *
         * @extends Layer
         * @ignore
         * @constructor
         */
        function CommandMenuLayer() {
            Layer.apply(this, arguments);
            this.subLayers = {};
        }

        lib.inherits(CommandMenuLayer, Layer);

        CommandMenuLayer.prototype.nodeName = 'ul';

        CommandMenuLayer.prototype.dock = {
            top: 'bottom',
            left: 'left',
            spaceDetection: 'vertical',
            strictWidth: true
        };

        function getHiddenClasses(layer) {
            var classes = layer.control.helper.getPartClasses('layer-hidden');
            classes.unshift('ui-layer-hidden');

            return classes;
        }

        /**
         * 根据数据项获取菜单html内容
         * @param {Control} control 菜单所关联的Control
         * @param {Object} datasource 菜单的数据项。
         */
        function getLayerHtml(control, datasource) {
            var html = '';

            for (var i = 0; i < datasource.length; i++) {
                var dataItem =  datasource[i];
                var classes = control.helper.getPartClasses('node');
                if (i === control.activeIndex) {
                    classes.push.apply(
                        classes,
                        control.helper.getPartClasses('node-active')
                    );
                }
                if (dataItem.disabled) {
                    classes.push.apply(
                        classes,
                        control.helper.getPartClasses('node-disabled')
                    );
                }
                if (dataItem.children && dataItem.children.length > 0) {
                    classes.push.apply(
                        classes,
                        control.helper.getPartClasses('node-has-children')
                    );
                }
                html += '<li data-index="' + i + '"'
                    + ' class="' + classes.join(' ') + '">';

                html += control.getItemHTML(dataItem) + '</li>';
            }
            return html;
        }

        /**
         * 主菜单渲染
         * @param {HTMLElement} element 主菜单浮层dom节点
         */
        CommandMenuLayer.prototype.render = function (element) {
            var me = this;
            var control = me.control;
            var datasource = control.datasource;
            element.innerHTML = getLayerHtml(control, datasource);
        };

        /**
         * 获取浮层DOM元素
         *
         * @param {boolean} [create=true] 不存在时是否创建
         * @return {HTMLElement}
         */
        CommandMenuLayer.prototype.getElement = function (create) {
            var element = this.control.helper.getPart('layer');

            if (!element && create !== false) {
                element = this.create();
                this.render(element);
                lib.addClasses(element, getHiddenClasses(this));

                this.initBehavior(element);

                this.syncState(element);

                // IE下元素始终有`parentNode`，无法判断是否进入了DOM
                if (!element.parentElement) {
                    document.body.appendChild(element);
                }
            }

            return element;
        };

        /**
         * 根据datasource里的数据项生成对应element的创建子菜单，
         * @param {HTMLElement} element 主菜单浮层dom节点
         * @param {Object} datasource 子菜单的数据项，结构与主菜单的数据项一致。
         */
        CommandMenuLayer.prototype.createSubLayer = function (element, datasource) {
            var subLayerElement = Layer.create('ul');
            subLayerElement.className = element.className;
            subLayerElement.innerHTML = getLayerHtml(this.control, datasource);
            document.body.appendChild(subLayerElement);
            return subLayerElement;
        };

        /**
         * 隐藏层
         * @override
         */
        CommandMenuLayer.prototype.hide = function () {
            for (var i in this.subLayers) {
                var classes = getHiddenClasses(this);
                lib.addClasses(this.subLayers[i], classes);
            }
            Layer.prototype.hide.apply(this, arguments);
        };

        /**
         * 初始化层的交互行为
         *
         * @param {HTMLElement} element 层元素
         * @override
         */
        CommandMenuLayer.prototype.initBehavior = function (element) {
            var me = this;
            me.control.helper.addDOMEvent(element, 'click', u.partial(selectItem, me.control.datasource));
            me.control.addGlobalScrollHandler(function () {
                if (me.control.hasState('active')) {
                    me.toggle();
                }
            });
            u.each(me.control.datasource, u.partial(createSubLayers, me, element));
            me.control.helper.addDOMEvent(element, 'mouseover', u.partial(layerHoverHandler, me));
            me.control.helper.addDOMEvent(me.control.main, 'mouseover', u.partial(layerOutHandler, me));
        };

        /**
         * 创建所有的子菜单浮层。
         * @param {Layer} layer 主菜单浮层对象
         * @param {HTMLElement} element 主菜单浮层dom节点
         * @param {Object} item 针对每一个子菜单的数据项
         * @param {number} index 主菜单中需要生成子菜单所对应的索引号。
         */
        function createSubLayers(layer, element, item, index) {
            var children = item.children;
            if (children && children.length > 0) { // 生成二级子菜单。
                layer.subLayers[index] = layer.createSubLayer(element, children);
                layer.control.helper.addDOMEvent(layer.subLayers[index], 'click', u.partial(selectItem, children));
            }
        }

        /**
         * 主菜单的hover事件处理函数
         * @param {Layer} layer 主菜单浮层对象
         * @param {Event} e hover事件对象
         */
        function layerHoverHandler(layer, e) {
            var target = e.target;
            var currentIndex = +target.getAttribute('data-index');
            if (!/node-disabled/.test(target.className) && /node-has-children/.test(target.className)) {
                for (var i in layer.subLayers) {
                    if (+i === currentIndex) {
                        positionSubLayer(layer, e.currentTarget, currentIndex);
                        return;
                    }
                }
            }
            layerOutHandler(layer, e);
        }

        /**
         * 主菜单的mouseout事件处理函数
         * @param {Layer} layer 主菜单浮层对象
         * @param {Event} e hover事件对象
         */
        function layerOutHandler(layer, e) {
            for (var i in layer.subLayers) {
                var classes = getHiddenClasses(layer);
                lib.addClasses(layer.subLayers[i], classes);
            }
        }

        /**
         * 改变子菜单浮层的位置。
         * @param {Layer} layer 主菜单浮层对象
         * @param {HTMLElement} target 子菜单浮层位置的参照节点
         * @param {number} index 改变位置的子菜单在主菜单上的索引值。
         */
        function positionSubLayer(layer, target, index) {
            var subLayerElement = layer.subLayers[index];
            var classes = getHiddenClasses(layer);
            lib.removeClasses(subLayerElement, classes);
            Layer.attachTo(subLayerElement, target);
            var targetOffset = lib.getOffset(target);
            var left = parseInt(subLayerElement.style.left) + targetOffset.width + 1;
            var top = parseInt(subLayerElement.style.top) - targetOffset.height;
            subLayerElement.style.left = left + 'px';
            subLayerElement.style.top = top + 'px';
        }

        /**
         * 菜单浮层销毁 
         * @override
         */
        CommandMenuLayer.prototype.dispose = function () {
            Layer.prototype.dispose.apply(this, arguments);
            for (var i in this.subLayers) {
                document.body.removeChild(this.subLayers[i]);
            }
            this.subLayers = null;
        };

        /**
         * 命令菜单
         *
         * 命令菜单在点击后会出现一个下拉框，根据{@link CommandMenu#datasource}配置，
         * 点击其中一项后会执行对应的{@link meta.CommandMenuItem#handler}函数，
         * 或者触发{@link CommandMenu#select}事件
         *
         * @extends {Control}
         * @constructor
         * @param {Object} options 选项
         * @param {string} options.mode 何时显示下拉 click/hover
         * @param {boolean} options.isCommandButton 是否是CommandButton模式
         */
        function CommandMenu(options) {
            Control.apply(this, arguments);
            this.isCommandButton = options.isCommandButton === 'true'
                || options.isCommandButton === true;
            this.mode = options.mode || 'click';
            this.layer = new CommandMenuLayer(this);
        }

        /**
         * 控件类型，始终为`"CommandMenu"`
         *
         * @type {string}
         * @readonly
         * @override
         */
        CommandMenu.prototype.type = 'FcCommandMenu';

        /**
         * 浮层中每一项的HTML模板
         *
         * 在模板中可以使用以下占位符：
         *
         * - `{string} text`：文本内容，经过HTML转义
         *
         * @type {string}
         */
        CommandMenu.prototype.itemTemplate = '${text}';

        /**
         * 获取浮层中每一项的HTML
         *
         * @param {meta.CommandMenuItem} item 当前项的数据项
         * @return {string} 返回HTML片段
         */
        CommandMenu.prototype.getItemHTML = function (item) {
            var data = {
                text: u.escape(item.text)
            };
            return lib.format(this.itemTemplate, data);
        };

        /**
         * 初始化DOM结构
         *
         * @protected
         * @override
         */
        CommandMenu.prototype.initStructure = function () {
            var helper = this.helper;
            // 增加disabled状态
            if (this.disabled) {
                this.helper.addStateClasses('disabled');
            }
            if (this.isCommandButton) {
                this.initCommandButton();
            }
            else {
                switch (this.mode) {
                    case 'click':
                        helper.addDOMEvent(
                            this.main,
                            'click',
                            u.bind(this.layer.toggle, this.layer)
                        );
                        break;
                    case 'over':
                        var elements = [this.main, this.layer.getElement()];
                        for (var i in this.layer.subLayers) {
                            elements.push(this.layer.subLayers[i]);
                        }
                        Layer.delayHover(
                            elements,
                            40,
                            u.bind(this.layer.show, this.layer),
                            u.bind(this.layer.hide, this.layer)
                        );
                        break;
                    default:
                        break;
                }
            }
        };

        /**
         * 初始化commandButton
         */
        CommandMenu.prototype.initCommandButton = function () {
            // this 是commandMenu
            var control = this;
            control.main.innerHTML = getButtonTpl(control);
            lib.addClasses(
                control.main,
                control.helper.getPartClasses('button')
            );
            // 如果控件可用，绑定事件
            if (!control.disabled) {
                var mainButton = control.helper.getPart('main-button');
                var dropButton = control.helper.getPart('drop-button');
                // 点击主区域，fire出事件
                control.helper.addDOMEvent(
                    mainButton,
                    'click',
                    u.bind(mainButtonClickHandler, control)
                );
                // 点击下拉区域，toggle layer
                control.helper.addDOMEvent(
                    dropButton,
                    'click',
                    u.bind(dropButtonClickHandler, control)
                );
            }
        };

        /**
         * 点击主区域事件处理
         */
        function mainButtonClickHandler() {
            // this 是commandMenu
            this.layer.hide();
            this.fire('mainbuttonclick');
        }

        /**
         * 点击下拉区域事件处理
         */
        function dropButtonClickHandler() {
            // this 是commandMenu
            this.layer.toggle();
        }

        /**
         * 获得主控件模板
         *
         * @param {Object} control 主控件
         * @return {string} html
         */
        function getButtonTpl(control) {
            var tpl = [
                '<div id="${mainButtonId}" class="${mainButtonClass}">',
                '${displayText}',
                '</div>',
                '<div id="${dropButtonId}" class="${dropButtonClass}"></div>'
            ].join('');

            var data = {
                displayText: control.displayText,
                mainButtonId: control.helper.getId('main-button'),
                mainButtonClass: control.helper.getPartClasses('main-button')
                    .join(' '),
                dropButtonId: control.helper.getId('drop-button'),
                dropButtonClass: control.helper.getPartClasses('drop-button')
                    .join(' ')
            };

            return lib.format(tpl, data);
        }

        /**
         * 根据value的值禁用单条的item
         *
         * @param {string} value item的值
         */
        CommandMenu.prototype.disableItemByValue = function (value) {
            lib.addClasses(
                getNodeByValue.call(this, value),
                this.helper.getPartClasses('node-disabled')
            );
        };

        /**
         * 根据value的值禁用子菜单单条的item
         * @param {string} mainValue 主菜单的item值
         * @param {string} value 该主菜单tem所对应的子菜单item的值
         */
        CommandMenu.prototype.disableSubItemByValue = function (mainValue, value) {
            var index = getDataIndexByValue.call(this, mainValue);
            var children = this.datasource[index].children;
            var subIndex = 0;
            for (var j = children.length; subIndex < j; ++subIndex) {
                if (children[subIndex].value === value) {
                    break;
                }
            }
            lib.addClasses(
                lib.find(this.layer.subLayers[index], 'li[data-index="' + subIndex + '"]'),
                this.helper.getPartClasses('node-disabled')
            );
        };

        /**
         * 根据value的值激活单条item
         *
         * @param {string} value  item的值
         */
        CommandMenu.prototype.enableItemByValue = function (value) {
            lib.removeClasses(
                getNodeByValue.call(this, value),
                this.helper.getPartClasses('node-disabled')
            );
        };

        /**
         * 根据value的值激活子菜单单条的item
         * @param {string} mainValue 主菜单的item值
         * @param {string} value 该主菜单tem所对应的子菜单item的值
         */
        CommandMenu.prototype.enableSubItemByValue = function (mainValue, value) {
            var index = getDataIndexByValue.call(this, mainValue);
            var children = this.datasource[index].children;
            var subIndex = 0;
            for (var j = children.length; subIndex < j; ++subIndex) {
                if (children[subIndex].value === value) {
                    break;
                }
            }
            lib.removeClasses(
                lib.find(this.layer.subLayers[index], 'li[data-index="' + subIndex + '"]'),
                this.helper.getPartClasses('node-disabled')
            );
        };

        /**
         * 根据value值在datasource里面找出dataIndex
         * @param {string} value 值
         * @return {number} 下标
         */
        function getDataIndexByValue(value) {
            for (var i = 0, dataItem; dataItem = this.datasource[i]; i++) {
                if (value === dataItem.value) {
                    return i;
                }
            }
        }

        /**
         * 根据value的值，获取浮层中的node节点
         * @param {string} value 值
         * @return {element} 值为value 的节点
         */
        function getNodeByValue(value) {
            var index = getDataIndexByValue.call(this, value);
            return lib.find(
                this.layer.getElement(), 'li[data-index="' + index + '"]'
            );
        }

        var COMMAND_MENU_WIDTH = 44;

        var paint = require('./painters');
        /**
         * 重新渲染
         *
         * @method
         * @protected
         * @override
         */
        CommandMenu.prototype.repaint = paint.createRepaint(
            Control.prototype.repaint,
            /**
             * @property {number} width
             *
             * 宽度
             */
            paint.style('width'),
            /**
             * @property {number} width
             *
             * 宽度
             */
            {
                name: 'width',
                paint: function (menu) {
                    menu.main.style.width = menu.width;
                    if (menu.isCommandButton) {
                        lib.find(menu.main, '.ui-fccommandmenu-main-button')
                            .style.width = menu.width - COMMAND_MENU_WIDTH;
                    }
                }
            },
            /**
             * @property {number} height
             *
             * 高度，指浮层未展开时的可点击元素的高度， **与浮层高度无关**
             */
            paint.style('height'),
            {
                /**
                 * @property {meta.CommandMenuItem[]} datasource
                 *
                 * 数据源，其中每一项生成浮层中的一条
                 */
                name: 'datasource',
                paint: function (menu) {
                    menu.layer.repaint();
                }
            },
            /**
             * @property {string} displayText
             *
             * 显示在可点击元素上的文本，会自动进行HTML转义
             */
            {
                name: 'displayText',
                paint: function (menu) {
                    if (menu.isCommandButton) {
                        lib.find(menu.main, '.ui-fccommandmenu-main-button')
                            .innerHTML = menu.displayText;
                    }
                    else {
                        menu.main.innerHTML = menu.displayText;
                    }
                }
            },
            {
                name: ['disabled', 'hidden', 'readOnly'],
                paint: function (menu, disabled, hidden, readOnly) {
                    if (disabled || hidden || readOnly) {
                        menu.layer.hide();
                    }
                }
            }
        );

        /**
         * 销毁控件
         *
         * @override
         */
        CommandMenu.prototype.dispose = function () {
            if (this.helper.isInStage('DISPOSED')) {
                return;
            }

            if (this.layer) {
                this.layer.dispose();
                this.layer = null;
            }

            Control.prototype.dispose.apply(this, arguments);
        };

        lib.inherits(CommandMenu, Control);
        require('./main').register(CommandMenu);
        return CommandMenu;
    }
);
