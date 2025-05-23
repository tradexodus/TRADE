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

      // 2. Create user profile
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert([
          {
            id: signUpData.user.id,
            name: values.name,
            email: values.email,
          },
        ]);

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error("Failed to create user profile");
      }

      // 3. Create user account with auto-incrementing account_id starting from 22500
      const { data: accountData, error: accountError } = await supabase
        .from("user_accounts")
        .insert([
          {
            id: signUpData.user.id,
            balance: 0,
          },
        ])
        .select();

      if (accountError || !accountData?.[0]) {
        console.error("Account creation error:", accountError);
        throw new Error("Failed to create user account");
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
        description: "Please check your email to verify your account",
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
              {isLoading ? "Creating account..." : "Sign up"}
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
