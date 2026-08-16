import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { RISK_DISCLOSURE_SHORT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your SynxHub account.",
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with identity verification, then deposit supported assets."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
      <p className="mt-6 text-xs text-muted">{RISK_DISCLOSURE_SHORT}</p>
    </AuthShell>
  );
}
