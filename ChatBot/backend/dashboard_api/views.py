from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from datetime import timedelta
from django.utils.timezone import now
from chatbot_api.models import ChatSession
from promptbox_api.models import PromptBoxItem
from django.db.models import Count

from datetime import timedelta #Bilge


User = get_user_model()


class UserCountAPIView(APIView):
    """total number of user"""
    def get(self , request):
        count = User.objects.count()
        return Response({'user_count': count})
    

#Bilge
class WeeklySessionStatsAPIView(APIView):
    def get(self, request):
        today = now().date()
        daily_counts = []
        for i in range(7):
            day = today - timedelta(days=6 - i)
            count = ChatSession.objects.filter(created_on__date=day).count()
            daily_counts.append(count)
        return Response({'weekly_sessions': daily_counts})

    

class PromptCountAPIView(APIView):
    """createted  promtbox item  number for all time"""
    def get(self, request):
        count = PromptBoxItem.objects.count()
        return Response({'total_prompts': count})
    
class TodaySessionCountAPIView(APIView):
    """daily created sessions count"""
    def get(self, request):
        today = now().date()
        count = ChatSession.objects.filter(created_on__date=today).count()
        return Response({'today_sessions': count})

from django.db.models import Count

class TopActiveUsersAPIView(APIView):
    """most active 3 user"""
    def get(self, request):
        data = get_user_model().objects.annotate(
            session_count=Count('chat_sessions')
        ).order_by('-session_count')[:3].values('email', 'session_count')
        return Response({'top_users': list(data)})
from rest_framework.authtoken.models import Token

class TokenUserCountAPIView(APIView):
    """count of logins with token"""
    def get(self, request):
        count = Token.objects.count()
        return Response({'token_users': count})
