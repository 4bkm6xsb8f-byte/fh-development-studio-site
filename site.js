const PAGE_EVENTS_URL = "https://app.fhdevelopmentstudio.com/api/public/page-events";
const INQUIRIES_URL = "https://app.fhdevelopmentstudio.com/api/public/inquiries";

function setStatus(form, message, isError) {
  const status = form.querySelector(".form-status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.toggle("is-error", Boolean(isError));
  status.classList.toggle("is-success", Boolean(message) && !isError);
}

function clearStatus(form) {
  setStatus(form, "", false);
}

function getFieldLabel(field) {
  const id = field.getAttribute("id");
  if (!id) {
    return field.getAttribute("name") || "This field";
  }

  const label = document.querySelector(`label[for="${id}"]`);
  return label ? label.textContent.trim() : field.getAttribute("name") || "This field";
}

function getValidationMessage(field) {
  const value = field.value.trim();

  if (field.required && !value) {
    return `${getFieldLabel(field)} is required.`;
  }

  if (field.type === "email" && value && !field.validity.valid) {
    return "Please enter a valid email address.";
  }

  return field.validationMessage || "";
}

function validateForm(form) {
  const fields = Array.from(form.querySelectorAll("input, select, textarea"));
  const messages = [];

  fields.forEach((field) => {
    field.setCustomValidity("");
    const message = getValidationMessage(field);
    if (message) {
      field.setCustomValidity(message);
      messages.push(message);
    }
  });

  if (!messages.length) {
    clearStatus(form);
    return true;
  }

  const firstInvalidField = fields.find((field) => !field.checkValidity());
  if (firstInvalidField) {
    firstInvalidField.reportValidity();
    firstInvalidField.focus();
  }

  setStatus(form, messages[0], true);
  return false;
}

function attachFieldValidation(form) {
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    const clearFieldError = () => {
      field.setCustomValidity("");
      if (form.querySelector(".form-status")?.classList.contains("is-error")) {
        clearStatus(form);
      }
    };

    field.addEventListener("input", clearFieldError);
    field.addEventListener("change", clearFieldError);
  });
}

async function submitFhInquiry(payload) {
  const response = await fetch(INQUIRIES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      submissionType: payload.submissionType || "sales",
      subject: payload.subject,
      details: payload.details,
      requesterName: payload.requesterName,
      requesterEmail: payload.requesterEmail,
      requesterPhone: payload.requesterPhone,
      priority: payload.priority || "medium",
      source: "www.fhdevelopmentstudio.com form",
      pagePath: window.location.pathname,
      pageTitle: document.title,
      channel: "marketing-site-intake",
      metadata: {
        href: window.location.href,
        formId: payload.formId || null,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "We could not send your submission right now. Please try again or email support@fhdevelopmentstudio.com.");
  }

  return data;
}

function buildInquiryPayload(form) {
  const data = new FormData(form);
  const inquiryType = (data.get("inquiry_type") || "").toString().trim();
  const normalizedType =
    inquiryType === "New Project"
      ? "new_project"
      : inquiryType === "Product Support"
        ? "support"
        : inquiryType === "Privacy Question"
          ? "support"
          : "sales";

  const company = (data.get("company") || "").toString().trim();
  const platform = (data.get("platform") || "").toString().trim();
  const timeline = (data.get("timeline") || "").toString().trim();
  const budget = (data.get("budget") || "").toString().trim();
  const goal = (data.get("goal") || "").toString().trim();

  const details = [
    `Inquiry type: ${inquiryType || "General Question"}`,
    `Company: ${company || "Not provided"}`,
    `Platforms or context: ${platform || "Not provided"}`,
    `Timing: ${timeline || "Not provided"}`,
    `Budget range: ${budget || "Not provided"}`,
    `Primary goal: ${goal || "Not provided"}`,
    "",
    "Message:",
    (data.get("message") || "").toString().trim(),
  ].join("\n");

  return {
    submissionType: normalizedType,
    subject: `FH Development Studio Inquiry: ${inquiryType || "General Question"}`,
    details,
    requesterName: (data.get("name") || "").toString().trim(),
    requesterEmail: (data.get("email") || "").toString().trim(),
    requesterPhone: undefined,
    priority: "medium",
    formId: form.id,
  };
}

function buildRequestPayload(form) {
  const data = new FormData(form);
  const requestType = (data.get("request_type") || "").toString().trim();
  const submissionType =
    requestType === "Bug Report"
      ? "bugfix"
      : requestType === "Feature Request"
        ? "feature_request"
        : requestType === "Support Request"
          ? "support"
          : "general";

  const product = (data.get("request_product") || "").toString().trim();
  const platform = (data.get("request_platform") || "").toString().trim();
  const priority = (data.get("request_priority") || "").toString().trim();
  const location = (data.get("request_location") || "").toString().trim();
  const occurredAt = (data.get("request_time") || "").toString().trim();
  const expected = (data.get("request_expected") || "").toString().trim();
  const actual = (data.get("request_actual") || "").toString().trim();

  const details = [
    `Submission type: ${requestType || "General Issue"}`,
    `Product or project: ${product || "Not provided"}`,
    `Platform or environment: ${platform || "Not provided"}`,
    `Priority: ${priority || "Medium"}`,
    `Page, screen, or area: ${location || "Not provided"}`,
    `When it happened: ${occurredAt || "Not provided"}`,
    "",
    "Steps or context:",
    (data.get("request_steps") || "").toString().trim(),
    "",
    "Expected result:",
    expected || "Not provided",
    "",
    "Actual result:",
    actual || "Not provided",
  ].join("\n");

  return {
    submissionType,
    subject: `${requestType || "General Issue"}: ${product || "Website Submission"}`,
    details,
    requesterName: (data.get("request_name") || "").toString().trim(),
    requesterEmail: (data.get("request_email") || "").toString().trim(),
    requesterPhone: undefined,
    priority: priority ? priority.toLowerCase() : "medium",
    formId: form.id,
  };
}

async function handleFormSubmit(form, buildPayload, successMessage) {
  if (!validateForm(form)) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const originalLabel = submitButton ? submitButton.textContent : "";

  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    setStatus(form, "Sending your submission to FH Development Studio...", false);

    await submitFhInquiry(buildPayload(form));

    setStatus(form, successMessage, false);
    form.reset();
  } catch (error) {
    setStatus(
      form,
      error instanceof Error ? error.message : "Something went wrong while sending your submission.",
      true,
    );
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  }
}

async function trackPageView() {
  if (window.location.protocol === "file:") {
    return;
  }

  try {
    await fetch(PAGE_EVENTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer || undefined,
        source: "www.fhdevelopmentstudio.com",
        eventType: "page_view",
        userAgent: navigator.userAgent,
        metadata: {
          href: window.location.href,
        },
      }),
    });
  } catch (error) {
    console.error("FH page tracking failed", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const inquiryForm = document.querySelector('[data-admin-form="inquiry"]');
  const requestForm = document.querySelector('[data-admin-form="request"]');

  if (inquiryForm) {
    attachFieldValidation(inquiryForm);
    inquiryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleFormSubmit(
        inquiryForm,
        buildInquiryPayload,
        "Your inquiry was sent successfully. FH Development Studio will review it and follow up soon.",
      );
    });
  }

  if (requestForm) {
    attachFieldValidation(requestForm);
    requestForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleFormSubmit(
        requestForm,
        buildRequestPayload,
        "Your request was submitted successfully. The FH Development Studio team can now review it in the admin workspace.",
      );
    });
  }
});

window.addEventListener("load", async () => {
  await trackPageView();
});
