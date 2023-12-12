"""
Tencent is pleased to support the open source community by making BK-LOG 蓝鲸日志平台 available.
Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
BK-LOG 蓝鲸日志平台 is licensed under the MIT License.
License for BK-LOG 蓝鲸日志平台:
--------------------------------------------------------------------
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF  OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
We undertake not to change the open source license (MIT license) applicable to the current version of
the project delivered to anyone in the future.
"""

from rest_framework import serializers

from apps.api import MonitorApi
from apps.generic import APIViewSet
from apps.iam import ActionEnum, ResourceEnum
from apps.iam.handlers.drf import InstanceActionPermission
from apps.log_clustering.serializers import (
    CreateOrUpdateReportSerializer,
    GetExistReportsSerlaizer,
)
from apps.utils.drf import detail_route
from bklog.apps.log_clustering.serializers import TestSendReportSerializer


class ReportViewSet(APIViewSet):
    lookup_field = "index_set_id"
    serializer_class = serializers.Serializer

    def get_permissions(self):
        return [InstanceActionPermission([ActionEnum.SEARCH_LOG], ResourceEnum.INDICES)]

    @detail_route(methods=["GET"])
    def get_exist_reports(self, request):
        """
        @api {post} /report/get_exist_reports/ 日志聚类-已存在订阅列表
        @apiName get_exist_reports
        @apiGroup log_clustering
        """
        params = self.params_valid(GetExistReportsSerlaizer)
        return MonitorApi.create_or_update_report(params)

    @detail_route(methods=["POST"], url_path="create_or_update_report")
    def create_or_update_report(self, request):
        """
        @api {post} /report/create_or_update_report/ 日志聚类-创建或更新订阅报表
        @apiName create_or_update_report
        @apiGroup log_clustering
        """
        params = self.params_valid(CreateOrUpdateReportSerializer)
        return MonitorApi.create_or_update_report(params)

    @detail_route(methods=["POST"], url_path="test_send_report")
    def test_send_report(self, request):
        """
        @api {post} /report/test_send_report/ 日志聚类-测试发送订阅报表
        @apiName test_send_report
        @apiGroup log_clustering
        """
        params = self.params_valid(TestSendReportSerializer)
        return MonitorApi.send_report(params)