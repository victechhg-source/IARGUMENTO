import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, User, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import AccessCodeFields from "@/components/auth/AccessCodeFields";
import useAccessCodeValidation from "@/hooks/useAccessCodeValidation";
import { savePendingSignup } from "@/lib/roles";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validation = useAccessCodeValidation(accessCode, classCode);
  const ready = !!fullName.trim() && validation.status === "valid";

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      // Os códigos vão apenas como pré-preenchimento; a gravação real acontece
      // no servidor, em /completar-cadastro, após o retorno do Google.
      savePendingSignup({ accessCode: accessCode.trim(), classCode: classCode.trim(), fullName: fullName.trim() });
      await base44.auth.loginWithProvider("google", "/completar-cadastro");
    } catch (err) {
      setError(err?.data?.message || err?.message || "Não foi possível conectar ao Google. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crie sua conta"
      subtitle="Use o código de acesso fornecido pela sua escola"
      footer={
        <>
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm" role="alert">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="full-name">Nome completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
              className="pl-10 h-12"
              autoComplete="name"
              required
            />
          </div>
        </div>

        <AccessCodeFields
          accessCode={accessCode}
          onAccessCodeChange={setAccessCode}
          classCode={classCode}
          onClassCodeChange={setClassCode}
          validation={validation}
        />

        <Button className="w-full h-12 text-sm font-medium" disabled={!ready || loading} onClick={handleGoogle}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <GoogleIcon className="w-5 h-5 mr-2" />
          )}
          Continuar com Google
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Você confirma os dados na próxima etapa antes de concluir o cadastro.
        </p>
      </div>
    </AuthLayout>
  );
}