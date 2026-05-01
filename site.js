const PAGE_EVENTS_URL = "https://app.fhdevelopmentstudio.com/api/public/page-events";
const INQUIRIES_URL = "https://app.fhdevelopmentstudio.com/api/public/inquiries";
const MOBILE_MENU_BREAKPOINT = 720;
const PHOTOS_STORAGE_KEY = "fhds-photo-groups-v1";
const PHOTO_MAX_EDGE = 1800;
const PHOTO_JPEG_QUALITY = 0.86;
const PHOTOS_MAX_PER_BATCH = 20;
const PHOTOS_MAX_SINGLE_SIZE = 12 * 1024 * 1024;
const PHOTOS_MAX_TOTAL_SIZE = 64 * 1024 * 1024;
const PHOTOS_MAX_GROUP_NAME_LENGTH = 190;

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

function setFieldInvalidState(field, isInvalid) {
  field.classList.toggle("is-invalid", Boolean(isInvalid));
}

function setupMobileMenu() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-mobile-nav]");

  if (!toggle || !nav) {
    return;
  }

  const closeMenu = () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
  };

  const openMenu = () => {
    toggle.setAttribute("aria-expanded", "true");
    nav.classList.add("is-open");
  };

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    if (expanded) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (window.innerWidth > MOBILE_MENU_BREAKPOINT) {
      return;
    }

    if (!nav.contains(event.target) && !toggle.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      toggle.focus();
    }
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > MOBILE_MENU_BREAKPOINT) {
      closeMenu();
    }
  });
}

function injectPhotosLinks() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll("[data-mobile-nav]").forEach((nav) => {
    if (nav.querySelector('a[href="photos.html"]')) {
      return;
    }

    const link = document.createElement("a");
    link.href = "photos.html";
    link.textContent = "Photos";

    if (currentPage === "photos.html") {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }

    const adminLink = nav.querySelector(".nav-admin");
    if (adminLink) {
      nav.insertBefore(link, adminLink);
    } else {
      nav.appendChild(link);
    }
  });

  document.querySelectorAll(".footer-links").forEach((footerLinks) => {
    if (footerLinks.querySelector('a[href="photos.html"]')) {
      return;
    }

    const link = document.createElement("a");
    link.href = "photos.html";
    link.textContent = "Photos";
    const supportLink = footerLinks.querySelector('a[href="support.html"]');

    if (supportLink) {
      footerLinks.insertBefore(link, supportLink);
    } else {
      footerLinks.appendChild(link);
    }
  });
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
    setFieldInvalidState(field, Boolean(message));
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
      setFieldInvalidState(field, false);
      if (form.querySelector(".form-status")?.classList.contains("is-error")) {
        clearStatus(form);
      }
    };

    field.addEventListener("input", clearFieldError);
    field.addEventListener("change", clearFieldError);
    field.addEventListener("blur", () => {
      const message = getValidationMessage(field);
      field.setCustomValidity(message || "");
      setFieldInvalidState(field, Boolean(message));
      if (message) {
        setStatus(form, message, true);
      }
    });
  });
}

async function submitFhInquiry(payload) {
  let response;

  try {
    response = await fetch(INQUIRIES_URL, {
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
  } catch (error) {
    throw new Error(
      "We could not reach the FH Development Studio intake service right now. Please try again in a moment or email support@fhdevelopmentstudio.com.",
    );
  }

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
    form.querySelectorAll("input, select, textarea").forEach((field) => {
      field.setCustomValidity("");
      setFieldInvalidState(field, false);
    });
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

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not process one of the selected images."));
    image.src = src;
  });
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  if (bytes >= 1024) {
    return Math.round(bytes / 1024) + " KB";
  }

  return bytes + " bytes";
}

function validatePhotoBatch(name, files) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "Please enter a group name before saving.";
  }

  if (trimmedName.length > PHOTOS_MAX_GROUP_NAME_LENGTH) {
    return "Group names must stay under " + PHOTOS_MAX_GROUP_NAME_LENGTH + " characters.";
  }

  if (!files.length) {
    return "Please choose one or more photos for this group.";
  }

  if (files.length > PHOTOS_MAX_PER_BATCH) {
    return "You can upload up to " + PHOTOS_MAX_PER_BATCH + " photos at a time.";
  }

  const oversizedFile = files.find((file) => file.size > PHOTOS_MAX_SINGLE_SIZE);
  if (oversizedFile) {
    return oversizedFile.name + " is too large. Each photo must be 12 MB or smaller.";
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > PHOTOS_MAX_TOTAL_SIZE) {
    return "This batch is too large at " + formatBytes(totalSize) + ". Keep grouped uploads at 64 MB or less.";
  }

  return "";
}

async function normalizePhoto(file) {
  const source = await readAsDataUrl(file);

  if (!file.type.startsWith("image/")) {
    return source;
  }

  const image = await loadImage(source);
  const longestEdge = Math.max(image.naturalWidth, image.naturalHeight);

  if (longestEdge <= PHOTO_MAX_EDGE && source.length < 1_800_000) {
    return source;
  }

  const scale = PHOTO_MAX_EDGE / longestEdge;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    return source;
  }

  context.drawImage(image, 0, 0, width, height);

  if (file.type === "image/png") {
    return canvas.toDataURL("image/png");
  }

  return canvas.toDataURL("image/jpeg", PHOTO_JPEG_QUALITY);
}

function loadPhotoGroups() {
  try {
    const raw = window.localStorage.getItem(PHOTOS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not load saved photo groups", error);
    return [];
  }
}

function savePhotoGroups(groups) {
  window.localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(groups));
}

function formatGroupDate(value) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value));
  } catch (error) {
    return value;
  }
}

function renderPhotoGroups(root, groups) {
  const list = root.querySelector("[data-photos-list]");
  const empty = root.querySelector("[data-photos-empty]");
  const summary = root.querySelector("[data-photos-summary]");

  if (!list || !empty || !summary) {
    return;
  }

  summary.innerHTML = groups.length
    ? `<strong>${groups.length}</strong><span>${groups.length === 1 ? "photo group saved" : "photo groups saved"}</span>`
    : `<strong>0</strong><span>No photo groups yet</span>`;

  empty.hidden = Boolean(groups.length);
  list.innerHTML = "";

  groups.forEach((group) => {
    const article = document.createElement("article");
    article.className = "photos-group-card";
    article.innerHTML = `
      <div class="photos-group-head">
        <div>
          <h4>${group.name}</h4>
          <div class="photos-group-meta">
            <span class="photos-group-pill">${group.photos.length} ${group.photos.length === 1 ? "photo" : "photos"}</span>
            <span class="photos-group-pill">Saved ${formatGroupDate(group.createdAt)}</span>
          </div>
        </div>
        <button type="button" class="photos-delete" data-delete-group="${group.id}">Delete group</button>
      </div>
      ${group.description ? `<p class="photos-group-description">${group.description}</p>` : ""}
      <div class="photos-grid">
        ${group.photos
          .map(
            (photo) => `
              <figure class="photos-frame">
                <img src="${photo.dataUrl}" alt="${photo.name}" loading="lazy" />
              </figure>
            `,
          )
          .join("")}
      </div>
    `;
    list.appendChild(article);
  });
}

function setupPhotoDeletes(root, groups, onChange) {
  root.querySelectorAll("[data-delete-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-delete-group");
      const nextGroups = groups.filter((group) => group.id !== id);
      savePhotoGroups(nextGroups);
      onChange(nextGroups);
    });
  });
}

function initPhotosPage() {
  const root = document.querySelector("[data-photos-page]");
  if (!root) {
    return;
  }

  const form = root.querySelector("[data-photos-form]");
  const status = root.querySelector("[data-photos-status]");

  if (!form || !status) {
    return;
  }

  const setPhotoStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
    status.classList.toggle("is-success", Boolean(message) && !isError);
  };

  const refresh = (groups) => {
    renderPhotoGroups(root, groups);
    setupPhotoDeletes(root, groups, refresh);
  };

  refresh(loadPhotoGroups());

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("group_name") || "").trim();
    const description = String(data.get("group_description") || "").trim();
    const fileInput = form.querySelector('input[name="group_photos"]');
    const files = Array.from(fileInput?.files || []);

    const batchValidationMessage = validatePhotoBatch(name, files);
    if (batchValidationMessage) {
      setPhotoStatus(batchValidationMessage, true);
      return;
    }

    try {
      setPhotoStatus("Saving photo group...");

      const photos = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          dataUrl: await normalizePhoto(file),
        })),
      );

      const groups = loadPhotoGroups();
      groups.unshift({
        id: `group-${Date.now()}`,
        name: name.slice(0, PHOTOS_MAX_GROUP_NAME_LENGTH),
        description,
        createdAt: new Date().toISOString(),
        photos,
      });

      savePhotoGroups(groups);
      refresh(groups);
      form.reset();
      setPhotoStatus("Photo group saved successfully.");
    } catch (error) {
      setPhotoStatus(
        error instanceof Error ? error.message : "Something went wrong while saving this photo group.",
        true,
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  injectPhotosLinks();
  setupMobileMenu();

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

  initPhotosPage();
});

window.addEventListener("load", async () => {
  await trackPageView();
});
