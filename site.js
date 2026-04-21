const ADMIN_API_BASE = "https://app.fhdevelopmentstudio.com/api/public";

function setStatus(form, message, isError) {
  const status = form.querySelector(".form-status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.style.color = isError ? "#b42828" : "";
}

function normalizeCurrentPath() {
  if (window.location.protocol === "file:") {
    return null;
  }

  return `${window.location.pathname}${window.location.search}`;
}

async function postJson(url, payload, keepalive = false) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || "Submission failed.");
  }

  return data;
}

function buildInquiryPayload(form) {
  const data = new FormData(form);
  const inquiryType = (data.get("inquiry_type") || "").toString().trim();
  const normalizedType =
    inquiryType === "New Project"
      ? "sales"
      : inquiryType === "Product Support"
        ? "support"
        : "general";

  const metadata = {
    company: (data.get("company") || "").toString().trim(),
    platform: (data.get("platform") || "").toString().trim(),
    timeline: (data.get("timeline") || "").toString().trim(),
    budget: (data.get("budget") || "").toString().trim(),
    goal: (data.get("goal") || "").toString().trim(),
    inquiryType,
    pageUrl: window.location.href,
    formId: form.id,
  };

  const details = [
    `Inquiry type: ${inquiryType || "General Question"}`,
    `Company: ${metadata.company || "Not provided"}`,
    `Platforms or context: ${metadata.platform || "Not provided"}`,
    `Timing: ${metadata.timeline || "Not provided"}`,
    `Budget range: ${metadata.budget || "Not provided"}`,
    `Primary goal: ${metadata.goal || "Not provided"}`,
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
    source: "www.fhdevelopmentstudio.com",
    pagePath: normalizeCurrentPath(),
    pageTitle: document.title,
    channel: "website-sales-support",
    metadata,
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

  const metadata = {
    requestType,
    product: (data.get("request_product") || "").toString().trim(),
    platform: (data.get("request_platform") || "").toString().trim(),
    priority: (data.get("request_priority") || "").toString().trim(),
    location: (data.get("request_location") || "").toString().trim(),
    occurredAt: (data.get("request_time") || "").toString().trim(),
    expected: (data.get("request_expected") || "").toString().trim(),
    actual: (data.get("request_actual") || "").toString().trim(),
    pageUrl: window.location.href,
    formId: form.id,
  };

  const details = [
    `Submission type: ${requestType || "General Issue"}`,
    `Product or project: ${metadata.product || "Not provided"}`,
    `Platform or environment: ${metadata.platform || "Not provided"}`,
    `Priority: ${metadata.priority || "Medium"}`,
    `Page, screen, or area: ${metadata.location || "Not provided"}`,
    `When it happened: ${metadata.occurredAt || "Not provided"}`,
    "",
    "Steps or context:",
    (data.get("request_steps") || "").toString().trim(),
    "",
    "Expected result:",
    metadata.expected || "Not provided",
    "",
    "Actual result:",
    metadata.actual || "Not provided",
  ].join("\n");

  return {
    submissionType,
    subject: `${requestType || "General Issue"}: ${metadata.product || "Website Submission"}`,
    details,
    requesterName: (data.get("request_name") || "").toString().trim(),
    requesterEmail: (data.get("request_email") || "").toString().trim(),
    priority: metadata.priority,
    source: "www.fhdevelopmentstudio.com",
    pagePath: normalizeCurrentPath(),
    pageTitle: document.title,
    channel: "website-requests",
    metadata,
  };
}

async function handleFormSubmit(form, buildPayload, successMessage) {
  if (!form.reportValidity()) {
    setStatus(form, "Please complete the required fields before continuing.", true);
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

    await postJson(`${ADMIN_API_BASE}/inquiries`, buildPayload(form));

    setStatus(form, successMessage, false);
    form.reset();

    if (window.location.protocol !== "file:") {
      await postJson(
        `${ADMIN_API_BASE}/page-events`,
        {
          path: normalizeCurrentPath(),
          title: document.title,
          source: "www.fhdevelopmentstudio.com",
          eventType: "form_submit",
          referrer: document.referrer || "",
          userAgent: navigator.userAgent,
          metadata: { formId: form.id },
        },
        true,
      );
    }
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
  const path = normalizeCurrentPath();

  if (!path) {
    return;
  }

  try {
    await postJson(
      `${ADMIN_API_BASE}/page-events`,
      {
        path,
        title: document.title,
        source: "www.fhdevelopmentstudio.com",
        eventType: "page_view",
        referrer: document.referrer || "",
        userAgent: navigator.userAgent,
      },
      true,
    );
  } catch (_error) {
    // Silent fail to avoid disrupting the public site experience.
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const inquiryForm = document.querySelector('[data-admin-form="inquiry"]');
  const requestForm = document.querySelector('[data-admin-form="request"]');

  if (inquiryForm) {
    inquiryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleFormSubmit(
        inquiryForm,
        buildInquiryPayload,
        "Your inquiry was sent successfully. FH Development Studio will review it shortly.",
      );
    });
  }

  if (requestForm) {
    requestForm.addEventListener("submit", (event) => {
      event.preventDefault();
      handleFormSubmit(
        requestForm,
        buildRequestPayload,
        "Your request was submitted successfully. The team can now review it in the admin workspace.",
      );
    });
  }

  trackPageView();
});
