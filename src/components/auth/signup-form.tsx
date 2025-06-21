import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Mail } from "lucide-react";
import {
  setSessionToken,
  saveFormProgress,
  getFormProgress,
  clearFormProgress,
} from "@/lib/cookies";

const formSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Load saved form progress on component mount
  useEffect(() => {
    const savedProgress = getFormProgress("signup");
    if (savedProgress) {
      if (savedProgress.name) form.setValue("name", savedProgress.name);
      if (savedProgress.email) form.setValue("email", savedProgress.email);
      // Note: We don't restore passwords for security reasons
    }
  }, [form]);

  // Save form progress when form values change
  useEffect(() => {
    const subscription = form.watch((value) => {
      const progressData: Record<string, any> = {};
      if (value.name) progressData.name = value.name;
      if (value.email) progressData.email = value.email;

      if (Object.keys(progressData).length > 0) {
        saveFormProgress("signup", progressData);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);

      // 1. Sign up with Supabase Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              name: values.name,
            },
          },
        });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!signUpData.user) {
        throw new Error("Failed to create user");
      }

      // 2. Create user profile with better error handling
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: signUpData.user.id,
            name: values.name,
            email: values.email,
            neuron_level: "Bronze", // Set default neuron level
            neuron_level_percentage: 0, // Set default percentage
            total_deposit_amount: 0, // Set default deposit amount
          },
        ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Try to create profile with minimal data if the full insert fails
        const { error: minimalProfileError } = await supabase
          .from("user_profiles")
          .insert([
            {
              id: signUpData.user.id,
              name: values.name,
              email: values.email,
            },
          ]);

        if (minimalProfileError) {
          console.error("Minimal profile creation error:", minimalProfileError);
          // Don't throw error here - user account is already created
          // Just log the error and continue
          console.warn(
            "User profile creation failed, but account was created successfully",
          );
        }
      }

      // 3. Create user account with auto-incrementing account_id starting from 22500
      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .insert([
          {
            id: signUpData.user.id,
            balance: 0,
            profit: 0, // Set default profit
            role: "user", // Set default role
          },
        ])
        .select();

      if (accountError) {
        console.error("Account creation error:", accountError);
        // Don't throw error here - user account is already created in auth
        // Just log the error and continue
        console.warn(
          "User account creation failed, but auth account was created successfully",
        );
      }

      // Get the session and store it in cookie if auto-login is enabled
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSessionToken(session.access_token);
      }

      // Clear form progress after successful signup
      clearFormProgress("signup");

      toast({
        title: "Success",
        description:
          "Account created successfully! Please check your email to verify your account.",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create account",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignUp() {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo:
            "https://laughing-kowalevski3-yny9h.view-3.tempo-dev.app/dashboard",
        },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to sign up with Google. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-card rounded-lg border">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Create an account</h1>
        <p className="text-muted-foreground">Enter your details to sign up</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    {...field}
                    type="email"
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Create a password"
                    {...field}
                    type="password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Confirm your password"
                    {...field}
                    type="password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              <Mail className="w-4 h-4 mr-2" />
              {isLoading ? "Creating account..." : "Sign up with Email"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={handleGoogleSignUp}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
