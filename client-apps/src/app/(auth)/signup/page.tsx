"use client";

import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CircleX, EyeIcon, EyeOffIcon } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { Auth } from "aws-amplify";

// ✅ Schema validasi
const signUpSchema = z
  .object({
    fullName: z.string().min(1, { message: "Full name is required" }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email("Invalid email address"),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).*$/, {
        message:
          "Password must contain uppercase, lowercase, number, and special character",
      }),
    confirmPassword: z.string().min(1, { message: "Confirm password is required" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignUpFormInputs = z.infer<typeof signUpSchema>;

const Signup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<SignUpFormInputs>({
    resolver: zodResolver(signUpSchema),
  });

  const handleInputChange = (fieldName: keyof SignUpFormInputs) => {
    reset(
      { ...getValues(), [fieldName]: getValues(fieldName) },
      { keepValues: true, keepErrors: false }
    );
  };

  // ✅ Handler signup
  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    const { fullName, email, password } = data;
    setIsLoading(true);
    setErr("");

    try {
      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          name: fullName,
          email,
        },
        autoSignIn: {
          enabled: true,
        },
      });

      toast("Signed up successfully. Please sign in.");
      router.replace("/signin");
    } catch (error: any) {
      console.error("Signup error", error);
      setErr(error.message || "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-full p-5">
      <div className="flex flex-col w-full max-w-md p-6 md:p-10 bg-accent shadow-2xl shadow-primary rounded-lg border border-primary opacity-0 animate-fade-in delay-200">
        <div className="grid gap-2 text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-head font-bold tracking-widest opacity-0 animate-slide-down-fade-in delay-100">
            SignUp
          </h1>
          <p className="text-[11px] md:text-[12px] text-muted-foreground opacity-0 animate-slide-up-fade-in delay-100">
            Sign up now and explore the limitless possibilities of our AI assistants!
          </p>
        </div>

        {err && (
          <div className="flex items-center w-full mb-4 gap-3 border border-dashed border-rose-400 rounded-sm px-3 py-2 bg-rose-400/10">
            <CircleX className="w-5 h-5 text-muted-foreground text-rose-400" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-rose-400">Error</span>
              <p className="text-[11px] text-rose-400">{err}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mt-3 grid gap-4">
            <div className="grid gap-2 opacity-0 animate-slide-right-fade-in delay-200">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Your full name"
                error={errors.fullName?.message}
                {...register("fullName", {
                  onChange: () => handleInputChange("fullName"),
                })}
              />
            </div>

            <div className="grid gap-2 opacity-0 animate-slide-right-fade-in delay-300">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="me@example.com"
                error={errors.email?.message}
                {...register("email", {
                  onChange: () => handleInputChange("email"),
                })}
              />
            </div>

            <div className="grid gap-2 opacity-0 animate-slide-right-fade-in delay-500">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                appendIcon={
                  showPassword ? (
                    <EyeOffIcon className="h-4 w-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                  ) : (
                    <EyeIcon className="h-4 w-4 cursor-pointer" onClick={() => setShowPassword(!showPassword)} />
                  )
                }
                {...register("password", {
                  onChange: () => handleInputChange("password"),
                })}
                error={errors.password?.message}
              />
            </div>

            <div className="grid gap-2 opacity-0 animate-slide-right-fade-in delay-700">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                appendIcon={
                  showConfirmPassword ? (
                    <EyeOffIcon
                      className="h-4 w-4 cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  ) : (
                    <EyeIcon
                      className="h-4 w-4 cursor-pointer"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  )
                }
                error={errors.confirmPassword?.message}
                {...register("confirmPassword", {
                  onChange: () => handleInputChange("confirmPassword"),
                })}
              />
            </div>

            <Separator className="opacity-0 animate-fade-in delay-700" />

            <div className="opacity-0 animate-slide-down-fade-in delay-1000">
              <Button type="submit" className="w-full text-primary-foreground" disabled={isLoading}>
                <span className={isLoading ? "animate-pulse" : ""}>
                  {isLoading ? "Registering..." : "Sign Up"}
                </span>
              </Button>
            </div>
          </div>
        </form>

        <div className="my-4 text-center text-xs opacity-0 animate-slide-right-fade-in delay-1000">
          Already have an account?
          <a href="/signin" className="font-bold text-primary hover-underline ml-1">
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
