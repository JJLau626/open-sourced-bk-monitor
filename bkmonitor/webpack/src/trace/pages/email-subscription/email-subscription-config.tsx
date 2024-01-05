/* eslint-disable codecc/comment-ratio */
/*
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
 */
import { defineComponent, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { deepClone } from '@common/utils';
import {
  Button,
  Dialog,
  Dropdown,
  Input,
  Loading,
  Message,
  Popover,
  Radio,
  Sideslider,
  Switcher,
  Table,
  TagInput
} from 'bkui-vue';
import { Column } from 'bkui-vue/lib/table/props';
import dayjs from 'dayjs';

import {
  cloneReport,
  createOrUpdateReport,
  deleteReport,
  getReport,
  getReportList,
  getSendRecords,
  sendReport
} from '../../../monitor-api/modules/new_report';

import CreateSubscriptionForm from './components/create-subscription-form';
import SubscriptionDetail from './components/subscription-detail';
import { ChannelName, Scenario, SendMode, SendStatus } from './mapping';
import { getDefaultReportData, TestSendingTarget } from './types';

import './email-subscription-config.scss';

type TooltipsToggleMapping = {
  [key: number]: boolean;
};

export default defineComponent({
  name: 'EmailSubscriptionConfig',
  setup() {
    const { t } = useI18n();
    const router = useRouter();
    const route = useRoute();
    const queryData = reactive({
      create_type: 'manager',
      query_type: 'all',
      search_key: '',
      page: 1,
      page_size: 20,
      order: '',
      conditions: []
    });
    // 控制 订阅列表 中多个 tooltips 的显隐
    const toggleMap = reactive<TooltipsToggleMapping>({});
    // 显示 发送记录 的 dialog
    const isShowSendRecord = ref(false);
    const table = reactive({
      data: [],
      columns: {
        fields: [
          {
            label: `${t('订阅名称')}`,
            field: 'name',
            render: ({ data }) => {
              return (
                <Button
                  theme='primary'
                  text
                  onClick={() => {
                    subscriptionDetail.value = data;
                    isShowSubscriptionDetailSideslider.value = true;
                  }}
                >
                  {t(`${data.name}`)}
                </Button>
              );
            }
          },
          {
            label: `${t('通知渠道')}`,
            field: 'channels',
            render: ({ data }) => {
              return (
                <div
                  class={{
                    'gray-text': queryData.query_type === 'invalid' ? false : data.is_invalid
                  }}
                >
                  {data.channels.map(item => t(ChannelName[item.channel_name])).toString()}
                </div>
              );
            }
          },
          {
            label: `${t('订阅场景')}`,
            field: 'scenario',
            render: ({ data }) => {
              return (
                <div
                  class={{
                    'gray-text': queryData.query_type === 'invalid' ? false : data.is_invalid
                  }}
                >
                  {t(Scenario[data.scenario])}
                </div>
              );
            }
          },
          {
            label: `${t('发送模式')}`,
            field: 'send_mode',
            render: ({ data }) => {
              return (
                <div
                  class={{
                    'gray-text': queryData.query_type === 'invalid' ? false : data.is_invalid
                  }}
                >
                  {t(SendMode[data.send_mode])}
                </div>
              );
            },
            filter: {
              list: [
                {
                  text: t('周期发送'),
                  value: 'periodic'
                },
                {
                  text: t('仅发一次'),
                  value: 'one_time'
                }
              ],
              filterFn: () => true
            }
          },
          {
            label: `${t('发送时间')}`,
            field: 'send_time',
            render: ({ data }) => {
              return (
                <div
                  class={{
                    'gray-text': queryData.query_type === 'invalid' ? false : data.is_invalid
                  }}
                >
                  {getSendFrequencyText(data)}
                </div>
              );
            }
          },
          {
            label: `${t('最近一次发送时间')}`,
            field: 'last_send_time',
            sort: {
              value: null
            },
            render: ({ data }) => {
              return (
                <div
                  class={{
                    'gray-text': queryData.query_type === 'invalid' ? false : data.is_invalid
                  }}
                >
                  {data.last_send_time || t('未发送')}
                </div>
              );
            }
          },
          {
            label: `${t('发送状态')}`,
            field: 'send_status',
            render: ({ data }) => {
              return data.send_status !== 'no_status' ? (
                <div
                  class={{
                    'gray-text': queryData.query_type === 'invalid' ? false : data.is_invalid
                  }}
                >
                  <i
                    class={['icon-circle', data.send_status]}
                    style={{ marginRight: '10px' }}
                  ></i>
                  {t(SendStatus[data.send_status])}
                </div>
              ) : (
                <div
                  class={{
                    'gray-text': queryData.query_type === 'invalid' ? false : data.is_invalid
                  }}
                >
                  {t('未发送')}
                </div>
              );
            },
            filter: {
              list: [
                {
                  text: `${t('发送成功')}`,
                  value: 'success'
                },
                {
                  text: `${t('未发送')}`,
                  value: 'no_status'
                },
                // {
                //   text: `${t('发送部分失败')}`,
                //   value: 'partial_failed'
                // },
                {
                  text: `${t('发送失败')}`,
                  value: 'failed'
                }
              ],
              filterFn: () => true
            }
          },
          {
            label: `${t('创建人')}`,
            field: 'create_user',
            render: ({ data }) => {
              return (
                <div
                  class={{
                    'gray-text': queryData.query_type === 'invalid' ? false : data.is_invalid
                  }}
                >
                  {data.create_user}
                </div>
              );
            }
          },
          {
            label: `${t('启/停')}`,
            field: 'is_enabled',
            render: ({ data, index }) => {
              return (
                <div>
                  <Switcher
                    v-model={data.is_enabled}
                    theme='primary'
                    onChange={() => handleSetEnable(index)}
                  ></Switcher>
                </div>
              );
            }
          },
          {
            label: `${t('创建时间')}`,
            field: 'create_time',
            sort: {
              value: null
            }
          },
          {
            label: `${t('操作')}`,
            field: 'action',
            width: `${(window.i18n.locale as unknown as string) === 'zhCN' ? '150px' : '170px'}`,
            render: row => {
              return (
                <div>
                  <Button
                    theme='primary'
                    text
                    onClick={() => {
                      isShowSendRecord.value = true;
                      subscriptionDetail.value = row.data;
                      getSendingRecordList();
                    }}
                  >
                    {t('发送记录')}
                  </Button>

                  <Button
                    theme='primary'
                    text
                    style='margin-left: 10px;'
                    onClick={() => {
                      subscriptionDetail.value = row.data;
                      isShowEditSideslider.value = true;
                    }}
                  >
                    {t('编辑')}
                  </Button>

                  {/* 实现方式有问题，看看有没有其它的实现方式 */}
                  <Popover
                    trigger='click'
                    theme='light'
                    isShow={toggleMap[row.index] || false}
                    placement='bottom-start'
                    extCls='email-subscription-popover'
                    v-slots={{
                      content: () => (
                        <div>
                          <div
                            class='popover-item'
                            onClick={() => {
                              toggleMap[row.index] = false;
                              cloneDialog.subscription_id = row.data.id;
                              cloneDialog.isShow = true;
                              cloneDialog.name = row.data.name;
                            }}
                          >
                            {t('克隆')}
                          </div>
                          <div
                            class='popover-item'
                            onClick={() => {
                              toggleMap[row.index] = false;
                              deleteDialog.subscription_id = row.data.id;
                              deleteDialog.isShow = true;
                              deleteDialog.name = row.data.name;
                            }}
                          >
                            {t('删除')}
                          </div>
                        </div>
                      )
                    }}
                  >
                    <i
                      class='more-btn icon-monitor icon-mc-more'
                      style='margin-left: 10px;'
                      onClick={() => (toggleMap[row.index] = true)}
                    />
                  </Popover>
                </div>
              );
            }
          }
        ],
        limit: 0
      },
      isLoading: false,
      settings: {
        fields: [],
        checked: [],
        limit: 0,
        size: 'small',
        sizeList: [],
        showLineHeight: false
      }
    });
    // 根据 table 字段生成对应的字段显隐 setting
    table.settings.fields = table.columns.fields.map(item => {
      return {
        label: item.label,
        field: item.field
      };
    });
    table.settings.checked = table.columns.fields
      // 这里先不展示 创建时间 ，让用户自己手动开。
      .filter(item => !['create_time'].includes(item.field))
      .map(item => item.field);

    // 发送记录 里控制多个 tooltips 的显隐
    const toggleMapForSendRecord = reactive<TooltipsToggleMapping>({});
    const sendRecordTable = reactive({
      data: [],
      columns: {
        fields: [
          {
            label: `${t('发送时间')}`,
            field: 'send_time'
          },
          {
            label: `${t('类型')}`,
            render: ({ data }) => {
              return t(ChannelName[data.channel_name]);
            }
          },
          {
            label: `${t('接收人')}`,
            render: ({ data }) => {
              return (
                // 显示的内容量会很多，这里样式调整一下。
                <div style='white-space: normal;line-height: 16px;padding: 14px 0;'>
                  {data.send_results.map(item => item.id).toString()}
                </div>
              );
            }
          },
          {
            label: `${t('发送结果')}`,
            render: ({ data }) => {
              return (
                <div>
                  <i class={['icon-circle', data.send_status]} />
                  <span style='margin-left: 10px;'>{t(SendStatus[data.send_status])}</span>
                </div>
              );
            }
          },
          {
            label: `${t('操作')}`,
            render: ({ data, index }) => {
              return (
                <Popover
                  trigger='click'
                  isShow={toggleMapForSendRecord[index] || false}
                  theme='light'
                  placement='bottom-start'
                  extCls='email-subscription-popover'
                  disableOutsideClick
                  // zIndex={99999 + index}
                  v-slots={{
                    content: () => {
                      let headerText = '';
                      let headerConfirmText = '';
                      if (['success'].includes(data.send_status)) {
                        const headerTextMap = {
                          user: '已成功发送 {0} 个内部用户',
                          email: '已成功发送 {0} 个外部邮件',
                          wxbot: '已成功发送 {0} 个企业微信群'
                        };
                        headerText = headerTextMap[data.channel_name];
                        const headerConfirmTextMap = {
                          user: '确定重新发送给以下用户',
                          email: '确定重新发送给以下邮件',
                          wxbot: '确定重新发送给以下企业微信群'
                        };
                        headerConfirmText = headerConfirmTextMap[data.channel_name];
                      } else if (['partial_failed', 'failed'].includes(data.send_status)) {
                        const headerTextMap = {
                          user: '已成功发送 {0} 个，失败 {1} 个内部用户',
                          email: '已成功发送 {0} 个，失败 {1} 个外部邮件',
                          wxbot: '已成功发送 {0} 个，失败 {1} 个企业微信群'
                        };
                        headerText = headerTextMap[data.channel_name];
                        const headerConfirmTextMap = {
                          user: '确定重新发送给以下失败用户',
                          email: '确定重新发送给以下失败邮件',
                          wxbot: '确定重新发送给以下失败企业微信群'
                        };
                        headerConfirmText = headerConfirmTextMap[data.channel_name];
                      }

                      return (
                        <div class='resend-popover-container'>
                          <div class='success-header-text'>
                            {/* 根据 data.channel 如果为 success 就选这些文本
                            1. 已成功发送 {0} 个内部用户
                            2. 已成功发送 {0} 个外部邮件
                            3. 已成功发送 {0} 个企业微信群

                            如果为 partial_failed, failed 就选这些文本
                            1. 已成功发送 {0} 个，失败 {1} 个企业微信群
                            2. 已成功发送 {0} 个，失败 {1} 个外部邮件
                            3. 已成功发送 {0} 个，失败 {1} 个内部用户
                          */}
                            <i18n-t keypath={headerText}>
                              <span class='success-text'>{data.send_results.filter(item => item.result).length}</span>
                              {['partial_failed', 'failed'].includes(data.send_status) && (
                                <span class='fail-text'>{data.send_results.filter(item => !item.result).length}</span>
                              )}
                            </i18n-t>
                          </div>

                          <div class='header-confirm-text'>
                            {/* 根据 data.channel 如果为 success 就选这些文本
                              1. 确定重新发送给以下用户
                              2. 确定重新发送给以下邮件
                              3. 确定重新发送给以下企微群

                              如果为 partial_failed, success 就选这些文本
                              1. 确定重新发送给以下失败企微群
                              2. 确定重新发送给以下失败邮件
                              3. 确定重新发送给以下失败用户
                            */}
                            {t(headerConfirmText)}
                          </div>

                          <div style='margin-top: 10px;'>
                            <TagInput
                              v-model={data.selectedTag}
                              list={data.tempSendResult}
                              placeholder={t('请选择')}
                              has-delete-icon
                              trigger='focus'
                              display-key='id'
                              save-key='id'
                              search-key={['id']}
                              content-width={238}
                            ></TagInput>
                          </div>

                          <div class='footer-operation'>
                            <Button
                              theme='primary'
                              style='min-width: 64px;'
                              loading={isResending.value}
                              disabled={!data.selectedTag.length}
                              onClick={() => {
                                handleResendSubscription(data, index);
                              }}
                            >
                              {t('确定')}
                            </Button>

                            <Button
                              style='min-width: 64px;margin-left: 8px;'
                              onClick={() => {
                                toggleMapForSendRecord[index] = false;
                              }}
                            >
                              {t('取消')}
                            </Button>
                          </div>
                        </div>
                      );
                    }
                  }}
                >
                  <Button
                    text
                    theme='primary'
                    onClick={() => {
                      toggleMapForSendRecord[index] = true;
                      // 每次重新发送都会重置一次 tag 列表。不知道是否实用。
                      sendRecordTable.data.forEach(item => {
                        // eslint-disable-next-line no-param-reassign
                        item.tempSendResult = deepClone(item.send_results);
                        // 这里将展示 TagInput 用的保存变量。
                        // eslint-disable-next-line no-param-reassign
                        item.selectedTag = [];
                        // 需要根据发送结果去对 selectedTag 里的内容进行预先填充。
                        item.send_results.forEach(subItem => {
                          if (item.send_status === 'partial_failed' && !subItem.result) {
                            item.selectedTag.push(subItem.id);
                          }
                          if (item.send_status === 'failed') {
                            item.selectedTag.push(subItem.id);
                          }
                        });
                      });
                    }}
                  >
                    {t('重新发送')}
                  </Button>
                </Popover>
              );
            }
          }
        ]
      },
      isLoading: false
    });

    // 显隐 订阅详情 抽屉组件
    const isShowSubscriptionDetailSideslider = ref(false);
    // 显隐 编辑订阅 抽屉组件
    const isShowEditSideslider = ref(false);

    // 显隐 测试发送 的 dropdownMenu 组件
    const isShowDropdownMenu = ref(false);
    // 测试发送 是否loading
    const isSending = ref(false);
    // 子组件 里面是大表单
    const refOfCreateSubscriptionForm = ref();
    // 是否显示 测试发送 完成后的弹窗
    const isShowTestSendResult = ref(false);
    // 订阅详情 数据，这个数据是来源于 订阅列表 里，该列表是带有详情的，不需要再请求即可获得。
    const subscriptionDetail = ref(getDefaultReportData());
    const cloneDialog = reactive({
      isShow: false,
      loading: false,
      subscription_id: 0,
      name: ''
    });

    const deleteDialog = reactive({
      isShow: false,
      loading: false,
      subscription_id: 0,
      name: ''
    });

    // 发送记录 里 重新发送 的 loading
    const isResending = ref(false);

    // 是否 发送给自己 的弹窗确认
    const sendMyselfDialog = reactive({
      isShow: false
    });

    function handleGoToCreateConfigPage() {
      router.push({
        name: 'create-subscription'
      });
    }

    function handleInputKeydown() {
      resetAndGetSubscriptionList();
    }

    function handleClone() {
      cloneDialog.loading = true;
      cloneReport({
        report_id: cloneDialog.subscription_id
      })
        .then(() => {
          fetchSubscriptionList();
        })
        .finally(() => {
          cloneDialog.loading = false;
          cloneDialog.isShow = false;
        });
    }

    function handleDeleteRow() {
      deleteDialog.loading = true;
      deleteReport({
        report_id: deleteDialog.subscription_id
      })
        .then(() => {
          fetchSubscriptionList();
        })
        .finally(() => {
          deleteDialog.loading = false;
          deleteDialog.isShow = false;
        });
    }

    async function testSending(to: TestSendingTarget) {
      // 先校验一次子组件的表单
      const tempFormData = await refOfCreateSubscriptionForm.value.validateAllForms();
      if (!tempFormData) return;
      const clonedFormData = deepClone(tempFormData);
      if (to === 'self') {
        const selfChannels = [
          {
            is_enabled: true,
            subscribers: [
              {
                id: window.user_name || window.username,
                type: 'user',
                is_enabled: true
              }
            ],
            channel_name: 'user'
          }
        ];
        clonedFormData.channels = selfChannels;
      }
      // 删除无用 key
      /* eslint-disable */
      const {
        create_time,
        create_user,
        is_deleted,
        is_manager_created,
        last_send_time,
        send_mode,
        send_round,
        send_status,
        update_time,
        update_user,
        id,
        is_invalid,
        ...formData
      } = clonedFormData;
      /* eslint-enable */
      isSending.value = true;
      await sendReport(formData)
        .then(() => {
          isShowTestSendResult.value = true;
        })
        .finally(() => {
          isSending.value = false;
          isShowDropdownMenu.value = false;
        });
    }

    function resetAndGetSubscriptionList() {
      queryData.page = 1;
      queryData.page_size = 20;
      fetchSubscriptionList();
    }

    function fetchSubscriptionList() {
      table.isLoading = true;
      getReportList(queryData)
        .then(response => {
          table.data = response;
        })
        .finally(() => {
          table.isLoading = false;
        });
    }

    function handleSetEnable(index) {
      const data = table.data[index];
      createOrUpdateReport(data)
        .then(() => {})
        .catch(() => {
          // eslint-disable-next-line no-param-reassign
          data.is_enabled = !data.is_enabled;
        });
    }

    function getSendingRecordList() {
      sendRecordTable.isLoading = true;
      getSendRecords({
        report_id: subscriptionDetail.value.id
      })
        .then(response => {
          sendRecordTable.data = response;
        })
        .finally(() => {
          sendRecordTable.isLoading = false;
        });
    }

    // TODO：这个该怎么封装好？
    function getSendFrequencyText(data) {
      const hourTextMap = {
        0.5: t('每个小时整点,半点发送'),
        1: t('每个小时整点发送'),
        2: t('从0点开始,每隔2小时整点发送'),
        6: t('从0点开始,每隔6小时整点发送'),
        12: t('每天9:00,21:00发送')
      };
      const weekMap = [t('周一'), t('周二'), t('周三'), t('周四'), t('周五'), t('周六'), t('周日')];
      let str = '';
      if (!data?.frequency?.type) return '';
      switch (data.frequency.type) {
        case 3: {
          const weekStrArr = data.frequency.week_list.map(item => weekMap[item - 1]);
          const weekStr = weekStrArr.join(', ');
          str = `${weekStr} ${data.frequency.run_time}`;
          break;
        }
        case 4: {
          const dayArr = data.frequency.day_list.map(item => `${item}号`);
          const dayStr = dayArr.join(', ');
          str = `${dayStr} ${data.frequency.run_time}`;
          break;
        }
        case 5: {
          str = hourTextMap[data.frequency.hour];
          break;
        }
        default:
          str = data.frequency.run_time;
          break;
      }
      return str;
    }

    function formatTimeRange(s, e) {
      if (!s) return '';
      const startTime = dayjs.unix(s).format('YYYY-MM-DD HH:mm:ss');
      const endTime = dayjs.unix(e).format('YYYY-MM-DD HH:mm:ss');
      return `${startTime} ~ ${endTime}`;
    }

    function handleResendSubscription(data, index) {
      isResending.value = true;
      const channels = [
        {
          is_enabled: true,
          channel_name: data.channel_name,
          subscribers: data.tempSendResult
            .filter(item => {
              return data.selectedTag.includes(item.id);
            })
            .map(item => {
              // eslint-disable-next-line no-param-reassign
              delete item.result;
              // eslint-disable-next-line no-param-reassign
              item.is_enabled = true;
              return item;
            })
        }
      ];
      sendReport({
        report_id: data.report_id,
        channels
      })
        .then(() => {
          Message({
            theme: 'success',
            message: t('发送成功')
          });
        })
        .finally(() => {
          isResending.value = false;
          toggleMapForSendRecord[index] = false;
        });
    }

    async function handleSendMyself() {
      isSending.value = true;
      const selfChannels = [
        {
          is_enabled: true,
          subscribers: [
            {
              id: window.user_name || window.username,
              type: 'user',
              is_enabled: true
            }
          ],
          channel_name: 'user'
        }
      ];
      const clonedFormData = deepClone(subscriptionDetail.value);
      clonedFormData.channels = selfChannels;
      // 去掉无用 key ，这些都来自于 后端返回 ，前端用不着，但后端不让上传的
      /* eslint-disable */
      const {
        create_time,
        create_user,
        is_deleted,
        is_manager_created,
        last_send_time,
        send_mode,
        send_round,
        send_status,
        update_time,
        update_user,
        id,
        is_invalid,
        ...formData
      } = clonedFormData;
      /* eslint-enable */
      formData.report_id = id;
      await sendReport(formData)
        .then(() => {
          isShowTestSendResult.value = true;
        })
        .finally(() => {
          isSending.value = false;
          sendMyselfDialog.isShow = false;
        });
    }

    const isFetchReport = ref(false);
    /** 点击已存在的相同索引集对应的 订阅名称 时，切换 编辑抽屉的 订阅详情 内容 */
    function handleReportDetailChange(reportId) {
      isFetchReport.value = true;
      getReport({
        report_id: reportId
      })
        .then(response => {
          subscriptionDetail.value = response;
          nextTick(() => {
            refOfCreateSubscriptionForm.value.setFormData();
          });
        })
        .finally(() => {
          isFetchReport.value = false;
        });
    }

    const isShowCreateReportFormComponent = ref(true);
    function checkNeedShowEditSlider() {
      const { reportId, isShowEditSlider } = route.query;
      if (isShowEditSlider !== 'true') return;

      isShowCreateReportFormComponent.value = false;
      isShowEditSideslider.value = true;
      isFetchReport.value = true;
      getReport({
        report_id: reportId
      })
        .then(response => {
          subscriptionDetail.value = response;
          nextTick(() => {
            refOfCreateSubscriptionForm.value.setFormData();
          });
        })
        .catch(() => {
          isShowEditSideslider.value = false;
        })
        .finally(() => {
          isFetchReport.value = false;
          isShowCreateReportFormComponent.value = true;
        });
    }

    onMounted(() => {
      checkNeedShowEditSlider();
      fetchSubscriptionList();
    });
    return {
      t,
      queryData,
      handleInputKeydown,
      handleGoToCreateConfigPage,
      table,
      isShowSendRecord,
      sendRecordTable,
      isShowSubscriptionDetailSideslider,
      isShowEditSideslider,
      testSending,
      refOfCreateSubscriptionForm,
      resetAndGetSubscriptionList,
      fetchSubscriptionList,
      subscriptionDetail,
      cloneDialog,
      handleClone,
      deleteDialog,
      handleDeleteRow,
      isSending,
      getSendingRecordList,
      getSendFrequencyText,
      formatTimeRange,
      sendMyselfDialog,
      handleSendMyself,
      toggleMapForSendRecord,
      isShowTestSendResult,
      isShowDropdownMenu,
      handleReportDetailChange,
      isFetchReport,
      isShowCreateReportFormComponent
    };
  },
  render() {
    const headerTmpl = () => {
      return (
        <div class='header-container'>
          <div class='left-container'>
            <Button
              theme='primary'
              onClick={this.handleGoToCreateConfigPage}
            >
              <i class='icon-monitor icon-mc-add'></i>
              <span>{this.t('新建')}</span>
            </Button>
            <Radio.Group
              v-model={this.queryData.create_type}
              style='margin-left: 16px;'
              onChange={() => {
                this.resetAndGetSubscriptionList();
              }}
            >
              <Radio.Button label='manager'>{this.t('管理员创建的')}</Radio.Button>
              <Radio.Button label='user'>{this.t('用户订阅的')}</Radio.Button>
            </Radio.Group>
          </div>
          <div class='right-container'>
            <Radio.Group
              v-model={this.queryData.query_type}
              type='capsule'
              onChange={() => {
                this.resetAndGetSubscriptionList();
              }}
            >
              <Radio.Button label='all'>{this.t('全部')}</Radio.Button>
              <Radio.Button label='available'>
                <i
                  class='icon-circle success'
                  style='margin-right: 4px;'
                />
                <span>{this.t('生效中')}</span>
              </Radio.Button>
              <Radio.Button label='invalid'>
                <i
                  class='icon-circle gray'
                  style='margin-right: 4px;'
                />
                <span>{this.t('已失效')}</span>
              </Radio.Button>
              {/* 暂时不需要 */}
              {/* <Radio.Button label='cancelled'>
                <i
                  class='icon-circle cancelled'
                  style='margin-right: 4px;'
                />
                <span>{this.t('已取消')}</span>
              </Radio.Button> */}
            </Radio.Group>
            <Input
              v-model={this.queryData.search_key}
              clearable
              class='search-input'
              onEnter={this.handleInputKeydown}
              onClear={this.handleInputKeydown}
              onBlur={this.handleInputKeydown}
              placeholder={this.t('请输入搜索条件')}
              v-slots={{
                suffix: () => (
                  <div class='suffix-icon'>
                    <i class='icon-monitor icon-mc-search'></i>
                  </div>
                )
              }}
            />
          </div>
        </div>
      );
    };
    return (
      <div class='email-subscription-config-container'>
        {/* 头部搜索 部分 */}
        {headerTmpl()}
        <Loading loading={this.table.isLoading}>
          <Table
            data={this.table.data}
            columns={this.table.columns.fields as Column[]}
            border={['outer']}
            settings={this.table.settings}
            style='margin-top: 16px;background-color: white;'
            pagination={{
              current: this.queryData.page,
              limit: this.queryData.page_size,
              count: this.table.data.length,
              onChange: pageNum => {
                this.queryData.page = pageNum;
              },
              onLimitChange: limit => {
                this.queryData.page_size = limit;
              }
            }}
            onColumnFilter={({ checked, column }) => {
              let currentIndex = -1;
              const result = this.queryData.conditions.filter((item, index) => {
                if (item.key === column.field) {
                  currentIndex = index;
                  return item;
                }
                return false;
              });
              if (result.length) {
                if (checked.length) {
                  this.queryData.conditions[currentIndex].value = checked;
                } else {
                  this.queryData.conditions.splice(currentIndex, 1);
                }
              } else {
                if (checked.length) {
                  this.queryData.conditions.push({
                    key: column.field,
                    value: checked
                  });
                }
              }
              this.fetchSubscriptionList();
            }}
            onColumnSort={({ column, type }) => {
              if (type !== 'null') {
                this.queryData.order = `${type === 'asc' ? '' : '-'}${column.field}`;
              } else {
                this.queryData.order = '';
              }
              this.fetchSubscriptionList();
            }}
          ></Table>
        </Loading>
        <Dialog
          is-show={this.isShowSendRecord}
          title={this.t('发送记录')}
          dialog-type='show'
          width='960'
          onClosed={() => {
            this.isShowSendRecord = false;
            Object.keys(this.toggleMapForSendRecord).forEach(key => {
              this.toggleMapForSendRecord[key] = false;
            });
          }}
        >
          <div>
            <div class='dialog-header-info-container'>
              <div class='label-container'>
                <div class='label'>{this.t('发送频率')}:</div>
                <div class='value'>{this.getSendFrequencyText(this.subscriptionDetail)}</div>
              </div>
              <div class='label-container'>
                <div
                  class='label'
                  style='margin-left: 55px;'
                >
                  {this.t('有效时间范围')}:
                </div>
                <div class='value'>
                  {this.formatTimeRange(this.subscriptionDetail.start_time, this.subscriptionDetail.end_time)}
                </div>
              </div>
            </div>

            <Loading loading={this.sendRecordTable.isLoading}>
              <Table
                data={this.sendRecordTable.data}
                columns={this.sendRecordTable.columns.fields as Column[]}
                style='margin-top: 16px;'
              />
            </Loading>
          </div>
        </Dialog>

        <Sideslider
          v-model={[this.isShowSubscriptionDetailSideslider, 'isShow']}
          // 根据显示内容要动态调整。
          width={640}
          quick-close={false}
          transfer
          v-slots={{
            header: () => {
              return (
                <div class='slider-header-container'>
                  <div class='title-container'>
                    <span class='title'>{this.t('订阅详情')}</span>
                    <span class='sub-title'>-&nbsp;{this.subscriptionDetail.name}</span>
                  </div>

                  <div class='operation-container'>
                    <Button
                      style='margin-right: 8px;'
                      onClick={() => {
                        this.sendMyselfDialog.isShow = true;
                      }}
                    >
                      {this.t('发送给自己')}
                    </Button>
                    <Button
                      outline
                      theme='primary'
                      style='margin-right: 8px;'
                      onClick={() => {
                        this.isShowSubscriptionDetailSideslider = false;
                        this.isShowEditSideslider = true;
                      }}
                    >
                      {this.t('编辑')}
                    </Button>

                    <Popover
                      placement='bottom-end'
                      v-slots={{
                        content: () => {
                          return (
                            <div>
                              <div>{`${this.t('更新人')}: ${this.subscriptionDetail.update_user}`}</div>
                              <div>{`${this.t('更新时间')}: ${this.subscriptionDetail.update_time}`}</div>
                              <div>{`${this.t('创建人')}: ${this.subscriptionDetail.create_user}`}</div>
                              <div>{`${this.t('创建时间')}: ${this.subscriptionDetail.create_time}`}</div>
                            </div>
                          );
                        }
                      }}
                    >
                      <Button style='margin-right: 24px;'>
                        <i class='icon-monitor icon-lishi'></i>
                      </Button>
                    </Popover>
                  </div>
                </div>
              );
            },
            default: () => {
              return (
                <div>
                  <SubscriptionDetail
                    detailInfo={this.subscriptionDetail}
                    style='padding: 20px 40px;'
                  ></SubscriptionDetail>
                </div>
              );
            }
          }}
        ></Sideslider>

        <Sideslider
          v-model={[this.isShowEditSideslider, 'isShow']}
          title={'编辑'}
          width={960}
          quick-close={false}
          ext-cls='edit-subscription-sideslider-container'
          transfer
        >
          <Loading
            class='loading-edit-slider'
            loading={this.isFetchReport}
          >
            <div>
              <div class='create-subscription-container'>
                {this.isShowCreateReportFormComponent && (
                  <CreateSubscriptionForm
                    ref='refOfCreateSubscriptionForm'
                    mode='quick'
                    detailInfo={this.subscriptionDetail}
                    onSelectExistedReport={this.handleReportDetailChange}
                  ></CreateSubscriptionForm>
                )}
              </div>

              <div class='footer-bar'>
                <Button
                  theme='primary'
                  style={{ width: '88px', marginRight: '8px' }}
                  onClick={() => {
                    this.refOfCreateSubscriptionForm.validateAllForms().then(response => {
                      createOrUpdateReport(response).then(() => {
                        Message({
                          theme: 'success',
                          message: this.t('保存成功')
                        });
                        this.fetchSubscriptionList();
                        this.isShowEditSideslider = false;
                      });
                    });
                  }}
                >
                  {this.t('保存')}
                </Button>
                <Dropdown
                  isShow={this.isShowDropdownMenu}
                  trigger='manual'
                  placement='top-start'
                  v-slots={{
                    content: () => {
                      return (
                        <Dropdown.DropdownMenu>
                          <Dropdown.DropdownItem onClick={() => this.testSending('self')}>
                            {this.t('给自己')}
                          </Dropdown.DropdownItem>
                          <Dropdown.DropdownItem onClick={() => this.testSending('all')}>
                            {this.t('给全员')}
                          </Dropdown.DropdownItem>
                        </Dropdown.DropdownMenu>
                      );
                    }
                  }}
                >
                  <Button
                    theme='primary'
                    outline
                    loading={this.isSending}
                    style={{ width: '88px', marginRight: '8px' }}
                    onClick={() => {
                      this.isShowDropdownMenu = !this.isShowDropdownMenu;
                    }}
                  >
                    {this.t('测试发送')}
                  </Button>
                </Dropdown>
                <Button
                  style={{ width: '88px' }}
                  onClick={() => {
                    this.isShowEditSideslider = false;
                  }}
                >
                  {this.t('取消')}
                </Button>
              </div>
            </div>
          </Loading>
        </Sideslider>

        {/* 克隆确认 */}
        <Dialog
          isShow={this.cloneDialog.isShow}
          isLoading={this.cloneDialog.loading}
          title={this.t('提示')}
          confirmText={this.t('确认')}
          cancelText={this.t('取消')}
          onClosed={() => {
            this.cloneDialog.isShow = false;
          }}
          onConfirm={this.handleClone}
        >
          <div>{this.t('是否克隆 {0} ?', [this.cloneDialog.name])}</div>
        </Dialog>

        {/* 删除确认 */}
        <Dialog
          isShow={this.deleteDialog.isShow}
          isLoading={this.deleteDialog.loading}
          title={this.t('提示')}
          confirmText={this.t('确认')}
          cancelText={this.t('取消')}
          onClosed={() => {
            this.deleteDialog.isShow = false;
          }}
          onConfirm={this.handleDeleteRow}
        >
          <div>{this.t('是否删除 {0} ?', [this.deleteDialog.name])}</div>
        </Dialog>

        <Dialog
          isShow={this.sendMyselfDialog.isShow}
          isLoading={this.isSending}
          title={this.t('提示')}
          confirmText={this.t('确认')}
          cancelText={this.t('取消')}
          onClosed={() => {
            this.sendMyselfDialog.isShow = false;
          }}
          onConfirm={this.handleSendMyself}
        >
          <div>{this.t('是否发送给自己?')}</div>
        </Dialog>

        <Dialog
          isShow={this.isShowTestSendResult}
          dialog-type='show'
          ext-cls='test-send-result-dialog'
          onClosed={() => {
            this.isShowTestSendResult = false;
          }}
          v-slots={{
            default: () => {
              return (
                <div
                  style={{
                    marginLeft: '30px'
                  }}
                >
                  {this.t('邮件任务已生成，请一分钟后到邮箱查看')}
                </div>
              );
            },
            header: () => {
              return (
                <div>
                  <i
                    class='icon-monitor icon-mc-check-fill'
                    style='color: #2dca56;'
                  />
                  <span
                    style={{
                      marginLeft: '10px',
                      fontWeight: 'bold'
                    }}
                  >
                    {this.t('发送测试邮件成功')}
                  </span>
                </div>
              );
            }
          }}
        ></Dialog>
      </div>
    );
  }
});