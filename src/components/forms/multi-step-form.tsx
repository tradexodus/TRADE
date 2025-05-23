import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  saveFormProgress,
  getFormProgress,
  clearFormProgress,
} from "@/lib/cookies";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Define schemas for each step
const step1Schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

const step2Schema = z.object({
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City must be at least 2 characters"),
});

const step3Schema = z.object({
  experience: z.string().min(10, "Please describe your experience"),
  goals: z.string().min(10, "Please describe your goals"),
  additionalInfo: z.string().optional(),
});

const fullSchema = step1Schema.merge(step2Schema).merge(step3Schema);

type FormData = z.infer<typeof fullSchema>;

interface MultiStepFormProps {
  onSubmit?: (data: FormData) => void;
  formId?: string;
}

export default function MultiStepForm({
  onSubmit = () => {},
  formId = "multi_step_form",
}: MultiStepFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const form = useForm<FormData>({
    resolver: zodResolver(fullSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      experience: "",
      goals: "",
      additionalInfo: "",
    },
    mode: "onChange",
  });

  // Load saved progress on component mount
  useEffect(() => {
    const savedProgress = getFormProgress(formId);
    if (savedProgress) {
      // Restore form data
      Object.keys(savedProgress.data || {}).forEach((key) => {
        if (key in form.getValues()) {
          form.setValue(key as keyof FormData, savedProgress.data[key]);
        }
      });

      // Restore current step
      if (savedProgress.currentStep) {
        setCurrentStep(savedProgress.currentStep);
      }
    }
  }, [form, formId]);

  // Save progress whenever form data or step changes
  useEffect(() => {
    const subscription = form.watch((data) => {
      const progressData = {
        data,
        currentStep,
        timestamp: new Date().toISOString(),
      };
      saveFormProgress(formId, progressData);
    });
    return () => subscription.unsubscribe();
  }, [form, currentStep, formId]);

  const nextStep = async () => {
    let isValid = false;

    // Validate current step
    switch (currentStep) {
      case 1:
        isValid = await form.trigger(["firstName", "lastName", "email"]);
        break;
      case 2:
        isValid = await form.trigger(["phone", "address", "city"]);
        break;
      case 3:
        isValid = await form.trigger(["experience", "goals"]);
        break;
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: FormData) => {
    // Clear saved progress after successful submission
    clearFormProgress(formId);
    onSubmit(data);
  };

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-background">
      <Card>
        <CardHeader>
          <CardTitle>Multi-Step Registration Form</CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your first name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your last name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Contact Information */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Enter your phone number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your city" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 3: Additional Information */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Additional Information
                  </h3>
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trading Experience</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your trading experience"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="goals"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Investment Goals</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your investment goals"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="additionalInfo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Information (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional information you'd like to share"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="submit" className="flex items-center gap-2">
                    Submit Form
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
