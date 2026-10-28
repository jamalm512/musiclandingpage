import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent } from "react";
import "./components-feature.css";

type SignupFormProps = {
  source: "inner_circle" | "bounce_notify";
  label: string;
  buttonLabel?: string;
  className?: string;
  releaseTitle?: string;
};

type FormStatus = "idle" | "pending" | "success" | "error";

export default function SignupForm({
  source,
  label,
  buttonLabel = "Join the circle",
  className = "",
  releaseTitle = "the next release",
}: SignupFormProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");
  const [invalidEmail, setInvalidEmail] = useState(false);
  const pending = useRef(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => {
    const controller = request.current;
    request.current = null;
    controller?.abort();
  }, []);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setInvalidEmail(true);
      setStatus("error");
      setMessage("Enter a valid email address and try again.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const controller = new AbortController();
    request.current = controller;
    pending.current = true;
    setInvalidEmail(false);
    setStatus("pending");
    setMessage("Saving your email…");
    const timeout = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          source,
          website: String(formData.get("website") ?? ""),
        }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.success !== true) {
        throw new Error(
          typeof result?.error === "string"
            ? result.error.slice(0, 180)
            : "Signups are unavailable right now. Please try again later.",
        );
      }

      setStatus("success");
      setEmail("");
      setMessage(
        source === "bounce_notify"
          ? `You're on the list. You'll hear when ${releaseTitle} drops.`
          : "You're in. Welcome to the Inner Circle.",
      );
    } catch (error) {
      if (controller.signal.aborted && request.current !== controller) return;
      setStatus("error");
      setMessage(
        error instanceof TypeError
          ? "Couldn't reach the signup service. Please check your connection and try again."
          : error instanceof Error && error.name !== "AbortError"
            ? error.message
            : "That took too long. Please check your connection and try again.",
      );
    } finally {
      window.clearTimeout(timeout);
      pending.current = false;
      if (request.current === controller) request.current = null;
    }
  }

  return (
    <form className={`fan-signup ${className}`} onSubmit={subscribe}>
      <label className="fan-signup__label" htmlFor={`${id}-email`}>
        {label}
      </label>
      <div className="fan-signup__row">
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          enterKeyHint="send"
          required
          maxLength={254}
          placeholder="Your email address"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setInvalidEmail(false);
            if (status !== "pending") {
              setStatus("idle");
              setMessage("");
            }
          }}
          disabled={status === "pending"}
          aria-invalid={invalidEmail || undefined}
          aria-describedby={`${id}-status`}
        />
        <button type="submit" disabled={status === "pending"}>
          <span>{status === "pending" ? "Joining…" : buttonLabel}</span>
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>
      </div>
      <div className="fan-signup__honeypot" aria-hidden="true">
        <label htmlFor={`${id}-website`}>Leave this field empty</label>
        <input id={`${id}-website`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p
        id={`${id}-status`}
        className={`fan-signup__message fan-signup__message--${status}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message || "Your email is used for JXXMAL music updates."}
      </p>
    </form>
  );
}
