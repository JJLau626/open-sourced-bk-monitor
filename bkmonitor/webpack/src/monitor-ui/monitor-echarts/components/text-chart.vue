<!--
* Tencent is pleased to support the open source community by making
* 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
*
* Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
*
* 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
*
* License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
*
* ---------------------------------------------------
* Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
* documentation files (the "Software"), to deal in the Software without restriction, including without limitation
* the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
* to permit persons to whom the Software is furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all copies or substantial portions of
* the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
* THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
* CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
* IN THE SOFTWARE.
-->
<template>
  <div class="text-chart">
    <template v-if="series.value">
      <div class="text-chart-value">
        {{ series.value }}
      </div>
      <div class="text-chart-unit">
        {{ series.unit }}
      </div>
    </template>
    <div
      v-else
      class="text-chart-empty"
    >--</div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { ITextSeries } from '../options/type-interface';

@Component({
  name: 'TextChart'
})
export default class TextChart extends Vue {
  @Prop({
    default() {
      return {};
    }
  })
    series: ITextSeries;
}
</script>
<style lang="scss" scoped>
.text-chart {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  height: 30px;
  padding: 0 16px;
  margin: auto;

  &-value {
    margin-right: 6px;
    font-size: 32px;
    font-weight: 500;
    line-height: 30px;
    color: #3a84ff;
  }

  &-unit {
    align-self: flex-end;
    font-size: 12px;
    line-height: 20px;
    color: #979ba5;
  }

  &-empty {
    margin-left: -16px;
    font-size: 50px;
    line-height: 30px;
    color: #dcdee5;
  }
}
</style>
