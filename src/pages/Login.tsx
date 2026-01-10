import * as React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

import { AuthCardLayout } from "@/components/layout/AuthCardLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAuth } from "@/context/AuthContext";
import { useUiStore } from "@/store";
import { LOGIN_REMEMBER_KEY } from "@/config";

const schema = z.object({
  email: z.string().min(1, "Enter your email.").email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const [showPassword, setShowPassword] = React.useState(false);
  const { isAuthenticated, login } = useAuth();
  const { showToast } = useUiStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LOGIN_REMEMBER_KEY);
      if (!raw) return;
      const stored: unknown = JSON.parse(raw);
      if (!stored || typeof stored !== "object") return;
      const obj = stored as Record<string, unknown>;
      if (typeof obj.email === "string") setValue("email", obj.email);
      if (typeof obj.password === "string") setValue("password", obj.password);
      if (typeof obj.remember === "boolean") setValue("remember", obj.remember);
    } catch {
      // ignore malformed values
    }
  }, [setValue]);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  async function onSubmit(data: FormData) {
    try {
      await login(data.email, data.password, Boolean(data.remember));
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Sign-in failed.";
      showToast(message || "Sign-in failed.", "error");
      return;
    }

    if (typeof window === "undefined") return;

    if (data.remember) {
      localStorage.setItem(
        LOGIN_REMEMBER_KEY,
        JSON.stringify({ email: data.email, password: data.password, remember: true })
      );
    } else {
      localStorage.removeItem(LOGIN_REMEMBER_KEY);
    }

    navigate("/dashboard", { replace: true });
  }

  return (
    <AuthCardLayout
      title="PaddyPress Admin"
      subtitle="Sign in to manage master data."
      belowCard={
        <FieldDescription>
          Default login: <span className="font-medium">admin@admin.com</span> /{" "}
          <span className="font-medium">admin123</span>
        </FieldDescription>
      }
    >
      <form className="flex flex-col gap-6" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <div className="group relative">
              <InputGroup>
                <InputGroupAddon>
                  <Mail className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@admin.com"
                  {...register("email")}
                />
              </InputGroup>
            </div>
            <FieldError errors={errors.email ? [errors.email] : []} />
          </Field>

          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <div className="group relative">
              <InputGroup>
                <InputGroupAddon>
                  <Lock className="h-4 w-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter password"
                  {...register("password")}
                />
                <InputGroupAddon align="inline-end" className="pr-1">
                  <InputGroupButton
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
            <FieldError errors={errors.password ? [errors.password] : []} />
          </Field>

          <Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="remember"
                  render={({ field }) => (
                    <Checkbox
                      id="remember"
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  )}
                />
                <span>Remember this device</span>
              </label>
            </div>
          </Field>

          <Field>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </AuthCardLayout>
  );
}
