"use client";

import { useState, type FormEvent } from "react";
import { fallbackContent } from "@/data/homepage-fallback";
import type { SiteSettings } from "@/lib/data/schemas";
import { submissionErrorMessage } from "@/lib/data/form-errors";
import { subscribeToNewsletter } from "@/lib/data/public-data";

type FormState = "idle" | "submitting" | "success" | "error";

export function NewsletterForm({ settings }: { settings: SiteSettings }) {
  const [state, setState] = useState<FormState>("idle");
  const [responseMessage, setResponseMessage] = useState("");
  const message =
    state === "idle"
      ? (settings.homeFooterNewsletterPolicy ??
        fallbackContent.settings.homeFooterNewsletterPolicy)
      : responseMessage;

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;
    const form = event.currentTarget;
    const values = new FormData(form);
    setState("submitting");
    setResponseMessage("");

    try {
      await subscribeToNewsletter({
        email: String(values.get("email") ?? ""),
        website: String(values.get("website") ?? ""),
      });
      form.reset();
      setState("success");
      setResponseMessage(
        settings.homeFooterNewsletterSuccess ??
          fallbackContent.settings.homeFooterNewsletterSuccess ??
          "Thanks for subscribing.",
      );
    } catch (error) {
      setState("error");
      setResponseMessage(submissionErrorMessage(error, "newsletter"));
    }
  };

  return (
    <>
      <form id="nl" onSubmit={onSubmit}>
        <input
          aria-label={
            settings.homeFooterEmailLabel ?? fallbackContent.settings.homeFooterEmailLabel
          }
          autoComplete="email"
          maxLength={254}
          name="email"
          placeholder={
            settings.homeFooterEmailPlaceholder ??
            fallbackContent.settings.homeFooterEmailPlaceholder
          }
          required
          type="email"
        />
        <label aria-hidden="true" className="form-honeypot" tabIndex={-1}>
          Leave this field empty
          <input autoComplete="off" name="website" tabIndex={-1} type="text" />
        </label>
        <button
          aria-label={
            settings.homeFooterSubscribeLabel ??
            fallbackContent.settings.homeFooterSubscribeLabel
          }
          disabled={state === "submitting"}
          type="submit"
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="20"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 20 20"
            width="20"
          >
            <path d="M6 14 14 6M7 6h7v7" />
          </svg>
        </button>
      </form>
      <small
        aria-live="polite"
        className={state === "success" ? "ok" : state === "error" ? "error" : ""}
        id="nlm"
        role={state === "error" ? "alert" : "status"}
      >
        {message}
      </small>
    </>
  );
}
