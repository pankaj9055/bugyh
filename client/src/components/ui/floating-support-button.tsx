import { useState } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function FloatingSupportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const user = authService.getUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chats = [] } = useQuery({
    queryKey: ["/api/support/chats"],
    enabled: isOpen,
  });

  const { data: currentChat } = useQuery({
    queryKey: ["/api/support/chat", currentChatId],
    enabled: !!currentChatId,
  });

  const createChatMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/support/chat", { 
        subject: "General Support" 
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCurrentChatId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/support/chats"] });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await apiRequest("POST", `/api/support/chat/${currentChatId}/message`, {
        message: messageText
      });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/support/chat", currentChatId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartChat = () => {
    if (chats.length > 0) {
      setCurrentChatId(chats[0].id);
    } else {
      createChatMutation.mutate();
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentChatId) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-24 right-6 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg animate-pulse"
        >
          <MessageCircle size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg h-[600px] shadow-xl bg-white">
        <CardHeader className="bg-green-500 text-white p-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium flex items-center">
              <MessageCircle size={20} className="mr-2" />
              Support Chat
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              className="p-2 h-8 w-8 text-white hover:bg-green-600"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-[520px]">
          {!currentChatId ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <MessageCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-6">नमस्ते! आज हम आपकी कैसे मदद कर सकते हैं?</p>
                <Button
                  onClick={handleStartChat}
                  disabled={createChatMutation.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
                >
                  {createChatMutation.isPending ? "Starting..." : "चैट शुरू करें"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-green-50 px-4 py-3 border-b">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Support Team</h3>
                    <p className="text-xs text-green-600">ऑनलाइन • आमतौर पर तुरंत जवाब देते हैं</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {currentChat?.messages?.length > 0 ? (
                  currentChat.messages.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderType === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                          msg.senderType === 'user'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-800 shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderType === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString('hi-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="text-sm">अपना पहला संदेश भेजें</p>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t bg-white p-4">
                <div className="flex items-center space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="अपना संदेश टाइप करें..."
                    className="flex-1 border-gray-300 focus:border-green-500"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}