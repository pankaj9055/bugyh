import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageCircle, 
  Send, 
  Users, 
  Clock,
  CheckCircle,
  User,
  Shield
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function AdminSupportChat() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: chats = [], isLoading: chatsLoading } = useQuery({
    queryKey: ["/api/admin/support/chats"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/admin/support/messages", selectedChatId],
    enabled: !!selectedChatId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const res = await apiRequest("POST", `/api/admin/support/messages/${selectedChatId}`, {
        message: messageText
      });
      return res.json();
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/messages", selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/chats"] });
      toast({
        title: "Message Sent",
        description: "Your response has been sent to the user.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ chatId, status }: { chatId: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/admin/support/chat/${chatId}/status`, {
        status
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/chats"] });
      toast({
        title: "Status Updated",
        description: "Chat status has been updated successfully.",
      });
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || !selectedChatId) return;
    sendMessageMutation.mutate(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const selectedChat = chats.find((chat: any) => chat.id === selectedChatId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Chat List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="mr-2 text-blue-600" size={20} />
            Support Chats ({chats.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            {chatsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : chats.length > 0 ? (
              <div className="space-y-2 p-4">
                {chats.map((chat: any) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors border ${
                      selectedChatId === chat.id
                        ? "bg-blue-50 border-blue-200"
                        : "hover:bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="mr-2 text-gray-600" size={16} />
                        <span className="font-medium text-sm truncate">
                          {users.find((u: any) => u.id === chat.userId)?.fullName || `User ${chat.userId.slice(0, 8)}`}
                        </span>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(chat.status)}`}>
                        {chat.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 truncate">
                      {chat.subject}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="mr-1" size={12} />
                      {formatDistanceToNow(new Date(chat.lastMessageAt || chat.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No support chats yet</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card className="lg:col-span-2">
        {selectedChatId ? (
          <>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="mr-2 text-blue-600" size={20} />
                  Chat with {users.find((u: any) => u.id === selectedChat?.userId)?.fullName || 'User'}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(selectedChat?.status || "open")}>
                    {selectedChat?.status || "open"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatusMutation.mutate({
                      chatId: selectedChatId,
                      status: selectedChat?.status === "open" ? "closed" : "open"
                    })}
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="mr-1" size={14} />
                    {selectedChat?.status === "open" ? "Close" : "Reopen"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Subject: {selectedChat?.subject}
              </p>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[460px]">
              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.senderType === 'admin' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                            msg.senderType === 'admin'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-center mb-1">
                            {msg.senderType === 'admin' ? (
                              <Shield className="mr-1" size={12} />
                            ) : (
                              <User className="mr-1" size={12} />
                            )}
                            <span className="text-xs font-medium">
                              {msg.senderType === 'admin' ? 'Admin' : 'User'}
                            </span>
                          </div>
                          <p className="text-sm">{msg.message}</p>
                          <p className={`text-xs mt-2 ${
                            msg.senderType === 'admin' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString('hi-IN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">No messages yet</p>
                  </div>
                )}
              </ScrollArea>

              {/* Reply Input */}
              <div className="border-t p-4">
                <div className="flex items-center space-x-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your reply..."
                    className="flex-1 border-gray-300 focus:border-blue-500"
                    disabled={sendMessageMutation.isPending || selectedChat?.status === "closed"}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isPending || selectedChat?.status === "closed"}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2"
                  >
                    <Send size={16} />
                  </Button>
                </div>
                {selectedChat?.status === "closed" && (
                  <p className="text-xs text-red-500 mt-2">
                    This chat is closed. Reopen it to send messages.
                  </p>
                )}
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">Select a chat</p>
              <p className="text-gray-400 text-sm">
                Choose a conversation from the left to start replying
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}