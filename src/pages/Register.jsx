import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, GraduationCap, School, User, Hash } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { makeRegisteredId } from '@/lib/registeredId';
import { CheckCircle2, XCircle } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [accountType, setAccountType] = useState("student");
  const [schoolCode, setSchoolCode] = useState("");
  const [classCode, setClassCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [codeStatus, setCodeStatus] = useState({ state: "idle", message: "" });

  const institutionalOk = !!schoolCode.trim() && (accountType === "teacher" || !!classCode.trim());
  const personalOk = !!fullName.trim();

  const validate = () => {
    if (!fullName.trim()) return "Informe seu nome completo";
    if (!schoolCode.trim()) return "Informe o código institucional da escola";
    if (accountType === "student" && !classCode.trim()) return "Informe o código da turma";
    return null;
  };

  // Valida códigos de escola (e turma, se aluno) no backend antes de
  // prosseguir — usado tanto no fluxo Google quanto no e-mail/senha.
  const validateCodesBackend = async () => {
    setCodeStatus({ state: "checking", message: "" });
    try {
      const res = await base44.functions.invoke("validateSignupCodes", {
        school_code: schoolCode.trim(),
        class_code: accountType === "student" ? classCode.trim() : "",
        account_type: accountType,
      });
      if (res?.valid) {
        setCodeStatus({ state: "ok", message: "Códigos verificados ✓" });
        return true;
      }
      setCodeStatus({ state: "error", message: res?.error || "Código inválido." });
      return false;
    } catch (err) {
      const msg = err?.data?.error || err?.message || "Não foi possível validar os códigos.";
      setCodeStatus({ state: "error", message: msg });
      return false;
    }
  };

  // Revalida quando os códigos mudam (debounce simples)
  useEffect(() => {
    if (!schoolCode.trim()) { setCodeStatus({ state: "idle", message: "" }); return; }
    if (accountType === "student" && !classCode.trim()) { setCodeStatus({ state: "idle", message: "" }); return; }
    const t = setTimeout(() => { validateCodesBackend(); }, 600);
    return () => clearTimeout(t);
  }, [schoolCode, classCode, accountType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      // Valida códigos institucionais antes de criar a conta
      const codesOk = await validateCodesBackend();
      if (!codesOk) { setLoading(false); return; }
      const e = email.trim().toLowerCase();
      setEmail(e);
      if (password !== confirmPassword) { setError("As senhas não coincidem"); setLoading(false); return; }
      await base44.auth.register({ email: e, password });
      setShowOtp(true);
    } catch (err) {
      setError(err?.data?.message || err?.message || `Não foi possível criar a conta${err?.status ? ` (${err.status})` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const e = (email || '').trim().toLowerCase();
      const result = await base44.auth.verifyOtp({ email: e, otpCode });
      // Sessão: usa o token recebido, ou faz login direto com e-mail/senha (doc oficial).
      if (result?.access_token) base44.auth.setToken(result.access_token);
      else await base44.auth.loginViaEmailPassword(e, password);
      // Dados pessoais + criação do registro do usuário (id único automático)
      await base44.auth.updateMe({
        display_name: fullName.trim(),
      });
      // Vínculo institucional (escola + tipo de conta)
      await base44.functions.invoke("redeemSchoolCode", { code: schoolCode, account_type: accountType });
      // Aluno: solicita entrada na turma
      if (accountType === "student") {
        await base44.functions.invoke("requestClassJoin", { code: classCode });
      }
      // ID público único (PRO-/ALU-), mantido na versão final para identificar a conta.
      await base44.auth.updateMe({ registered_id: makeRegisteredId('user', accountType) });
      window.location.href = "/";
    } catch (err) {
      const raw = err?.data?.message || err?.message || `Falha na verificação do código${err?.status ? ` (${err.status})` : ''}`;
      setError(/not found/i.test(raw) ? `${raw} — o código pode ter expirado. Clique em "Reenviar" para receber um novo e use-o imediatamente.` : raw);
    } finally {
      setLoading(false);
    }
  };

  const handleReenviar = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email.trim().toLowerCase());
    } catch (err) {
      setError(err.message || "Não foi possível reenviar o código");
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);
    try {
      const v = validate();
      if (v) { setError(v); return; }
      // Valida códigos institucionais antes de redirecionar para o Google
      const codesOk = await validateCodesBackend();
      if (!codesOk) return;
      localStorage.setItem("pendingAccountType", accountType);
      localStorage.setItem("pendingSchoolCode", schoolCode);
      localStorage.setItem("pendingFullName", fullName);
      if (accountType === "student") localStorage.setItem("pendingClassCode", classCode);
      await base44.auth.loginWithProvider("google", "/");
    } catch (err) {
      setError(err?.data?.message || err?.message || "Não foi possível conectar ao Google. Tente o cadastro por e-mail.");
    } finally {
      setLoading(false);
    }
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Confirme seu e-mail"
        subtitle={`Enviamos um código para ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            "Confirmar"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Não recebeu o código?{" "}
          <button onClick={handleReenviar} className="text-primary font-medium hover:underline">
            Reenviar
          </button>
        </p>
      </AuthLayout>
    );
  }

  const googleReady = personalOk && institutionalOk;

  return (
    <AuthLayout
      icon={UserPlus}
      title="Crie sua conta"
      subtitle="Escolha seu perfil para começar"
      footer={
        <>
          Já tem uma conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-6" role="radiogroup" aria-label="Tipo de conta">
        <button type="button" role="radio" aria-checked={accountType === "student"} onClick={() => setAccountType("student")} className={`min-h-20 rounded-lg border p-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${accountType === "student" ? "border-primary bg-primary/5" : "hover:bg-muted"}`}><GraduationCap className="w-5 h-5 mb-2" /><span className="font-medium block">Aluno</span><span className="text-xs text-muted-foreground">Corrigir redações</span></button>
        <button type="button" role="radio" aria-checked={accountType === "teacher"} onClick={() => setAccountType("teacher")} className={`min-h-20 rounded-lg border p-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${accountType === "teacher" ? "border-primary bg-primary/5" : "hover:bg-muted"}`}><School className="w-5 h-5 mb-2" /><span className="font-medium block">Professor</span><span className="text-xs text-muted-foreground">Acompanhar turmas</span></button>
      </div>

      {/* Dados pessoais (Aluno e Professor) */}
      <div className="space-y-4 mb-6">
        <div className="space-y-2">
          <Label htmlFor="full-name">Nome completo</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" className="pl-10 h-12" autoComplete="name" required />
          </div>
        </div>
      </div>

      {/* Vínculo institucional */}
      <div className="space-y-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="school-code">Código institucional da escola</Label>
          <div className="relative">
            <School className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input id="school-code" value={schoolCode} onChange={(e) => setSchoolCode(e.target.value.toUpperCase())} placeholder="ESC-XXXXXX" className="pl-10 h-12" required />
          </div>
        </div>
        {accountType === "student" && (
          <div className="space-y-2">
            <Label htmlFor="class-code">Código da turma</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input id="class-code" value={classCode} onChange={(e) => setClassCode(e.target.value.toUpperCase())} placeholder="TURMA-XXXX" className="pl-10 h-12" required />
            </div>
          </div>
        )}
        {codeStatus.state !== "idle" && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${codeStatus.state === "ok" ? "text-emerald-600" : codeStatus.state === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            {codeStatus.state === "ok" && <CheckCircle2 className="w-3.5 h-3.5" />}
            {codeStatus.state === "error" && <XCircle className="w-3.5 h-3.5" />}
            {codeStatus.state === "checking" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {codeStatus.message}
          </div>
        )}
      </div>

      <Button
        className="w-full h-12 text-sm font-medium mb-2"
        disabled={!googleReady || codeStatus.state === "error" || loading}
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continuar com Google
      </Button>
      <p className="mb-6 text-center text-xs text-muted-foreground">Recomendado — sem necessidade de confirmar e-mail.</p>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">ou cadastre-se com e-mail</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmar senha</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" variant="outline" className="w-full h-12 font-medium" disabled={loading || codeStatus.state === "error"}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Criando conta...
            </>
          ) : (
            "Criar conta com e-mail"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}