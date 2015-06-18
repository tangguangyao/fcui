/**
 * @file 地域分区的初始化定义
 * @author XingDa(xingda@baidu.com)
 */

define(function (require) {
    var REGION_NAME_TO_CODE = require('./regionNameToCodeMap');

    return [
        {
            sectorName: '华北地区',
            provinces: [
                REGION_NAME_TO_CODE.BEIJING,
                REGION_NAME_TO_CODE.TIANJIN,
                REGION_NAME_TO_CODE.HEBEI,
                REGION_NAME_TO_CODE.NEIMENGGU,
                REGION_NAME_TO_CODE.SHANXI
            ]
        },
        {
            sectorName: '东北地区',
            provinces: [
                REGION_NAME_TO_CODE.HEILONGJIANG,
                REGION_NAME_TO_CODE.JILIN,
                REGION_NAME_TO_CODE.LIAONING
            ]
        },
        {
            sectorName: '华东地区',
            provinces: [
                REGION_NAME_TO_CODE.SHANGHAI,
                REGION_NAME_TO_CODE.FUJIAN,
                REGION_NAME_TO_CODE.ANHUI,
                REGION_NAME_TO_CODE.JIANGSU,
                REGION_NAME_TO_CODE.JIANGXI,
                REGION_NAME_TO_CODE.SHANDONG,
                REGION_NAME_TO_CODE.ZHEJIANG
            ]
        },
        {
            sectorName: '华中地区',
            provinces: [
                REGION_NAME_TO_CODE.HENAN,
                REGION_NAME_TO_CODE.HUBEI,
                REGION_NAME_TO_CODE.HUNAN
            ]
        },
        {
            sectorName: '华南地区',
            provinces: [
                REGION_NAME_TO_CODE.GUANGDONG,
                REGION_NAME_TO_CODE.HAINAN,
                REGION_NAME_TO_CODE.GUANGXI
            ]
        },
        {
            sectorName: '西南地区',
            provinces: [
                REGION_NAME_TO_CODE.GUIZHOU,
                REGION_NAME_TO_CODE.SICHUAN,
                REGION_NAME_TO_CODE.XIZANG,
                REGION_NAME_TO_CODE.YUNNAN,
                REGION_NAME_TO_CODE.CHONGQING
            ]
        },
        {
            sectorName: '西北地区',
            provinces: [
                REGION_NAME_TO_CODE.GANSU,
                REGION_NAME_TO_CODE.NINGXIA,
                REGION_NAME_TO_CODE.QINGHAI,
                REGION_NAME_TO_CODE.SHANXI_1,
                REGION_NAME_TO_CODE.XINJIANG
            ]
        },
        {
            sectorName: '其他地区',
            provinces: [
                REGION_NAME_TO_CODE.HONGKONG,
                REGION_NAME_TO_CODE.MACAU,
                REGION_NAME_TO_CODE.TAIWAN
            ]
        },
        {
            sectorName: '国外',
            provinces: [
                REGION_NAME_TO_CODE.JAPAN,
                REGION_NAME_TO_CODE.OTHER_COUNTRY
            ]
        }
    ];
});