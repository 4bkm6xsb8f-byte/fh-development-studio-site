document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const form = document.querySelector("[data-mailto-form]");
  if (!form) {
    return;
  }

  const status = form.querySelector(".form-status");

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      if (status) {
        status.textContent = "Please complete the required fields before continuing.";
      }
      return;
    }

    const data = new FormData(form);
    const entries = {
      name: (data.get("name") || "").toString().trim(),
      email: (data.get("email") || "").toString().trim(),
      company: (data.get("company") || "").toString().trim(),
      inquiryType: (data.get("inquiry_type") || "").toString().trim(),
      platform: (data.get("platform") || "").toString().trim(),
      timeline: (data.get("timeline") || "").toString().trim(),
      budget: (data.get("budget") || "").toString().trim(),
      goal: (data.get("goal") || "").toString().trim(),
      message: (data.get("message") || "").toString().trim()
    };

    const lines = [
      `Name: ${entries.name}`,
      `Email: ${entries.email}`,
      `Company: ${entries.company || "Not provided"}`,
      `Inquiry Type: ${entries.inquiryType || "Not provided"}`,
      `Platforms or Context: ${entries.platform || "Not provided"}`,
      `Timing: ${entries.timeline || "Not provided"}`,
      `Budget Range: ${entries.budget || "Not provided"}`,
      `Primary Goal: ${entries.goal || "Not provided"}`,
      "",
      "Message:",
      entries.message
    ];

    const subject = encodeURIComponent(`FH Development Studio Inquiry: ${entries.inquiryType || "New Inquiry"}`);
    const body = encodeURIComponent(lines.join("\n"));

    if (status) {
      status.textContent = "Opening your email app with a prefilled inquiry draft.";
    }

    window.location.href = `mailto:support@fhdevelopmentstudio.com?subject=${subject}&body=${body}`;
  });
});
