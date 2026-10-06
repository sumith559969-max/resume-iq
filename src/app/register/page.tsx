import type { Metadata } from "next";
import { AuthForm, AuthShell } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create an account | ResumeIQ",
  description: "Create your ResumeIQ account and get clearer, more actionable resume feedback.",
};

export default function RegisterPage() {
  return <AuthShell><AuthForm mode="register" /></AuthShell>;
}