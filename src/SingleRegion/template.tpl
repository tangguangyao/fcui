<!-- target: library-ui-single-region -->
<div class="${className.container}">
    <!-- for: ${list} as ${item} -->
    <!-- if: ${item.status} -->
    <div class="${className.area}">
        <!-- if: ${item.sectorName} == '华北地区' -->
        <span class="${className.itemChina}">中国</span>
        <span>华北地区</span>
        <!-- elif: ${item.sectorName} == '国外' --> 
        <span class="${className.itemForeign}">国外</span>      
        <!-- else -->
        <span>${item.sectorName}</span>
        <!-- /if -->
        <div class="${className.sectorItem}">
        <!-- for: ${item.provinces} as ${province} -->
        <!-- if: ${province.status} -->
        <div class="${className.provinceItem}">
            <label
                data-item-rank="province"
                data-item-type="region"
                data-item-value="${province.code}" 
                data-item-disabled="${province.disabled}">
                <input type="radio" checked="" name="region" value="${province.name}">
                ${province.name}
            </label>
            <!-- if: ${province.cities} && ${province.cities.length} -->
            <div class="${className.subContainer} status-hidden"
                 data-item-parent="${province.code}">
                <table>
                    <!-- for: ${province.cities} as ${cities}, ${index} -->
                    <!-- if: ${index}%2 == 0 -->
                    <tr>
                        <td>
                            <label
                                data-item-type="region"
                                data-item-value="${cities.code}">
                                <input type="radio" checked="" 
                                    name="region" value="{province.name}">
                                ${cities.name}
                            </label>
                        </td>
                    <!-- else -->
                        <td>
                            <label class="${className.subLast}"
                                data-item-type="region"
                                data-item-value="${cities.code}">
                                <input type="radio" checked="" 
                                    name="region" value="{province.name}">
                                ${cities.name}
                            </label>
                        </td>
                    </tr>
                    <!-- /if -->
                    <!-- /for -->
                </table>
            </div>
            <!-- /if -->
        </div>
        <!-- /if -->
        <!-- /for -->
        </div>
    </div>
    <!-- /if -->
    <!-- /for -->
</div>
