<!--
  - Tencent is pleased to support the open source community by making BK-LOG 蓝鲸日志平台 available.
  - Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
  - BK-LOG 蓝鲸日志平台 is licensed under the MIT License.
  -
  - License for BK-LOG 蓝鲸日志平台:
  - -------------------------------------------------------------------
  -
  - Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  - documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  - the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
  - and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  - The above copyright notice and this permission notice shall be included in all copies or substantial
  - portions of the Software.
  -
  - THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
  - LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  - NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  - WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  - SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
  -->

<template>
  <!-- :empty-text="$t('未查询到数据')" -->
  <bk-table
    ref="resultTable"
    :class="['king-table', { 'is-wrap': isWrap, 'is-hidden-table-header': tableLoading }]"
    :data="tableList"
    :key="tableRandomKey"
    @row-click="tableRowClick"
    @header-dragend="handleHeaderDragend"
    @sort-change="handleSortTable">
    <!-- 展开详情 -->
    <bk-table-column
      type="expand"
      width="30"
      align="center">
      <template slot-scope="{ $index }">
        <expand-view
          v-bind="$attrs"
          :data="originTableList[$index]"
          :list-data="tableList[$index]"
          :total-fields="totalFields"
          :visible-fields="visibleFields"
          :retrieve-params="retrieveParams"
          @menuClick="handleMenuClick">
        </expand-view>
      </template>
    </bk-table-column>
    <!-- 显示字段 -->
    <template v-for="(field, index) in getShowTableVisibleFields">
      <bk-table-column
        align="left"
        :sortable="field.es_doc_values"
        :column-key="field.field_name"
        :key="field.field_name"
        :min-width="field.minWidth"
        :render-header="renderHeaderAliasName"
        :index="index"
        :width="field.width"
        :class-name="`visiable-field${isWrap ? ' is-wrap' : ''}`">
        <!-- eslint-disable-next-line -->
        <template slot-scope="{ row, column, $index }">
          <keep-alive>
            <div
              :class="['str-content', { 'is-limit': !cacheExpandStr.includes($index) }]"
              :title="isWrap ? '' : tableRowDeepView(row, field.field_name, field.field_type)">
              <table-column
                :is-wrap="isWrap"
                :content="tableRowDeepView(row, field.field_name, field.field_type)"
                :field-name="field.field_name"
                :field-type="field.field_type"
                @iconClick="(type, content, isLink) => handleIconClick(type, content, field, row, isLink)"
                @computedHeight="handleOverColumn(field.field_name)" />
              <p
                v-if="!cacheExpandStr.includes($index)"
                class="show-whole-btn"
                @click.stop="handleShowWhole($index)">
                {{ $t('展开全部') }}
              </p>
              <p
                v-else-if="cacheOverFlowCol.includes(field.field_name)"
                class="hide-whole-btn"
                @click.stop="handleHideWhole($index)">
                {{ $t('收起') }}
              </p>
            </div>
          </keep-alive>
        </template>
      </bk-table-column>
    </template>
    <!-- 操作按钮 -->
    <bk-table-column
      v-if="showHandleOption"
      align="right"
      fixed="right"
      :width="getOperatorToolsWidth"
      :label="$t('操作')">
      <!-- eslint-disable-next-line -->
      <template slot-scope="{ row, column, $index }">
        <operator-tools
          :index="$index"
          :row-data="row"
          :operator-config="operatorConfig"
          :handle-click="(event) => handleClickTools(event, row, operatorConfig)" />
      </template>
    </bk-table-column>
    <!-- 初次加载骨架屏loading -->
    <bk-table-column v-if="tableLoading" slot="empty">
      <retrieve-loader
        is-loading
        :is-original-field="false"
        :visible-fields="getShowTableVisibleFields">
      </retrieve-loader>
    </bk-table-column>
    <template v-else slot="empty">
      <empty-view v-bind="$attrs" v-on="$listeners" />
    </template>
    <!-- 下拉刷新骨架屏loading -->
    <template slot="append" v-if="tableList.length && getShowTableVisibleFields.length && isPageOver">
      <retrieve-loader
        :is-page-over="isPageOver"
        :is-original-field="false"
        :visible-fields="getShowTableVisibleFields">
      </retrieve-loader>
    </template>
  </bk-table>
</template>

<script>
import resultTableMixin from '@/mixins/result-table-mixin';

export default {
  name: 'TableList',
  mixins: [resultTableMixin],
};
</script>
