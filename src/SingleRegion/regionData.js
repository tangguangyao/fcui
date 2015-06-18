/**
 * @file 地域数据定义与处理
 * @author XingDa(xingda@baidu.com)
 */

define(function (require, exports) {
    var underscore = require('underscore');

    /**
     * 地域编码与地域信息的映射，便于通过编码查找地域信息
     * @type {Object}
     */
    var REGION_MAP = require('./regionMap');

    /**
     * 地域分区的初始化定义
     * @type {Array}
     */
    var REGION_SECTOR = require('./regionSectorMap');

    /**
     * 获取地域信息
     * @param {number} regionCode
     * @returns {Object}
     */
    exports.getRegion = function (regionCode) {
        return REGION_MAP[regionCode];
    };

    /**
     * 获取目标地域子地域集合信息
     * @param {number} regionCode
     * @returns {Object}
     */
    exports.getSubRegions = function (regionCode) {
        return underscore.where(
            REGION_MAP,
            { parent: regionCode }
        );
    };

    /**
     * 获取目标地域父级地域信息
     * @param {number} regionCode
     * @returns {Object}
     */
    exports.getParentRegion = function (regionCode) {
        var region = exports.getRegion(regionCode);
        if (!region.parent) {
            return null;
        }

        return exports.getRegion(region.parent);
    };

    /**
     * 创建地域列表
     * @returns {Object}
     */
    exports.buildRegionList = function () {
        var regionList = $.extend(true, [], REGION_SECTOR);

        // 遍历分区列表
        underscore.each(regionList, function (sector) {
            sector.status = true;
            var provinces = sector.provinces;
            // 遍历分区下的省份，并将省份的地域代码标识转换为对应的地域信息
            sector.provinces = underscore.map(provinces, function (province) {
                var region = exports.getRegion(province);
                var subRegions = exports.getSubRegions(region.code);
                region = $.extend(region, {
                    status: true,
                    cities: subRegions
                });
                return region;
            });
        });

        return regionList;
    };

    /**
     * 根据输入的ID获取地域列表
     * @param regionCodes
     * @returns {Object}
     */
    exports.buildRegionListByCodes = function (regionCodes) {
        var regionList = $.extend(true, [], REGION_SECTOR);
        regionCodes = [].concat(regionCodes);

        // 预处理regionCodes，将其转换为元素为数据项的数组，以提高后面遍历的效率
        var regions = underscore.map(regionCodes, function (regionCode) {
            return exports.getRegion(regionCode);
        });

        // 遍历分区列表
        underscore.each(regionList, function (sector) {
            var provinces = sector.provinces;
            // 分区的有效性依赖于分区下是否存在有效的地域
            // 如果存在有效的地域，则该分区标识为有效
            var sectorStatus = false;

            // 遍历分区下的省份，并将省份的地域代码标识转换为对应的地域信息
            sector.provinces = underscore.map(provinces, function (province) {
                var status = false;
                var disabled = true;
                var subRegions = [];
                underscore.each(regions, function (region) {
                    if (region.code === province) {
                        // 当输入的地域标识与省份标识一致
                        // 将省份和分区的有效性都记为有效
                        // 并且获取省份下所有的子级地域的信息
                        status = sectorStatus = true;
                        disabled = false;
                        subRegions = exports.getSubRegions(province);
                    } else if (region.parent === province) {
                        // 当输入的地域标识的父级地域与省份标识一致时
                        // 将省份和分区的有效性都记为有效
                        // 并且将其纳入到父级地域的子级地域中
                        status = sectorStatus = true;
                        subRegions.push(region);
                    }
                });

                var region = exports.getRegion(province);
                region = $.extend(region, {
                    status: status,
                    disabled: disabled,
                    cities: subRegions
                });
                return region;
            });

            sector.status = sectorStatus;
        });

        return regionList;
    };
});
