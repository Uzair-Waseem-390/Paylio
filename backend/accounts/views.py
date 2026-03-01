from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated




"""
    User Registration View
    Request Body Example:
    {
        "username": "",
        "email": "",
        "password": "",
        "first_name": "",
        "last_name": ""
    }
"""

@api_view(['POST'])
def user_register(request):

    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")

    # Validation
    if not username or not password:
        return Response(
            {"error": "Username and password are required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already taken"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create user securely
    user = User.objects.create_user(
        username=username,
        email=email or "",
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    serializer = UserSerializer(user)

    return Response(
        {
            "message": "User registered successfully",
            "user": serializer.data
        },
        status=status.HTTP_201_CREATED
    )



class Profile(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user