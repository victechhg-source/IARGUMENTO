import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

const PENDING_KEYS = [
  "pendingAccountType",
  "pendingSchoolCode",
  "pendingFullName",
  "pendingBirthDate",
  "pendingCpf",
  "pendingClassCode",
];

const clearPending = () => PENDING_KEYS.forEach((k) => localStorage.removeItem(k));

/**
 * Consome os dados de cadastro pendentes (definidos antes do login via Google
 * na página de Registro) e finaliza o perfil do usuário: salva dados pessoais,
 * valida o código institucional e, para alunos, solicita entrada na turma.
 */
export default function GoogleSignupCompletion() {
  const { user } = useAuth();
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const schoolCode = localStorage.getItem("pendingSchoolCode");
    if (!schoolCode || !user) return;

    // Usuário recorrente com perfil já completo: apenas limpa pendências obsoletas.
    if (user.school_id) {
      clearPending();
      return;
    }

    let cancelled = false;
    (async () => {
      setCompleting(true);
      try {
        const accountType = localStorage.getItem("pendingAccountType") || "student";
        const fullName = localStorage.getItem("pendingFullName") || "";
        const birthDate = localStorage.getItem("pendingBirthDate") || "";
        const cpf = localStorage.getItem("pendingCpf") || "";
        const classCode = localStorage.getItem("pendingClassCode") || "";

        if (fullName || birthDate || cpf) {
          await base44.auth.updateMe({
            display_name: fullName.trim(),
            date_of_birth: birthDate,
            cpf,
          });
        }
        await base44.functions.invoke("redeemSchoolCode", {
          code: schoolCode,
          account_type: accountType,
        });
        if (accountType === "student" && classCode) {
          await base44.functions.invoke("requestClassJoin", { code: classCode });
        }
      } catch (e) {
        console.error("Google signup completion failed:", e);
      } finally {
        clearPending();
        if (!cancelled) setCompleting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!completing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-medium text-foreground">Finalizando seu cadastro…</p>
      </div>
    </div>
  );
}