from rest_framework import serializers
from drf_spectacular.utils import OpenApiResponse

class ErrorSerializer(serializers.Serializer):
    detail = serializers.CharField()
    code = serializers.CharField(required=False)

DEFAULT_ERROR_RESPONSES = {
    400: OpenApiResponse(response=ErrorSerializer, description="Bad Request / Validation error"),
    401: OpenApiResponse(response=ErrorSerializer, description="Unauthenticated"),
    403: OpenApiResponse(response=ErrorSerializer, description="Forbidden"),
    404: OpenApiResponse(response=ErrorSerializer, description="Not Found"),
    409: OpenApiResponse(response=ErrorSerializer, description="Conflict"),
}
