"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { fallbackContent } from "@/data/homepage-fallback";
import { submissionErrorMessage } from "@/lib/data/form-errors";
import { getPublicSiteSettings, submitLead } from "@/lib/data/public-data";

type FormState = "idle" | "submitting" | "success" | "error";

type InquiryDetails = {
  name: string;
  email: string;
  projectType: string;
  message: string;
};

export function LeadForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");
  const [inquiry, setInquiry] = useState<InquiryDetails | null>(null);
  const [contactEmail, setContactEmail] = useState(fallbackContent.settings.email);
  const [whatsapp, setWhatsapp] = useState(fallbackContent.settings.whatsapp ?? "");
  const [contactSettingsError, setContactSettingsError] = useState("");
  const submitButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (submitButton.current) {
      submitButton.current.disabled = state === "submitting";
    }
  }, [state]);

  useEffect(() => {
    let active = true;
    void getPublicSiteSettings()
      .then((settings) => {
        if (!active || !settings) return;
        setContactEmail(settings.email);
        setWhatsapp(settings.whatsapp || fallbackContent.settings.whatsapp || "");
      })
      .catch((error: unknown) => {
        console.error("Could not load contact channel settings.", error);
        if (active) {
          setContactSettingsError(
            "The latest contact settings could not be loaded. The email shown below uses the saved site fallback.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const submittedInquiry = {
      name: String(values.get("name") ?? ""),
      email: String(values.get("email") ?? ""),
      projectType: String(values.get("projectType") ?? ""),
      message: String(values.get("message") ?? ""),
    };
    setState("submitting");
    setMessage("");

    try {
      const result = await submitLead({
        ...submittedInquiry,
        website: String(values.get("website") ?? ""),
      });
      form.reset();
      setState("success");
      if (result.status === "submitted") setInquiry(submittedInquiry);
      setMessage(
        result.status === "ignored"
          ? "Thanks — your message has been received."
          : "Thanks for reaching out. We’ll be in touch soon.",
      );
    } catch (error) {
      setState("error");
      setMessage(submissionErrorMessage(error, "lead"));
    }
  };

  const messageBody = inquiry
    ? [
        "Hello Kitari Studio, I would like to discuss a project.",
        "",
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Service: ${inquiry.projectType}`,
        "",
        "Project details:",
        inquiry.message,
      ].join("\n")
    : "";
  const whatsappDigits = whatsapp.replace(/\D/g, "");
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(messageBody)}`
    : "";
  const gmailUrl = inquiry
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contactEmail)}&su=${encodeURIComponent(`Project inquiry — ${inquiry.name}`)}&body=${encodeURIComponent(messageBody)}`
    : "";

  return (
    <>
      <form className="lead-form" onSubmit={onSubmit}>
        <div className="lead-fields">
          <label>
            Your name
            <input
              autoComplete="name"
              maxLength={120}
              name="name"
              placeholder="Name"
              required
            />
          </label>
          <label>
            Email address
            <input
              autoComplete="email"
              maxLength={254}
              name="email"
              placeholder="you@example.com"
              required
              type="email"
            />
          </label>
          <label>
            What do you need?
            <select defaultValue="" name="projectType" required>
              <option disabled value="">
                Select a service
              </option>
              <option>Branding</option>
              <option>Website</option>
              <option>Mobile app</option>
              <option>SaaS dashboard</option>
              <option>Other</option>
            </select>
          </label>
          <label className="lead-message">
            Project details
            <textarea
              maxLength={4000}
              name="message"
              placeholder="Tell us a little about your idea"
              required
              rows={3}
            />
          </label>
          <label aria-hidden="true" className="form-honeypot" tabIndex={-1}>
            Leave this field empty
            <input autoComplete="off" name="website" tabIndex={-1} type="text" />
          </label>
        </div>
        <button className="lead-submit" disabled ref={submitButton} type="submit">
          {state === "submitting" ? "Sending…" : "Send project inquiry"}
        </button>
        <p
          aria-live="polite"
          className={`form-message ${state === "error" ? "is-error" : ""}`}
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
        {contactSettingsError && (
          <p className="form-message is-error" role="status">
            {contactSettingsError}
          </p>
        )}
      </form>
      {inquiry && (
        <div className="inquiry-dialog-backdrop">
          <section
            aria-labelledby="inquiry-dialog-title"
            aria-modal="true"
            className="inquiry-dialog"
            onKeyDown={(event) => {
              if (event.key === "Escape") setInquiry(null);
            }}
            role="dialog"
          >
            <button
              aria-label="Close send options"
              className="inquiry-dialog-close"
              onClick={() => setInquiry(null)}
              type="button"
            >
              ×
            </button>
            <p className="eyebrow">INQUIRY READY</p>
            <h2 id="inquiry-dialog-title">Choose where to send your project inquiry.</h2>
            <p>Your details are already formatted. Choose a channel and send.</p>
            <div className="inquiry-dialog-actions">
              {whatsappUrl ? (
                <a
                  className="lead-submit"
                  href={whatsappUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Send with WhatsApp <span aria-hidden="true">↗</span>
                </a>
              ) : (
                <button className="lead-submit" disabled type="button">
                  WhatsApp number not configured
                </button>
              )}
              <a
                className="lead-submit inquiry-dialog-gmail"
                href={gmailUrl}
                rel="noreferrer"
                target="_blank"
              >
                Send with Gmail <span aria-hidden="true">↗</span>
              </a>
            </div>
            <p className="inquiry-dialog-note">
              Gmail opens with your project details ready. Review the draft, then press
              Send.
            </p>
            <button
              className="inquiry-dialog-done"
              onClick={() => setInquiry(null)}
              type="button"
            >
              Done
            </button>
          </section>
        </div>
      )}
    </>
  );
}
