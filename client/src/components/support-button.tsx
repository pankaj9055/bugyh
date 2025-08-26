import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import { 
  MessageCircle, 
  Send, 
  User, 
  Shield, 
  Clock,
  CheckCircle2,
  Plus,
  Loader2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(500, "Message too long"),
});

const newChatSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(100, "Subject too long"),
});

type MessageForm = z.infer<typeof messageSchema>;
type NewChatForm = z.infer<typeof newChatSchema>;

export function SupportButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getUser();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);

  const { data: chats, isLoading: chatsLoading } = useQuery({
    queryKey: ["/api/support/chats"],
    enabled: isOpen,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ["/api/support/messages", selectedChatId],
    enabled: !!selectedChatId,
  });

  const messageForm = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  });

  const newChatForm = useForm<NewChatForm>({
    resolver: zodResolver(newChatSchema),
    defaultValues: { subject: "" },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageForm) => {
      const res = await apiRequest("POST", `/api/support/messages/${selectedChatId}`, data);
      return res.json();
    },
    onSuccess: () => {
      messageForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/support/messages", selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ["/api/support/chats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createChatMutation = useMutation({
    mutationFn: async (data: NewChatForm) => {
      const res = await apiRequest("POST", "/api/support/chats", data);
      return res.json();
    },
    onSuccess: (newChat) => {
      setSelectedChatId(newChat.id);
      setShowNewChat(false);
      newChatForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/support/chats"] });
      toast({
        title: "Success",
        description: "New support chat created",
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  const onSendMessage = (data: MessageForm) => {
    if (!selectedChatId) return;
    sendMessageMutation.mutate(data);
  };

  const onCreateChat = (data: NewChatForm) => {
    createChatMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white relative"
        >
          <MessageCircle size={16} className="mr-1" />
          <span className="hidden sm:inline">Support</span>
          <span className="sm:hidden">Help</span>
          
          {/* New message indicator */}
          {chats?.some((chat: any) => chat.unreadCount > 0) && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl h-[600px] p-0">
        <div className="flex h-full">
          {/* Chat List */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col">
            <DialogHeader className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center">
                  <MessageCircle className="mr-2" size={20} />
                  Support Chat
                </DialogTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowNewChat(true)}
                  className="h-8 px-2"
                >
                  <Plus size={14} className="mr-1" />
                  New
                </Button>
              </div>
            </DialogHeader>
            
            <ScrollArea className="flex-1 p-2">
              {chatsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : chats?.length > 0 ? (
                <div className="space-y-2">
                  {chats.map((chat: any) => (
                    <div
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedChatId === chat.id
                          ? "bg-blue-50 border-blue-200"
                          : "hover:bg-gray-50 border-gray-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm truncate">
                          {chat.subject}
                        </span>
                        <Badge className={`text-xs ${getStatusColor(chat.status)}`}>
                          {chat.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true })}
                      </p>
                      {chat.unreadCount > 0 && (
                        <div className="flex justify-end mt-1">
                          <Badge variant="destructive" className="text-xs">
                            {chat.unreadCount} new
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm">No conversations yet</p>
                  <p className="text-xs text-gray-400">Start a new chat for support</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Content */}
          <div className="flex-1 flex flex-col">
            {showNewChat ? (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold mb-3">Start New Conversation</h3>
                <Form {...newChatForm}>
                  <form onSubmit={newChatForm.handleSubmit(onCreateChat)} className="space-y-3">
                    <FormField
                      control={newChatForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="What do you need help with?"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={createChatMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {createChatMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Start Chat"
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowNewChat(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            ) : selectedChatId ? (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : messages?.length > 0 ? (
                    <div className="space-y-4">
                      {messages.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.senderType === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderType === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center mb-1">
                              {message.senderType === 'admin' ? (
                                <Shield size={12} className="mr-1" />
                              ) : (
                                <User size={12} className="mr-1" />
                              )}
                              <span className="text-xs opacity-75">
                                {message.senderType === 'admin' ? 'Support Team' : 'You'}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                            <p className="text-xs opacity-75 mt-1">
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <Form {...messageForm}>
                    <form onSubmit={messageForm.handleSubmit(onSendMessage)}>
                      <FormField
                        control={messageForm.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="flex space-x-2">
                                <Input
                                  placeholder="Type your message..."
                                  {...field}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      messageForm.handleSubmit(onSendMessage)();
                                    }
                                  }}
                                />
                                <Button
                                  type="submit"
                                  size="sm"
                                  disabled={sendMessageMutation.isPending}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {sendMessageMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="font-medium text-gray-900 mb-1">Welcome to Support</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select a conversation or start a new one
                  </p>
                  <Button
                    onClick={() => setShowNewChat(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Start New Chat
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}