import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { Shield, Loader2 } from "lucide-react";

const adminLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AdminLoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<AdminLoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: AdminLoginForm) => {
    setIsLoading(true);
    try {
      const result = await authService.login(data);
      
      // Check if user has admin role
      if (result.user.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      toast({
        title: "Success",
        description: "Admin logged in successfully!",
      });
      setLocation("/admin");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="text-red-500 mr-2" size={32} />
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-100">Administrator Access</h2>
          <p className="mt-2 text-sm text-gray-300">
            Secure admin login for EV Investment platform
          </p>
        </div>

        <Card className="border-red-200 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-center text-red-800">
              <Shield className="mx-auto mb-2" size={24} />
              Admin Login
            </CardTitle>
            <CardDescription className="text-center">
              Enter admin credentials to access control panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter admin email" 
                          className="focus:ring-red-500 focus:border-red-500"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter admin password"
                          className="focus:ring-red-500 focus:border-red-500" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Access Admin Panel
                    </>
                  )}
                </Button>
              </form>
            </Form>


            <div className="mt-4 text-center">
              <Link 
                href="/login" 
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                ← Back to User Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}