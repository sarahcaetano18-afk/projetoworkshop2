import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Profile } from "../types";
import { validateAuth } from "../lib/prototype";
import Icon from "./Icon";

type Props = {
  mode: "login" | "signup";
  onMode: (mode: "login" | "signup") => void;
  onEnter: (profile: Profile) => void;
  onDemo: () => void;
};
export default function AuthScreen({ mode, onMode, onEnter, onDemo }: Props) {
  const signup = mode === "signup";
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [recoveryDone, setRecoveryDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    setErrors({});
    setRecovery(false);
    setRecoveryDone(false);
    setVisible(false);
    setBusy(false);
    clearTimeout(timer.current);
  }, [mode]);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get("email") || "").trim();
    const name = String(form.get("name") || "").trim();
    if (!recovery) {
      setErrors({});
      formElement.reset();
      onEnter({ name: signup && name ? name : "Lucas", email: email || "lucas@exemplo.com" });
      return;
    }
    const next = validateAuth("recovery", {
      email,
      password: "",
      name: "",
      confirm: "",
    });
    setErrors(next);
    if (Object.keys(next).length) {
      formElement.querySelector<HTMLInputElement>(`[name="${Object.keys(next)[0]}"]`)?.focus();
      return;
    }
    setBusy(true);
    timer.current = setTimeout(() => {
      setBusy(false);
      setRecoveryDone(true);
    }, 650);
  }
  function fieldError(name: string) {
    return errors[name] ? (
      <span className="field-error" id={`auth-${name}-error`}>
        {errors[name]}
      </span>
    ) : null;
  }
  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="Bem-vindo ao Eskgo">
        <button className="wordmark" onClick={onDemo} aria-label="Eskgo, abrir demonstração">
          eskgo<span>®</span>
        </button>
        <div className="auth-story-content">
          <span className="kicker">SEU DINHEIRO. SUAS POSSIBILIDADES.</span>
          <h2>
            Clareza para hoje.
            <br />
            Liberdade para
            <br />
            <span>amanhã.</span>
          </h2>
          <p>Um lugar para organizar o agora e tirar as próximas conquistas do papel.</p>
          <div className="auth-art" aria-hidden="true">
            <div className="auth-art-orbit" />
            <div className="auth-art-card">
              <span>
                eskgo <Icon name="wallet" size={22} />
              </span>
              <small>Seu saldo</small>
              <strong>
                R$ 14.500<span>,00</span>
              </strong>
              <div>
                <span>•••• 4552</span>
                <span>NO SEU CONTROLE</span>
              </div>
            </div>
            <div className="auth-art-goal">
              <span className="auth-art-goal-icon">
                <Icon name="target" size={22} />
              </span>
              <span>
                Viagem ao Japão<strong>Mais perto a cada passo.</strong>
              </span>
              <span>68%</span>
            </div>
          </div>
          <div className="auth-story-tags">
            <span>
              <Icon name="check" size={14} />
              Sem complicação
            </span>
            <span>
              <Icon name="lock" size={14} />
              No seu controle
            </span>
          </div>
        </div>
        <small className="auth-story-signature">
          Seu assistente financeiro para grandes conquistas.
        </small>
      </section>
      <section className="auth-form-side">
        <button className="auth-demo-link" onClick={onDemo}>
          Explorar demonstração <Icon name="arrow" size={15} />
        </button>
        <div className="auth-form-card">
          <span className="eyebrow-badge">
            <span className="status-dot" />
            AMBIENTE DEMONSTRATIVO
          </span>
          <div className="auth-tabs" aria-label="Acesso">
            <button
              className={!signup ? "active" : ""}
              aria-current={!signup ? "page" : undefined}
              onClick={() => onMode("login")}
              disabled={busy}
            >
              Entrar
            </button>
            <button
              className={signup ? "active" : ""}
              aria-current={signup ? "page" : undefined}
              onClick={() => onMode("signup")}
              disabled={busy}
            >
              Criar conta
            </button>
          </div>
          <h1>
            {recovery
              ? "Vamos recuperar o acesso."
              : signup
                ? "Seu próximo passo começa aqui."
                : "Bom ter você de volta."}
          </h1>
          <p className="auth-intro">
            {recovery
              ? "Conheça o fluxo de recuperação por e-mail."
              : signup
                ? "Clique em criar conta para explorar. Não precisa preencher os campos."
                : "Clique em entrar e explore. Não precisa preencher e-mail ou senha."}
          </p>
          {recoveryDone ? (
            <div className="auth-recovery-result" role="status">
              <span className="success-mark">
                <Icon name="mail" size={26} />
              </span>
              <h2>Fluxo de recuperação validado.</h2>
              <p>
                Nenhum e-mail foi enviado. O envio de um link seguro será conectado na etapa de
                autenticação real.
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  setRecovery(false);
                  setRecoveryDone(false);
                }}
              >
                Voltar para entrar
                <Icon name="right" size={17} />
              </button>
            </div>
          ) : (
            <form key={`${mode}-${recovery}`} onSubmit={submit} noValidate aria-busy={busy}>
              {signup && !recovery && (
                <label>
                  Seu nome (opcional)
                  <input
                    name="name"
                    autoComplete="name"
                    placeholder="Como podemos chamar você?"
                    maxLength={60}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "auth-name-error" : undefined}
                  />
                  {fieldError("name")}
                </label>
              )}
              <label>
                E-mail {recovery ? "" : "(opcional)"}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  maxLength={120}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "auth-email-error" : undefined}
                  required={recovery}
                />
                {fieldError("email")}
              </label>
              {!recovery && (
                <label>
                  Senha (opcional)
                  <span className="password-control">
                    <input
                      name="password"
                      type={visible ? "text" : "password"}
                      autoComplete={signup ? "new-password" : "current-password"}
                      placeholder="Opcional nesta demonstração"
                      maxLength={128}
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? "auth-password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setVisible(!visible)}
                      aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                    >
                      <Icon name={visible ? "hide" : "eye"} size={19} />
                    </button>
                  </span>
                  {fieldError("password")}
                </label>
              )}
              {signup && !recovery && (
                <label>
                  Confirme a senha (opcional)
                  <input
                    name="confirm"
                    type={visible ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Opcional nesta demonstração"
                    maxLength={128}
                    aria-invalid={!!errors.confirm}
                    aria-describedby={errors.confirm ? "auth-confirm-error" : undefined}
                  />
                  {fieldError("confirm")}
                </label>
              )}
              {!signup && !recovery && (
                <button
                  className="auth-forgot text-link"
                  type="button"
                  onClick={() => {
                    setRecovery(true);
                    setErrors({});
                  }}
                >
                  Esqueci minha senha
                </button>
              )}
              <div aria-live="polite" className="sr-only">
                {Object.values(errors).join(" ")}
              </div>
              <button className="primary-button auth-submit" disabled={busy} type="submit">
                {busy ? (
                  <>
                    <span className="button-spinner" />
                    {recovery ? "Validando…" : "Preparando seu espaço…"}
                  </>
                ) : (
                  <>
                    {recovery
                      ? "Validar recuperação"
                      : signup
                        ? "Criar conta de demonstração"
                        : "Entrar na demonstração"}
                    <Icon name="arrow" size={18} />
                  </>
                )}
              </button>
              {recovery && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    setRecovery(false);
                    setErrors({});
                  }}
                >
                  Voltar para entrar
                </button>
              )}
            </form>
          )}
          <div className="auth-privacy">
            <Icon name="lock" size={15} />
            <p>
              Validação de interface, sem autenticação real. Nenhuma senha é salva ou enviada. Os
              dados financeiros são exemplos locais.
            </p>
          </div>
        </div>
        <span className="auth-bottom-note">
          Simples por fora. Cheio de possibilidades por dentro.
        </span>
      </section>
    </main>
  );
}
