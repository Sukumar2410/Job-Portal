from rest_framework import serializers


class MockInterviewAnswerSerializer(serializers.Serializer):
    question = serializers.CharField()
    answer = serializers.CharField()


class MockInterviewEvaluationSerializer(serializers.Serializer):
    responses = serializers.ListField(
        child=MockInterviewAnswerSerializer()
    )