from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['GET'])
def welcome(request):
    if request.method == 'GET':
        return Response({'message' : 'Welcome to Atlas!'})