import requests
import time
import matplotlib
matplotlib.use("Agg")

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status , permissions

from chatbot_api.models import ChatMessage ,ChatSession
from chatbot_api.serializers import ChatMessageSerializer , UpdateSessionTitleSerializer


class ChatMessageAPIView(APIView):
    """user send message to Ollama and gets return"""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request , session_id):
        user = request.user
        message_text = request.data.get("message")

        if not message_text:
            return Response({'error':'Message is required.'},status=status.HTTP_400_BAD_REQUEST)


        #Session control

        try:
            session = ChatSession.objects.get(id=session_id , user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error':'session is not found'}, status=status.HTTP_400_BAD_REQUEST)
        

        #  sace user message

        user_msg = ChatMessage.objects.create(
            session = session,
            is_user = True,
            message = message_text
        )

          #AI ile otomatik başlık üretme (ilk mesajsa + title boşsa)
        is_first_message = not ChatMessage.objects.filter(session=session).exclude(id=user_msg.id).exists()
        if is_first_message and not session.title:
            try:
                title_prompt = [
                    {"role": "user", "content": f"Mesajdan maksimum 4 kelimelik bir başlık üret. Noktalama işareti kullanma. Başlık sade ve öz olmalı:\n\n{message_text}"
}
                ]
                title_payload = {
                    "model": "aya:latest",
                    "messages": title_prompt,
                    "stream": False
                }
                title_response = requests.post("https://5ec1-78-180-30-37.ngrok-free.app/api/chat", json=title_payload, timeout=10)
                title_response.raise_for_status()
                ai_title = title_response.json().get("message", {}).get("content", "Yeni Oturum").strip()
                session.title = ai_title
                session.save()
            except Exception as e:
                print("AI başlık üretim hatası:", e)
                session.title = "Yeni Oturum"
                session.save()

        # collect old messages 

        past_messages = session.messages.order_by("timestamp")
        from rag_engine.retriever import get_rag_response  # retriever dosyana göre

        # 1. RAG'den kişiye özel bilgi çek
        rag_info = get_rag_response(message_text)

        # 2. Eğer bilgi geldiyse, system mesajına ekle
        formatted_history = [
            {
                "role": "user" if msg.is_user else "assistant",
                "content": msg.message
            } for msg in past_messages
        ]

        if rag_info:
            formatted_history.insert(0, {
                "role": "system",
                "content": f"information about person: {rag_info}"
            })

        #  request to ollama
        ollama_url = "https://5ec1-78-180-30-37.ngrok-free.app/api/chat"# Ollama URL
        payload = {
            "model": "aya:latest",  # model name
            "messages": formatted_history,
            "stream": False
        }

        try:
            start = time.time()
            response = requests.post(ollama_url, json=payload)
            end = time.time()
            response_time = round(end - start , 3)
            response.raise_for_status()
            ## print("OLLLAMA RESPONSE JSON:", response.json())  ## for examine
            ollama_data = response.json()
            token_usage = ollama_data.get("prompt_eval_count", 0) + ollama_data.get("eval_count", 0)
        except requests.RequestException as e:
            print(f"OLLAMA HATASI: {e}")  # ekle
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)


        # 5. take back and save message
        bot_reply = response.json().get("message", {}).get("content", "not answering")
        bot_msg = ChatMessage.objects.create(
            session=session,
            is_user=False,
            message=bot_reply,
            response_time = response_time,
            model_name = "aya:latest",
            token_usage=token_usage
        )
        import matplotlib.pyplot as plt
        import pandas as pd
        import os
        from django.core.files import File
        from django.conf import settings

        # Excel dosyasından pie chart üretimi (varsa)
        excel_file = request.FILES.get("file")
        if excel_file:
            try:
                df = pd.read_excel(excel_file)

                # Otomatik kategori ve değer sütunlarını belirle
                columns = df.columns.tolist()
                label_col = None
                value_col = None

                for col in columns:
                    if 'kategori' in col.lower() or 'sınıf' in col.lower() or 'isim' in col.lower():
                        label_col = col
                    elif df[col].dtype in ['int64', 'float64']:
                        value_col = col

                # Eğer kategori belli değilse ilk sütunu al
                if not label_col:
                    label_col = columns[0]

                # Grafik çizimi
                plt.figure(figsize=(4, 4))
                if value_col:
                    df.groupby(label_col)[value_col].sum().plot.pie(autopct="%1.1f%%")
                else:
                    df[label_col].value_counts().plot.pie(autopct="%1.1f%%")

                plt.title(f"{label_col} Dağılımı")
                plt.ylabel("")
                plt.tight_layout()

                chart_filename = f"chart_{bot_msg.id}.png"
                chart_path = os.path.join(settings.MEDIA_ROOT, "chat_charts", chart_filename)
                os.makedirs(os.path.dirname(chart_path), exist_ok=True)
                plt.savefig(chart_path)
                plt.close()

                with open(chart_path, "rb") as f:
                    bot_msg.chart_image.save(chart_filename, File(f), save=True)
            except Exception as e:
                print("Excel işleme hatası:", e)
        # 6. JSON response
        return Response({
            "user_message": ChatMessageSerializer(user_msg,context={"request": request}).data,
            "bot_reply": ChatMessageSerializer(bot_msg,context={"request": request}).data
        }, status=status.HTTP_201_CREATED)


class  CreateSessionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        title = request.data.get('title','')
        session = ChatSession.objects.create(
            user = request.user,
            title = title
        )
        return Response({"session_id": session.id, 'title': session.title})
    


class ChatSessionMessagesAPIView(APIView):

    def get(self,request ,session_id):
        try:
            session = ChatSession.objects.get(id=session_id , user = request.user)
        except ChatSession.DoesNotExist:
            return Response({'error':'session is not found'},status=status.HTTP_404_NOT_FOUND)
        
        messages = session.messages.order_by('timestamp')
        serialized = ChatMessageSerializer(messages, many= True)

        return Response(serialized.data , status=status.HTTP_200_OK)
    

class ChatSessionListAPIView(APIView):

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(user= request.user).order_by("-id")
        data = [{"id": s.id, "created": s.created_on , 'title': s.title} for s in sessions]
        return Response(data, status=status.HTTP_200_OK)
    

class ChatSessionDeleteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete (self , request , session_id):
        try:
            session = ChatSession.objects.get(id = session_id , user = request.user)
        except ChatSession.DoesNotExist:
            return Response({"message":"Session not found"}, status=status.HTTP_404_NOT_FOUND)
        
        session.delete()
        return Response({"message":"Session deleted sucessfully"} , status=status.HTTP_200_OK)
    

class UpdateFavouriteAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request  , session_id):
        try:
            session = ChatSession.objects.get(id=session_id , user = request.user)
        except ChatSession.DoesNotExist:
            return Response({"message":"There no session to update its is_favourite field"}, status=status.HTTP_400_BAD_REQUEST)
        
        is_fav = request.data.get('is_favourite')
        if is_fav is None:
            return Response({'error':'missing  is_favourite field'}, status=status.HTTP_400_BAD_REQUEST)
        
        session.is_favourite = is_fav
        session.save()
        return Response({'message':'Session favourite status  updated','is_favourite':session.is_favourite})


class UpdateSessionTitleAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch (self , request , session_id):
        try:
            session = ChatSession.objects.get(id= session_id ,user = request.user)
        except ChatSession.DoesNotExist:
            return Response({'error':'session not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = UpdateSessionTitleSerializer(session , data=request.data , partial= True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors , status=status.HTTP_400_BAD_REQUEST)