function resolveApiBase() {
  const script = document.querySelector('script[src*="assets/js/main.js"]');

  if (script?.src) {
    try {
      const srcUrl = new URL(script.src, window.location.href);
      const suffix = "/public/assets/js/main.js";
      if (srcUrl.pathname.endsWith(suffix)) {
        const basePath = srcUrl.pathname.slice(0, -suffix.length);
        return `${basePath}/api`;
      }
    } catch (error) {
      // Fall back to pathname-based resolution below.
    }
  }

  const marker = "/public/";
  const idx = window.location.pathname.indexOf(marker);
  if (idx >= 0) {
    return `${window.location.pathname.slice(0, idx)}/api`;
  }

  return "../api";
}

const API_BASE = resolveApiBase();
const PUBLIC_BASE = API_BASE.replace(/\/api$/, "/public");

const qs = (selector) => document.querySelector(selector);
let toastRoot = null;
let currentPublicationId = 0;
let currentPublicationTitle = "";
let programState = [];
let involvementState = [];
let resourceState = [];

/* Menu toggle setup is handled in setupMenu() for all page variants */

function showToast(message, type = "info") {
  if (!message) return;

  if (!toastRoot) {
    toastRoot = document.createElement("div");
    toastRoot.className = "toast-root";
    toastRoot.setAttribute("aria-live", "polite");
    toastRoot.setAttribute("aria-atomic", "true");
    document.body.appendChild(toastRoot);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = String(message);
  toastRoot.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  window.setTimeout(() => {
    toast.classList.remove("show");
    window.setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3400);
}

const createCardMarkup = ({ title, description, tag }) => `
  <article class="card reveal">
    <span class="tag">${tag ?? "Item"}</span>
    <h3>${title}</h3>
    <p>${description}</p>
    <a class="link" href="contact.html">Learn More</a>
  </article>
`;

const createFellowshipCardMarkup = ({ title, description, tag, category }) => `
  <article class="card fellowship-card reveal" data-fellowship-category="${category ?? "other"}" data-fellowship-tag="${String(tag ?? "").toLowerCase()}">
    <span class="tag">${tag ?? "Track"}</span>
    <h3>${title}</h3>
    <p>${description}</p>
    ${
      document.body?.dataset?.page === "fellowship"
        ? `<a class="link fellowship-apply-link" href="#fellowship-apply" data-track="${escapeHtml(String(title ?? ""))}">Apply to This Track</a>`
        : `<a class="link" href="fellowship.html#fellowship-apply">View Fellowship Track</a>`
    }
  </article>
`;

const createPublicationCardMarkup = ({ id, slug, title, description, tag, image_path: imagePath }) => `
  <article class="card reveal publication-card">
    <div class="publication-cover">
      ${
        imagePath
          ? `<img src="${imagePath}" alt="${title}" loading="lazy" />`
          : `<div class="publication-cover-fallback" aria-hidden="true"></div>`
      }
    </div>
    <span class="tag">${tag ?? "Publication"}</span>
    <h3>${title}</h3>
    <p>${description}</p>
    <a class="link" href="${getPublicationUrl({ id, slug })}">Read More</a>
  </article>
`;

const createProgramCardMarkup = ({ title, description, tag }) => `
  <article class="card reveal program-card">
    <span class="tag">${tag ?? "Program"}</span>
    <h3>${title}</h3>
    <p>${description}</p>
    ${
      document.body?.dataset?.page === "programs"
        ? `<button class="link program-open-link" type="button">View Details</button>`
        : `<a class="link" href="programs.html#program-portfolio">Explore Program</a>`
    }
  </article>
`;

const createInvolvementCardMarkup = ({ title, description, tag, category }) => `
  <article class="card reveal involvement-card"
    data-involvement-title="${escapeHtml(String(title ?? ""))}"
    data-involvement-description="${escapeHtml(String(description ?? ""))}"
    data-involvement-tag="${escapeHtml(String(tag ?? "Get Involved"))}"
    data-involvement-category="${escapeHtml(String(category ?? "other"))}">
    <span class="tag">${tag ?? "Get Involved"}</span>
    <h3>${title}</h3>
    <p>${description}</p>
    <div class="involvement-card-actions">
      ${
        document.body?.dataset?.page === "involved"
          ? `<button class="link involvement-open-link" type="button">View Details</button>
      <a class="link involvement-interest-link" href="#involvement-inquiry" data-involvement-area="${escapeHtml(String(title ?? ""))}">Express Interest</a>`
          : `<a class="link" href="involved.html#involvement-inquiry">Express Interest</a>`
      }
    </div>
  </article>
`;

const createResourceCardMarkup = ({ id, title, description, tag, category }) => `
  <article class="card reveal resource-card"
    data-resource-id="${escapeHtml(String(id ?? ""))}"
    data-resource-title="${escapeHtml(String(title ?? ""))}"
    data-resource-description="${escapeHtml(String(description ?? ""))}"
    data-resource-tag="${escapeHtml(String(tag ?? "Resource"))}"
    data-resource-category="${escapeHtml(String(category ?? "other"))}">
    <span class="tag">${tag ?? "Resource"}</span>
    <h3>${title}</h3>
    <p>${description}</p>
    ${
      document.body?.dataset?.page === "resources"
        ? `<button class="link resource-open-link" type="button">Read Resource</button>`
        : `<a class="link" href="resources.html#resources-grid">View Resource</a>`
    }
  </article>
`;

function normalizePublicationImagePath(imagePath) {
  const raw = String(imagePath || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  return `${PUBLIC_BASE}/${raw.replace(/^\.?\//, "")}`;
}

function getPublicationUrl({ id, slug }) {
  const normalizedSlug = String(slug || "").trim();
  if (normalizedSlug) {
    return `${PUBLIC_BASE}/publication/${encodeURIComponent(normalizedSlug)}`;
  }

  return `${PUBLIC_BASE}/publication-post.html?id=${encodeURIComponent(String(id ?? ""))}`;
}

function getPublicationSlugFromPath() {
  const match = window.location.pathname.match(/\/publication\/([^/?#]+)\/?$/i);
  if (!match) return "";

  const slug = decodeURIComponent(match[1] || "").trim();
  return slug === "index.html" ? "" : slug;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderFeaturedPublication(item) {
  const target = qs("#featured-publication");
  if (!target) return;

  if (!item) {
    target.innerHTML = `
      <div class="blog-feature-media" aria-hidden="true"></div>
      <div class="blog-feature-copy">
        <span class="blog-chip">Featured</span>
        <h2>No Publications Yet</h2>
        <p>Upload your first publication with an image and it will appear here.</p>
        <a href="#publication-upload-form" class="link">Upload Publication</a>
      </div>
    `;
    return;
  }

  const imagePath = normalizePublicationImagePath(item.image_path);

  target.innerHTML = `
    <div class="blog-feature-media" aria-hidden="true" style="background-image: linear-gradient(to top, rgba(26, 58, 82, 0.55), rgba(26, 58, 82, 0.1)), url('${imagePath}'); background-size: cover; background-position: center;"></div>
    <div class="blog-feature-copy">
      <span class="blog-chip">Featured</span>
      <h2>${item.title}</h2>
      <p>${item.description}</p>
      <a href="${getPublicationUrl(item)}" class="link">Read Full Post</a>
    </div>
  `;
}

async function setupPublicationPostPage() {
  if (document.body.dataset.page !== "publication-post") return;

  const params = new URLSearchParams(window.location.search);
  const slug = String(params.get("slug") || getPublicationSlugFromPath()).trim();
  const id = Number(params.get("id") || "0");

  const titleEl = qs("#publication-post-title");
  const tagEl = qs("#publication-post-tag");
  const dateEl = qs("#publication-post-date");
  const imageEl = qs("#publication-post-image");
  const bodyEl = qs("#publication-post-body");
  const statusEl = qs("#publication-post-status");
  const shareNativeBtn = qs("#share-native-btn");
  const shareCopyBtn = qs("#share-copy-btn");
  const shareWhatsAppBtn = qs("#share-whatsapp-btn");
  const shareXBtn = qs("#share-x-btn");

  if (!titleEl || !tagEl || !dateEl || !imageEl || !bodyEl || !statusEl) return;

  if (!slug && (!id || Number.isNaN(id))) {
    statusEl.textContent = "Invalid publication link.";
    return;
  }

  statusEl.textContent = "Loading publication...";

  try {
    const lookup = slug
      ? `slug=${encodeURIComponent(slug)}`
      : `id=${encodeURIComponent(String(id))}`;

    const response = await fetch(`${API_BASE}/publications.php?${lookup}`, {
      headers: { Accept: "application/json" },
    });

    const json = await response.json();

    if (!response.ok || !json?.success || !json?.data) {
      throw new Error(json?.message || "Unable to load publication");
    }

    const item = json.data;
    const imagePath = normalizePublicationImagePath(item.image_path);
    currentPublicationId = Number(item.id || 0);
    currentPublicationTitle = String(item.title || "Publication");
    document.title = `${currentPublicationTitle} | YDNEA`;

    titleEl.textContent = item.title || "Untitled Publication";
    tagEl.textContent = item.tag || "Publication";
    dateEl.textContent = item.created_at ? new Date(item.created_at).toLocaleDateString() : "";
    bodyEl.textContent = item.description || "";

    if (imagePath) {
      imageEl.src = imagePath;
      imageEl.alt = item.title || "Publication image";
      imageEl.style.display = "block";
    } else {
      imageEl.style.display = "none";
    }

    statusEl.textContent = "";

    const canonicalPath = getPublicationUrl(item);
    const canonicalUrl = new URL(canonicalPath, window.location.origin);
    const currentUrl = new URL(window.location.href);

    if (currentUrl.pathname !== canonicalUrl.pathname || currentUrl.search) {
      window.history.replaceState({}, "", canonicalUrl.pathname);
    }

    const pageUrl = canonicalUrl.href;
    const shareText = `${currentPublicationTitle} - YDNEA`;

    if (shareWhatsAppBtn) {
      shareWhatsAppBtn.href = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`;
    }

    if (shareXBtn) {
      shareXBtn.href = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`;
    }

    if (shareCopyBtn) {
      shareCopyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pageUrl);
          showToast("Link copied to clipboard.", "success");
        } catch (error) {
          showToast("Unable to copy link.", "error");
        }
      });
    }

    if (shareNativeBtn) {
      shareNativeBtn.addEventListener("click", async () => {
        if (!navigator.share) {
          showToast("Native sharing is not supported on this browser.", "info");
          return;
        }

        try {
          await navigator.share({
            title: currentPublicationTitle,
            text: shareText,
            url: pageUrl,
          });
        } catch (error) {
          if (error?.name !== "AbortError") {
            showToast("Unable to share post.", "error");
          }
        }
      });
    }

    await loadPublicationComments(currentPublicationId);
    setupPublicationCommentForm();
  } catch (error) {
    statusEl.textContent = error.message || "Failed to load publication.";
  }
}

async function loadPublicationComments(publicationId) {
  const list = qs("#publication-comments-list");
  if (!list) return;

  list.innerHTML = `<p class="text-small">Loading comments...</p>`;

  try {
    const response = await fetch(`${API_BASE}/publication_comments.php?publication_id=${encodeURIComponent(String(publicationId))}`, {
      headers: { Accept: "application/json" },
    });

    const json = await response.json();

    if (!response.ok || !json?.success || !Array.isArray(json.data)) {
      throw new Error(json?.message || "Unable to load comments");
    }

    if (!json.data.length) {
      list.innerHTML = `<p class="text-small">No comments yet. Be the first to comment.</p>`;
      return;
    }

    list.innerHTML = json.data
      .map((item) => {
        const name = escapeHtml(item.name || "Anonymous");
        const comment = escapeHtml(item.comment || "");
        const created = escapeHtml(item.created_at ? new Date(item.created_at).toLocaleString() : "");
        return `
          <article class="publication-comment-item">
            <header>
              <strong>${name}</strong>
              <span>${created}</span>
            </header>
            <p>${comment}</p>
          </article>
        `;
      })
      .join("");
  } catch (error) {
    list.innerHTML = `<p class="text-small">Unable to load comments.</p>`;
  }
}

function setupPublicationCommentForm() {
  if (document.body.dataset.page !== "publication-post") return;

  const form = qs("#publication-comment-form");
  const status = qs("#publication-comment-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Posting comment...";
    status.className = "form-status";

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const comment = String(formData.get("comment") || "").trim();

    if (!currentPublicationId || !name || !email || comment.length < 3) {
      const msg = "Please complete all comment fields.";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/publication_comments.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          publication_id: currentPublicationId,
          name,
          email,
          comment,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json?.success) {
        const firstError = json?.errors ? Object.values(json.errors)[0] : json?.message;
        throw new Error(firstError || "Unable to post comment");
      }

      form.reset();
      status.textContent = "Comment posted successfully.";
      status.className = "form-status success";
      showToast("Comment posted successfully.", "success");
      await loadPublicationComments(currentPublicationId);
      setupReveal();
    } catch (error) {
      const msg = error?.message || "Unable to post comment.";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
    }
  });
}

async function fetchJSON(endpoint) {
  const response = await fetch(`${API_BASE}/${endpoint}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function renderCards(endpoint, targetSelector, fallbackData = []) {
  const target = qs(targetSelector);
  if (!target) return;

  let data = fallbackData;

  try {
    const json = await fetchJSON(endpoint);
    if (Array.isArray(json?.data)) {
      data = json.data;
    }
  } catch (error) {
    console.error(`Error loading ${endpoint}:`, error);
  }

  target.innerHTML = data.map(createCardMarkup).join("");
}

async function renderPublications() {
  const target = qs("#publications-grid");
  if (!target) return;

  let data = [];

  try {
    const json = await fetchJSON("publications.php");
    if (Array.isArray(json?.data)) {
      data = json.data;
    }
  } catch (error) {
    console.error("Error loading publications:", error);
  }

  const withImages = data
    .map((item) => ({
      ...item,
      image_path: normalizePublicationImagePath(item.image_path),
    }))
    .filter((item) => item.image_path);

  const [featured, ...rest] = withImages;
  renderFeaturedPublication(featured || null);

  if (!rest.length) {
    target.innerHTML = `
      <article class="card publication-card reveal">
        <span class="tag">Publications</span>
        <h3>No Additional Publications Yet</h3>
        <p>Upload more publications with images to see them listed here.</p>
      </article>
    `;
    return;
  }

  target.innerHTML = rest.map(createPublicationCardMarkup).join("");
}

async function renderPrograms() {
  const target = qs("#programs-grid");
  if (!target) return;

  const fallback = [
    {
      title: "Leadership & Civic Engagement",
      description:
        "Equipping youth with leadership skills to actively participate in governance, decision-making, and community development initiatives.",
      tag: "Leadership",
    },
    {
      title: "Entrepreneurship & Economic Empowerment",
      description:
        "Providing training, mentorship, and resources to help young people start businesses, secure employment, and achieve financial independence.",
      tag: "Entrepreneurship",
    },
    {
      title: "Education & Skills Development",
      description:
        "Enhancing access to practical education, vocational training, and digital skills for success in a modern economy.",
      tag: "Education",
    },
    {
      title: "Youth Advocacy & Policy Influence",
      description:
        "Promoting youth-inclusive policies and engaging in regional and national dialogues to ensure youth voices are heard.",
      tag: "Advocacy",
    },
    {
      title: "Community Resilience & Social Change",
      description:
        "Supporting initiatives that strengthen communities through social cohesion, mental health awareness, environmental sustainability, and innovation.",
      tag: "Resilience",
    },
  ];

  const data = fallback;

  programState = data.map((item) => ({
    ...item,
    category: mapProgramCategory(item.title || ""),
  }));

  target.innerHTML = programState.map(createProgramCardMarkup).join("");
}

async function renderInvolvement() {
  const target = qs("#involved-grid");
  if (!target) return;

  const fallback = [
    {
      title: "Young Leaders",
      description: "We welcome youth leaders ready to shape solutions and drive community development.",
      tag: "Join Us",
    },
    {
      title: "Partners",
      description: "Collaborate with us as an institution, development partner, or private-sector stakeholder.",
      tag: "Join Us",
    },
    {
      title: "Volunteers",
      description: "Contribute your time, skills, and energy to youth-led programs across East Africa.",
      tag: "Join Us",
    },
    {
      title: "Supporters",
      description: "Support our mission to help the next generation Dare to Dream and Dare to Achieve.",
      tag: "Join Us",
    },
  ];

  const data = fallback;

  involvementState = data.map((item) => ({
    ...item,
    category: mapInvolvementCategory(item),
  }));

  target.innerHTML = involvementState.map(createInvolvementCardMarkup).join("");
}

function mapInvolvementCategory({ title = "", tag = "", description = "" }) {
  const combined = `${title} ${tag} ${description}`.toLowerCase();
  if (combined.includes("volunteer")) return "volunteer";
  if (combined.includes("partner")) return "partner";
  if (combined.includes("donate") || combined.includes("support") || combined.includes("fund")) return "support";
  if (combined.includes("member") || combined.includes("membership")) return "member";
  return "other";
}

function mapResourceCategory({ title = "", tag = "", description = "" }) {
  const combined = `${title} ${tag} ${description}`.toLowerCase();
  if (combined.includes("news") || combined.includes("update") || combined.includes("announcement")) return "news";
  if (combined.includes("guide") || combined.includes("toolkit") || combined.includes("manual")) return "guides";
  if (combined.includes("story") || combined.includes("success") || combined.includes("impact")) return "stories";
  return "other";
}

async function renderResources() {
  const target = qs("#resources-grid");
  if (!target) return;

  const fallback = [
    {
      id: "fallback-1",
      title: "Youth Program Milestones 2026",
      description: "A quick overview of delivery milestones, district-level progress, and partnerships.",
      tag: "News",
      category: "news",
    },
    {
      id: "fallback-2",
      title: "Youth Leadership Practical Guide",
      description: "A practical guide with facilitation tools for clubs, schools, and community groups.",
      tag: "Guide",
      category: "guides",
    },
    {
      id: "fallback-3",
      title: "Community Success Story Collection",
      description: "Stories from youth-led projects delivering measurable local outcomes.",
      tag: "Story",
      category: "stories",
    },
  ];

  let data = fallback;

  try {
    const json = await fetchJSON("resources.php");
    if (Array.isArray(json?.data) && json.data.length) {
      data = json.data.map((item) => ({
        ...item,
        category: mapResourceCategory(item),
      }));
    }
  } catch (error) {
    console.error("Error loading resources:", error);
  }

  resourceState = data.map((item) => ({
    ...item,
    category: item.category || mapResourceCategory(item),
  }));

  target.innerHTML = resourceState.map(createResourceCardMarkup).join("");
}

function mapFellowshipCategory({ title = "", tag = "" }) {
  const combined = `${title} ${tag}`.toLowerCase();
  if (combined.includes("education") || combined.includes("skills")) return "education";
  if (combined.includes("health")) return "health";
  if (
    combined.includes("entrepreneur") ||
    combined.includes("innovation") ||
    combined.includes("enterprise") ||
    combined.includes("business")
  ) {
    return "entrepreneurship";
  }
  if (combined.includes("leadership") || combined.includes("governance")) return "leadership";
  return "other";
}

async function renderFellowshipCards() {
  const target = qs("#fellowship-grid");
  if (!target) return;

  const fallback = [
    {
      title: "Leadership and Governance Fellowship",
      description: "Build practical leadership competencies and policy engagement skills.",
      tag: "Leadership",
    },
    {
      title: "Education and Skills Fellowship",
      description: "Support learning innovation and youth employability programming.",
      tag: "Education",
    },
    {
      title: "Health and Wellbeing Fellowship",
      description: "Advance youth-centered health awareness and community wellbeing initiatives.",
      tag: "Health",
    },
    {
      title: "Enterprise and Innovation Fellowship",
      description: "Develop entrepreneurial thinking and project implementation capabilities.",
      tag: "Entrepreneurship",
    },
  ];

  let data = fallback;

  try {
    const json = await fetchJSON("fellowships.php");
    if (Array.isArray(json?.data) && json.data.length) {
      data = json.data;
    }
  } catch (error) {
    console.error("Error loading fellowships:", error);
  }

  target.innerHTML = data
    .map((item) => ({
      ...item,
      category: mapFellowshipCategory(item),
    }))
    .map(createFellowshipCardMarkup)
    .join("");
}

async function renderStats() {
  const target = qs("#hero-stats");
  if (!target) return;

  const fallback = [
    { value: "Dec 2025", label: "Founded" },
    { value: "6", label: "EAC Countries" },
    { value: "5", label: "Program Areas" },
    { value: "5", label: "Core Values" },
  ];

  const data = fallback;

  target.innerHTML = data
    .map(
      (item) => `
      <article class="stat-card reveal">
        <p class="stat-value">${item.value}</p>
        <p class="stat-label">${item.label}</p>
      </article>
    `
    )
    .join("");
}

async function renderContactDetails() {
  const target = qs("#contact-details");
  if (!target) return;

  const fallback = {
    email: "ydn.eastafrica@gmail.com",
    phone: "",
    location: "Kibaha, Pwani, Tanzania",
    hours: "Dar es Salaam, Tanzania",
  };

  const data = fallback;

  target.innerHTML = `
    <ul class="contact-list reveal">
      <li>
        <strong>Email</strong>
        <a href="mailto:${data.email}">${data.email}</a>
      </li>
      <li>
        <strong>Headquarters - HQ Office</strong>
        <span>${data.location || "Kibaha, Pwani, Tanzania"}</span>
      </li>
      <li>
        <strong>Main Office</strong>
        <span>${data.hours || "Dar es Salaam, Tanzania"}</span>
      </li>
    </ul>
  `;
}

function setupMenu() {
  const toggle = qs("#hamburger") || qs("#menu-toggle");
  const menu = qs("#navMenu") || qs("#nav-links");
  const links = document.querySelectorAll(".nav-item, .nav-links a");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isActive = menu.classList.toggle("active");
    toggle.setAttribute("aria-expanded", String(isActive));
  });

  links.forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupCurrentPageHighlight() {
  const page = document.body.dataset.page;
  if (!page) return;

  document.querySelectorAll(".nav-item, .nav-links a").forEach((item) => {
    const itemPage = item.dataset.page;
    if (!itemPage) return;
    item.classList.toggle("active", itemPage === page);
  });
}

function setupSectionNavHighlight() {
  // Highlight nav items based on scroll position
  const sections = document.querySelectorAll("section[id]");
  const navItems = document.querySelectorAll(".nav-item");
  const hashLinks = Array.from(navItems).filter((item) => item.getAttribute("href")?.startsWith("#"));

  if (!sections.length || !hashLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          hashLinks.forEach((item) => {
            item.classList.remove("active");
            if (item.getAttribute("href") === `#${entry.target.id}`) {
              item.classList.add("active");
            }
          });
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal, .info-card");
  if (!items.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -10% 0px" }
  );

  items.forEach((item, i) => {
    item.classList.add("reveal");
    item.style.transitionDelay = `${Math.min(i * 45, 320)}ms`;
    observer.observe(item);
  });
}

function setupContactForm() {
  const form = qs("#contact-form");
  const status = qs("#form-status");

  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Sending message...";
    status.className = "form-status";

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    try {
      const response = await fetch(`${API_BASE}/messages.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const firstError = json?.errors ? Object.values(json.errors)[0] : json?.message;
        throw new Error(firstError || "Unable to send your message");
      }

      form.reset();
      status.textContent = "Message sent successfully. We will get back to you soon.";
      status.className = "form-status success";
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-status error";
    }
  });
}

function setupHomeContactForm() {
  if (document.body.dataset.page !== "home") return;

  const form = qs("#home-contact-form");
  const status = qs("#home-contact-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Sending message...";
    status.className = "form-status";

    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      message: String(formData.get("message") || "").trim(),
    };

    if (!payload.name || !payload.email || !payload.subject || payload.message.length < 10) {
      const msg = "Please complete all fields. Message must be at least 10 characters.";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/messages.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const firstError = json?.errors ? Object.values(json.errors)[0] : json?.message;
        throw new Error(firstError || "Unable to send your message");
      }

      form.reset();
      status.textContent = "Message sent successfully. We will get back to you soon.";
      status.className = "form-status success";
      showToast("Message sent successfully.", "success");
    } catch (error) {
      const msg = error?.message || "Unable to send your message";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
    }
  });
}

function setFooterYear() {
  const year = qs("#year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function renderAboutLeadership() {
  const target = qs("#about-leadership-grid");
  if (!target) return;

  const leadership = [
    {
      initials: "TZ",
      title: "Tanzania",
      role: "East African Community",
      description: "National-level and community-based youth empowerment engagement.",
      focus: "Country Focus",
    },
    {
      initials: "KE",
      title: "Kenya",
      role: "East African Community",
      description: "Youth skills, entrepreneurship, and civic participation support pathways.",
      focus: "Country Focus",
    },
    {
      initials: "UG",
      title: "Uganda",
      role: "East African Community",
      description: "Collaborative youth-led initiatives for inclusive social and economic outcomes.",
      focus: "Country Focus",
    },
    {
      initials: "RW",
      title: "Rwanda",
      role: "East African Community",
      description: "Innovation and leadership programs that strengthen youth participation.",
      focus: "Country Focus",
    },
    {
      initials: "BI",
      title: "Burundi",
      role: "East African Community",
      description: "Community resilience and youth-centered development collaboration.",
      focus: "Country Focus",
    },
    {
      initials: "SS",
      title: "South Sudan",
      role: "East African Community",
      description: "Partnership-driven youth engagement for sustainable local impact.",
      focus: "Country Focus",
    },
  ];

  target.innerHTML = leadership
    .map(
      (person) => `
      <article class="leader-card reveal">
        <div class="leader-avatar" aria-hidden="true">${person.initials}</div>
        <h3>${person.title}</h3>
        <p class="role">${person.role}</p>
        <p>${person.description}</p>
        <span class="leader-meta">${person.focus}</span>
      </article>
    `
    )
    .join("");
}

function setupAboutTabs() {
  const tabs = document.querySelectorAll(".about-tab");
  const panels = document.querySelectorAll(".about-panel");
  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.aboutTab;
      if (!target) return;

      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });

      panels.forEach((panel) => {
        panel.classList.toggle("active", panel.dataset.aboutPanel === target);
      });
    });
  });
}

function setupAboutFaq() {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const body = item.querySelector(".faq-body");
    if (!trigger || !body) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      items.forEach((entry) => {
        entry.classList.remove("open");
        const entryTrigger = entry.querySelector(".faq-trigger");
        const entryBody = entry.querySelector(".faq-body");
        if (entryTrigger) entryTrigger.setAttribute("aria-expanded", "false");
        if (entryBody) entryBody.style.maxHeight = "0px";
      });

      if (isOpen) return;

      item.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      body.style.maxHeight = `${body.scrollHeight}px`;
    });
  });
}

function setupFellowshipFaq() {
  if (document.body.dataset.page !== "fellowship") return;

  const items = document.querySelectorAll(".fellowship-faq-section .faq-item");
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    const body = item.querySelector(".faq-body");
    if (!trigger || !body) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      items.forEach((entry) => {
        entry.classList.remove("open");
        const entryTrigger = entry.querySelector(".faq-trigger");
        const entryBody = entry.querySelector(".faq-body");
        if (entryTrigger) entryTrigger.setAttribute("aria-expanded", "false");
        if (entryBody) entryBody.style.maxHeight = "0px";
      });

      if (isOpen) return;

      item.classList.add("open");
      trigger.setAttribute("aria-expanded", "true");
      body.style.maxHeight = `${body.scrollHeight}px`;
    });
  });
}

function setupCounters() {
  const counters = document.querySelectorAll("[data-counter]");
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = Number(el.dataset.counter || "0");
    const suffix = el.dataset.suffix || "";
    if (!target || Number.isNaN(target)) return;

    const duration = 1200;
    const start = performance.now();

    const step = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const value = Math.floor(progress * target);
      el.textContent = `${value}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = `${target}${suffix}`;
      }
    };

    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach((counter) => observer.observe(counter));
}

function setupAboutHeroSlider() {
  const slides = document.querySelectorAll("[data-slide]");
  const dots = document.querySelectorAll("[data-slide-dot]");
  if (!slides.length || !dots.length) return;

  let current = 0;
  let timer;

  const showSlide = (index) => {
    current = index;
    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  };

  const schedule = () => {
    clearInterval(timer);
    timer = setInterval(() => {
      const next = (current + 1) % slides.length;
      showSlide(next);
    }, 4200);
  };

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      showSlide(i);
      schedule();
    });
  });

  showSlide(0);
  schedule();

  const visual = qs(".about-hero-visual");
  if (visual) {
    visual.addEventListener("mouseenter", () => clearInterval(timer));
    visual.addEventListener("mouseleave", schedule);
  }
}

function setupAboutQuickNavSpy() {
  const links = document.querySelectorAll(".about-quicknav-list a[href^='#']");
  if (!links.length) return;

  const sections = Array.from(links)
    .map((link) => qs(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const activate = (id) => {
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        activate(visible.target.id);
      }
    },
    { threshold: [0.25, 0.5, 0.7], rootMargin: "-80px 0px -45% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupAboutPageFeatures() {
  if (document.body.dataset.page !== "about") return;

  renderAboutLeadership();
  setupAboutTabs();
  setupAboutFaq();
  setupCounters();
  setupAboutHeroSlider();
  setupAboutQuickNavSpy();
}

function mapProgramCategory(title = "") {
  const normalized = String(title).toLowerCase();

  if (normalized.includes("education") || normalized.includes("skills")) return "education";
  if (normalized.includes("leadership") || normalized.includes("civic") || normalized.includes("governance")) {
    return "leadership";
  }
  if (
    normalized.includes("entrepreneur") ||
    normalized.includes("economic") ||
    normalized.includes("enterprise") ||
    normalized.includes("business") ||
    normalized.includes("empowerment")
  ) {
    return "entrepreneurship";
  }
  if (normalized.includes("advocacy") || normalized.includes("policy")) return "advocacy";
  if (normalized.includes("resilience") || normalized.includes("social change") || normalized.includes("mental")) {
    return "resilience";
  }
  return "other";
}

function setupProgramCardFiltering() {
  const page = document.body.dataset.page;
  if (page !== "programs") return;

  const cards = Array.from(document.querySelectorAll("#programs-grid .program-card"));
  const filters = Array.from(document.querySelectorAll(".program-filter"));
  const count = qs("#program-count");
  const search = qs("#program-search");
  const featured = qs("#program-featured");
  const modal = qs("#program-modal");
  const modalTitle = qs("#program-modal-title");
  const modalDesc = qs("#program-modal-description");
  const modalTag = qs("#program-modal-tag");
  const closeModalTriggers = document.querySelectorAll("[data-close-program-modal]");

  if (!cards.length || !filters.length) return;

  cards.forEach((card, index) => {
    const item = programState[index];
    card.dataset.programCategory = item?.category || "other";
    card.dataset.programTitle = String(item?.title || "");
    card.dataset.programTag = String(item?.tag || "");
    card.dataset.programDescription = String(item?.description || "");
  });

  const setFeatured = (card) => {
    if (!featured) return;
    if (!card) {
      featured.innerHTML = `
        <div class="program-featured-copy">
          <span class="programs-kicker">Featured Program</span>
          <h3>No Matching Program</h3>
          <p>Try a different search term or filter to find a program area.</p>
        </div>
      `;
      return;
    }
    const title = card.dataset.programTitle || "Program";
    const description = card.dataset.programDescription || "";
    const tag = card.dataset.programTag || "Program";
    featured.innerHTML = `
      <div class="program-featured-copy">
        <span class="programs-kicker">Featured Program</span>
        <h3>${title}</h3>
        <p>${description}</p>
        <p class="program-featured-meta">${tag}</p>
      </div>
    `;
  };

  const openModal = (card) => {
    if (!modal || !modalTitle || !modalDesc || !modalTag || !card) return;
    modalTitle.textContent = card.dataset.programTitle || "Program";
    modalDesc.textContent = card.dataset.programDescription || "";
    modalTag.textContent = card.dataset.programTag || "Program";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  };

  const applyFilter = (key, term = "") => {
    let visible = 0;
    let firstVisible = null;
    cards.forEach((card) => {
      const title = (card.dataset.programTitle || "").toLowerCase();
      const tag = (card.dataset.programTag || "").toLowerCase();
      const query = term.toLowerCase();
      const matchesSearch = !query || title.includes(query) || tag.includes(query);
      const matchesFilter = key === "all" || card.dataset.programCategory === key;
      const show = matchesFilter && matchesSearch;
      card.style.display = show ? "" : "none";
      if (show) {
        visible += 1;
        if (!firstVisible) firstVisible = card;
      }
    });

    if (count) {
      count.textContent = `${visible} program${visible === 1 ? "" : "s"} shown`;
    }

    setFeatured(firstVisible);
  };

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.programFilter || "all";
      filters.forEach((item) => item.classList.toggle("active", item === button));
      applyFilter(key, search?.value || "");
    });
  });

  if (search) {
    search.addEventListener("input", () => {
      const active = filters.find((item) => item.classList.contains("active"));
      const key = active?.dataset.programFilter || "all";
      applyFilter(key, search.value);
    });
  }

  cards.forEach((card) => {
    const trigger = card.querySelector(".program-open-link");
    if (!trigger) return;
    trigger.addEventListener("click", () => openModal(card));
  });

  closeModalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  applyFilter("all", "");
}

function setupProgramInquiryForm() {
  if (document.body.dataset.page !== "programs") return;

  const form = qs("#program-inquiry-form");
  const status = qs("#program-inquiry-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Sending inquiry...";
    status.className = "form-status";

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const track = String(formData.get("track") || "").trim();
    const role = String(formData.get("role") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !track || !role || message.length < 10) {
      const msg = "Please complete all fields before sending your inquiry.";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/program_inquiries.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          email,
          program_area: track,
          role,
          message,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const firstError = json?.errors ? Object.values(json.errors)[0] : json?.message;
        throw new Error(firstError || "Unable to send inquiry");
      }

      form.reset();
      status.textContent = "Inquiry sent successfully. We will get back to you soon.";
      status.className = "form-status success";
      showToast("Program inquiry sent successfully.", "success");
    } catch (error) {
      const msg = error?.message || "Unable to send inquiry";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
    }
  });
}

function setupProgramsQuickNavSpy() {
  const links = document.querySelectorAll(".programs-quicknav-list a[href^='#']");
  if (!links.length) return;

  const sections = Array.from(links)
    .map((link) => qs(link.getAttribute("href")))
    .filter(Boolean);

  if (!sections.length) return;

  const activate = (id) => {
    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) activate(visible.target.id);
    },
    { threshold: [0.25, 0.5, 0.72], rootMargin: "-80px 0px -45% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupInvolvedOpportunityLinks() {
  if (document.body.dataset.page !== "involved") return;

  const links = document.querySelectorAll(".involvement-interest-link");
  const areaSelect = qs("#involvement-area");
  if (!links.length || !areaSelect) return;

  const assignArea = (targetAreaRaw) => {
    const targetArea = String(targetAreaRaw || "").trim();
    if (!targetArea) return;

    const option = Array.from(areaSelect.options).find((entry) => {
      const value = String(entry.value || "").trim().toLowerCase();
      return value && (value === targetArea.toLowerCase() || targetArea.toLowerCase().includes(value) || value.includes(targetArea.toLowerCase()));
    });

    if (option?.value) {
      areaSelect.value = option.value;
    }
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      assignArea(link.getAttribute("data-involvement-area"));
    });
  });

  const modalInterest = qs("#involved-modal-interest");
  if (modalInterest) {
    modalInterest.addEventListener("click", () => {
      assignArea(modalInterest.getAttribute("data-involvement-area"));
    });
  }
}

function setupInvolvementInquiryForm() {
  if (document.body.dataset.page !== "involved") return;

  const form = qs("#involvement-inquiry-form");
  const status = qs("#involvement-inquiry-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Sending your interest...";
    status.className = "form-status";

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const area = String(formData.get("area") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !area || message.length < 10) {
      const msg = "Please complete all required fields. Message must be at least 10 characters.";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/involvement_inquiries.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          email,
          phone,
          involvement_area: area,
          message,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const firstError = json?.errors ? Object.values(json.errors)[0] : json?.message;
        throw new Error(firstError || "Unable to submit your interest");
      }

      form.reset();
      status.textContent = "Interest submitted successfully. Our team will contact you.";
      status.className = "form-status success";
      showToast("Interest submitted successfully.", "success");
    } catch (error) {
      const msg = error?.message || "Unable to submit your interest";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
    }
  });
}

function setupInvolvedPageFeatures() {
  if (document.body.dataset.page !== "involved") return;

  const cards = Array.from(document.querySelectorAll("#involved-grid .involvement-card"));
  const filters = Array.from(document.querySelectorAll(".involved-filter"));
  const search = qs("#involved-search");
  const count = qs("#involved-count");
  const featured = qs("#involved-featured");
  const modal = qs("#involved-modal");
  const modalTitle = qs("#involved-modal-title");
  const modalDescription = qs("#involved-modal-description");
  const modalTag = qs("#involved-modal-tag");
  const modalInterest = qs("#involved-modal-interest");
  const closeTriggers = Array.from(document.querySelectorAll("[data-close-involved-modal]"));
  const copyBtn = qs("#involved-share-copy");

  if (cards.length && filters.length) {
    const renderFeatured = (card) => {
      if (!featured) return;

      if (!card) {
        featured.innerHTML = `
          <span class="tag">Get Involved</span>
          <h3>No matching opportunities</h3>
          <p>Try a different keyword or filter to see available opportunities.</p>
        `;
        return;
      }

      const title = card.dataset.involvementTitle || "Get Involved";
      const description = card.dataset.involvementDescription || "";
      const tag = card.dataset.involvementTag || "Get Involved";

      featured.innerHTML = `
        <span class="tag">Featured ${tag}</span>
        <h3>${title}</h3>
        <p>${description}</p>
        <button class="link involved-open-featured" type="button">View Details</button>
      `;

      const openBtn = featured.querySelector(".involved-open-featured");
      if (openBtn) openBtn.addEventListener("click", () => openModal(card));
    };

    const openModal = (card) => {
      if (!modal || !modalTitle || !modalDescription || !modalTag || !card) return;
      const title = card.dataset.involvementTitle || "Get Involved";
      modalTitle.textContent = title;
      modalDescription.textContent = card.dataset.involvementDescription || "";
      modalTag.textContent = card.dataset.involvementTag || "Get Involved";
      if (modalInterest) {
        modalInterest.setAttribute("data-involvement-area", title);
      }
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
    };

    const closeModal = () => {
      if (!modal) return;
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    };

    const applyFilter = (key, term = "") => {
      const query = term.trim().toLowerCase();
      let visible = 0;
      let firstVisible = null;

      cards.forEach((card) => {
        const title = (card.dataset.involvementTitle || "").toLowerCase();
        const tag = (card.dataset.involvementTag || "").toLowerCase();
        const description = (card.dataset.involvementDescription || "").toLowerCase();
        const category = card.dataset.involvementCategory || "other";
        const matchesSearch = !query || title.includes(query) || tag.includes(query) || description.includes(query);
        const matchesFilter = key === "all" || category === key;
        const show = matchesSearch && matchesFilter;
        card.style.display = show ? "" : "none";
        if (show) {
          visible += 1;
          if (!firstVisible) firstVisible = card;
        }
      });

      if (count) count.textContent = `${visible} opportunit${visible === 1 ? "y" : "ies"} shown`;
      renderFeatured(firstVisible);
    };

    filters.forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.dataset.involvedFilter || "all";
        filters.forEach((item) => item.classList.toggle("active", item === button));
        applyFilter(key, search?.value || "");
      });
    });

    if (search) {
      search.addEventListener("input", () => {
        const active = filters.find((item) => item.classList.contains("active"));
        const key = active?.dataset.involvedFilter || "all";
        applyFilter(key, search.value || "");
      });
    }

    cards.forEach((card) => {
      const trigger = card.querySelector(".involvement-open-link");
      if (trigger) trigger.addEventListener("click", () => openModal(card));
    });

    closeTriggers.forEach((trigger) => trigger.addEventListener("click", closeModal));

    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast("Page link copied.", "success");
        } catch (error) {
          showToast("Unable to copy link.", "error");
        }
      });
    }

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });

    applyFilter("all", "");
  }

  setupInvolvedOpportunityLinks();
  setupInvolvementInquiryForm();
}

function setupResourcesPageFeatures() {
  if (document.body.dataset.page !== "resources") return;

  const cards = Array.from(document.querySelectorAll("#resources-grid .resource-card"));
  const filters = Array.from(document.querySelectorAll(".resource-filter"));
  const search = qs("#resource-search");
  const count = qs("#resources-count");
  const featured = qs("#resource-featured");
  const modal = qs("#resource-modal");
  const modalTitle = qs("#resource-modal-title");
  const modalDescription = qs("#resource-modal-description");
  const modalTag = qs("#resource-modal-tag");
  const closeTriggers = Array.from(document.querySelectorAll("[data-close-resource-modal]"));
  const categoryCards = Array.from(document.querySelectorAll(".resource-category-card"));
  const copyBtn = qs("#resource-share-copy");

  if (!cards.length || !filters.length) return;

  const renderFeatured = (card) => {
    if (!featured) return;

    if (!card) {
      featured.innerHTML = `
        <span class="tag">Resources</span>
        <h3>No matching resources</h3>
        <p>Try a different keyword or filter to see available resources.</p>
      `;
      return;
    }

    const title = card.dataset.resourceTitle || "Resource";
    const description = card.dataset.resourceDescription || "";
    const tag = card.dataset.resourceTag || "Resource";

    featured.innerHTML = `
      <span class="tag">Featured ${tag}</span>
      <h3>${title}</h3>
      <p>${description}</p>
      <button class="link resource-open-link-featured" type="button">Read Resource</button>
    `;

    const openBtn = featured.querySelector(".resource-open-link-featured");
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        openResource(card);
      });
    }
  };

  const openResource = (card) => {
    if (!modal || !modalTitle || !modalDescription || !modalTag || !card) return;
    modalTitle.textContent = card.dataset.resourceTitle || "Resource";
    modalDescription.textContent = card.dataset.resourceDescription || "";
    modalTag.textContent = card.dataset.resourceTag || "Resource";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeResource = () => {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  };

  const applyFilter = (key, term = "") => {
    const query = term.trim().toLowerCase();
    let visible = 0;
    let firstVisible = null;

    cards.forEach((card) => {
      const title = (card.dataset.resourceTitle || "").toLowerCase();
      const tag = (card.dataset.resourceTag || "").toLowerCase();
      const description = (card.dataset.resourceDescription || "").toLowerCase();
      const category = card.dataset.resourceCategory || "other";
      const matchesSearch = !query || title.includes(query) || tag.includes(query) || description.includes(query);
      const matchesFilter = key === "all" || category === key;
      const show = matchesSearch && matchesFilter;
      card.style.display = show ? "" : "none";
      if (show) {
        visible += 1;
        if (!firstVisible) firstVisible = card;
      }
    });

    if (count) {
      count.textContent = `${visible} resource${visible === 1 ? "" : "s"} shown`;
    }

    renderFeatured(firstVisible);
  };

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.resourceFilter || "all";
      filters.forEach((item) => item.classList.toggle("active", item === button));
      applyFilter(key, search?.value || "");
    });
  });

  if (search) {
    search.addEventListener("input", () => {
      const active = filters.find((item) => item.classList.contains("active"));
      const key = active?.dataset.resourceFilter || "all";
      applyFilter(key, search.value || "");
    });
  }

  cards.forEach((card) => {
    const trigger = card.querySelector(".resource-open-link");
    if (!trigger) return;
    trigger.addEventListener("click", () => openResource(card));
  });

  categoryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const targetKey = card.dataset.resourceFilterTarget || "all";
      const targetButton = filters.find((button) => button.dataset.resourceFilter === targetKey);
      if (!targetButton) return;
      targetButton.click();
      qs("#resources-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  closeTriggers.forEach((trigger) => {
    trigger.addEventListener("click", closeResource);
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast("Page link copied.", "success");
      } catch (error) {
        showToast("Unable to copy link.", "error");
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeResource();
  });

  applyFilter("all", "");
}

function setupResourceRequestForm() {
  if (document.body.dataset.page !== "resources") return;

  const form = qs("#resource-request-form");
  const status = qs("#resource-request-status");

  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Sending request...";
    status.className = "form-status";

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const topic = String(formData.get("topic") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !topic || message.length < 10) {
      const msg = "Please complete all fields. Message must be at least 10 characters.";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/messages.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          subject: `Resource Request: ${topic}`,
          message,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const firstError = json?.errors ? Object.values(json.errors)[0] : json?.message;
        throw new Error(firstError || "Unable to send resource request");
      }

      form.reset();
      status.textContent = "Request sent successfully. Our team will contact you.";
      status.className = "form-status success";
      showToast("Resource request sent successfully.", "success");
    } catch (error) {
      const msg = error?.message || "Unable to send request";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
    }
  });
}

function setupProgramsPageFeatures() {
  if (document.body.dataset.page !== "programs") return;

  setupProgramCardFiltering();
  setupProgramsQuickNavSpy();
  setupProgramInquiryForm();
  setupCounters();
}

function setupFellowshipFiltering() {
  if (document.body.dataset.page !== "fellowship") return;

  const cards = Array.from(document.querySelectorAll("#fellowship-grid .fellowship-card"));
  const filters = Array.from(document.querySelectorAll(".fellowship-filter"));
  const count = qs("#fellowship-count");

  if (!cards.length || !filters.length) return;

  const applyFilter = (key) => {
    let visible = 0;

    cards.forEach((card) => {
      const category = card.dataset.fellowshipCategory || "other";
      const show = key === "all" || category === key;
      card.style.display = show ? "" : "none";
      if (show) visible += 1;
    });

    if (count) count.textContent = `${visible} track${visible === 1 ? "" : "s"} available`;
  };

  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.fellowshipFilter || "all";
      filters.forEach((item) => item.classList.toggle("active", item === button));
      applyFilter(key);
    });
  });

  applyFilter("all");
}

function setupFellowshipApplyLinks() {
  if (document.body.dataset.page !== "fellowship") return;

  const links = document.querySelectorAll(".fellowship-apply-link");
  const track = qs("#fellow-track");
  if (!links.length || !track) return;

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const selectedTrack = link.getAttribute("data-track");
      if (!selectedTrack) return;

      const option = Array.from(track.options).find((entry) => {
        const value = String(entry.value || "").toLowerCase();
        return value && selectedTrack.toLowerCase().includes(value);
      });

      if (option?.value) {
        track.value = option.value;
      }
    });
  });
}

function setupFellowshipApplicationForm() {
  if (document.body.dataset.page !== "fellowship") return;

  const form = qs("#fellowship-apply-form");
  const status = qs("#fellowship-form-status");

  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Submitting your application...";
    status.className = "form-status";

    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const track = String(formData.get("track") || "").trim();
    const location = String(formData.get("location") || "").trim();
    const availability = String(formData.get("availability") || "").trim();
    const motivation = String(formData.get("motivation") || "").trim();

    if (!name || !email || !phone || !track || !location || !availability || motivation.length < 30) {
      status.textContent = "Please complete all required fields. Motivation must be at least 30 characters.";
      status.className = "form-status error";
      showToast("Please complete all required fields before submitting.", "error");
      return;
    }

    const payload = {
      full_name: name,
      email,
      phone,
      track,
      location,
      availability,
      motivation,
    };

    try {
      const response = await fetch(`${API_BASE}/fellowship_applications.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const firstError = json?.errors ? Object.values(json.errors)[0] : json?.message;
        throw new Error(firstError || "Unable to submit your application");
      }

      form.reset();
      status.textContent = "Application submitted successfully. Our team will contact you soon.";
      status.className = "form-status success";
      showToast("Application submitted successfully. We will contact you soon.", "success");
    } catch (error) {
      status.textContent = error.message;
      status.className = "form-status error";
      showToast(error.message || "Unable to submit application right now.", "error");
    }
  });
}

function setupFellowshipPageFeatures() {
  if (document.body.dataset.page !== "fellowship") return;

  setupFellowshipFiltering();
  setupFellowshipApplyLinks();
  setupFellowshipApplicationForm();
  setupFellowshipFaq();
}

function setupPublicationUploadForm() {
  if (document.body.dataset.page !== "publications") return;

  const form = qs("#publication-upload-form");
  const status = qs("#publication-upload-status");

  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    status.textContent = "Uploading publication...";
    status.className = "form-status";

    const formData = new FormData(form);
    const title = String(formData.get("title") || "").trim();
    const tag = String(formData.get("tag") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const image = formData.get("image");

    if (!title || !tag || !description || description.length < 10 || !(image instanceof File) || !image.name) {
      const msg = "Please complete all fields and select a valid image.";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
      return;
    }

    if (image.size > 5 * 1024 * 1024) {
      const msg = "Image size must be 5MB or less.";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/publications.php`, {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        const firstError = json?.errors ? Object.values(json.errors)[0] : json?.message;
        throw new Error(firstError || "Unable to upload publication");
      }

      form.reset();
      status.textContent = "Publication uploaded successfully.";
      status.className = "form-status success";
      showToast("Publication uploaded successfully.", "success");
      await renderPublications();
      setupReveal();
    } catch (error) {
      const msg = error?.message || "Upload failed";
      status.textContent = msg;
      status.className = "form-status error";
      showToast(msg, "error");
    }
  });
}

async function initPageData() {
  const jobs = [
    renderStats(),
    renderPrograms(),
    renderInvolvement(),
    renderResources(),
    renderPublications(),
    renderFellowshipCards(),
    renderContactDetails(),
  ];

  await Promise.all(jobs);
}

/* Dynamic Gallery */
const galleryImages = [
  {
    src: "assets/img/hero-1.jpg",
    title: "Leadership and Civic Engagement",
    caption: "Equipping young leaders to participate in governance and community development",
  },
  {
    src: "assets/img/hero-2.jpg",
    title: "Entrepreneurship and Economic Empowerment",
    caption: "Training and mentorship that support youth businesses, jobs, and financial independence",
  },
  {
    src: "assets/img/hero-3.jpg",
    title: "Education and Skills Development",
    caption: "Practical education, vocational training, and digital skills for a modern economy",
  },
  {
    src: "assets/img/hero-1.jpg",
    title: "Youth Advocacy and Policy Influence",
    caption: "Promoting youth-inclusive policy dialogue at regional and national levels",
  },
  {
    src: "assets/img/hero-3.jpg",
    title: "Community Resilience and Social Change",
    caption: "Strengthening communities through social cohesion, mental health awareness, and sustainability",
  },
];

let currentGalleryIndex = 0;

function initGallery() {
  const galleryFeatured = qs(".gallery-featured img");
  const galleryGrid = qs(".gallery-grid");
  const lightbox = qs(".gallery-lightbox");
  const lightboxImage = qs("#lightboxImage");
  const lightboxCaption = qs("#lightboxCaption");
  const lightboxCounter = qs("#lightboxCounter");
  const lightboxClose = qs("#lightboxClose");
  const lightboxPrev = qs("#lightboxPrev");
  const lightboxNext = qs("#lightboxNext");
  const viewFullBtn = qs("#viewFullBtn");

  if (!galleryFeatured || !galleryGrid) return;

  // Render gallery grid tiles
  galleryGrid.innerHTML = galleryImages
    .map(
      (img, idx) =>
        `<div class="gallery-tile ${idx === 0 ? "active" : ""}" data-index="${idx}">
        <img src="${img.src}" alt="${img.title}" />
      </div>`
    )
    .join("");

  // Set initial featured image
  galleryFeatured.src = galleryImages[0].src;
  galleryFeatured.alt = galleryImages[0].title;

  // Gallery tile click handler
  galleryGrid.addEventListener("click", (e) => {
    const tile = e.target.closest(".gallery-tile");
    if (!tile) return;

    const index = parseInt(tile.dataset.index);
    updateFeaturedImage(index);

    // Update active state
    galleryGrid.querySelectorAll(".gallery-tile").forEach((t) => {
      t.classList.toggle("active", t === tile);
    });
  });

  // View full button handler
  viewFullBtn.addEventListener("click", () => {
    openLightbox(currentGalleryIndex);
  });

  // Lightbox handlers
  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => {
    currentGalleryIndex =
      (currentGalleryIndex - 1 + galleryImages.length) % galleryImages.length;
    updateLightboxImage();
  });
  lightboxNext.addEventListener("click", () => {
    currentGalleryIndex = (currentGalleryIndex + 1) % galleryImages.length;
    updateLightboxImage();
  });

  // Click on featured image opens lightbox
  galleryFeatured.addEventListener("click", () => {
    openLightbox(currentGalleryIndex);
  });

  // Gallery tile click opens lightbox
  galleryGrid.addEventListener("dblclick", (e) => {
    const tile = e.target.closest(".gallery-tile");
    if (tile) {
      const index = parseInt(tile.dataset.index);
      openLightbox(index);
    }
  });

  // Lightbox click on image area closes (optional - can be removed)
  lightboxImage.parentElement.addEventListener("click", (e) => {
    if (e.target === lightboxImage) {
      closeLightbox();
    }
  });

  // Close lightbox on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });

  // Arrow key navigation in lightbox
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("active")) return;
    if (e.key === "ArrowLeft") {
      lightboxPrev.click();
    } else if (e.key === "ArrowRight") {
      lightboxNext.click();
    }
  });

  function updateFeaturedImage(index) {
    currentGalleryIndex = index;
    const image = galleryImages[index];
    galleryFeatured.src = image.src;
    galleryFeatured.alt = image.title;
  }

  function openLightbox(index) {
    currentGalleryIndex = index;
    lightbox.classList.add("active");
    updateLightboxImage();
  }

  function closeLightbox() {
    lightbox.classList.remove("active");
  }

  function updateLightboxImage() {
    const image = galleryImages[currentGalleryIndex];
    lightboxImage.src = image.src;
    lightboxImage.alt = image.title;
    lightboxCaption.textContent = image.caption;
    lightboxCounter.textContent = `${currentGalleryIndex + 1} / ${galleryImages.length}`;
  }
}

/* Hero Slider with Professional Animation */
let heroSliderInterval;
let currentHeroIndex = 0;

function initHeroSlider() {
  const heroSlides = qs(".hero-slider");
  const slides = heroSlides?.querySelectorAll(".hero-slide");
  const dots = document.querySelectorAll(".hero-dot");

  if (!slides || slides.length === 0) return;

  // Set initial active slide
  slides[0].classList.add("active");
  dots[0].classList.add("active");

  // Dot click handler
  dots.forEach((dot) => {
    dot.addEventListener("click", (e) => {
      const index = parseInt(e.target.dataset.index);
      goToSlide(index, slides, dots);
      resetAutoPlay();
    });
  });

  // Auto-play slides
  function autoPlay() {
    currentHeroIndex = (currentHeroIndex + 1) % slides.length;
    updateSlides(slides, dots);
  }

  function goToSlide(index, slides, dots) {
    currentHeroIndex = index;
    updateSlides(slides, dots);
  }

  function updateSlides(slides, dots) {
    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === currentHeroIndex);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle("active", idx === currentHeroIndex);
    });
  }

  function resetAutoPlay() {
    clearInterval(heroSliderInterval);
    heroSliderInterval = setInterval(autoPlay, 8000);
  }

  // Start auto-play
  heroSliderInterval = setInterval(autoPlay, 8000);

  // Pause on hover
  heroSlides.addEventListener("mouseenter", () => {
    clearInterval(heroSliderInterval);
  });

  // Resume on mouse leave
  heroSlides.addEventListener("mouseleave", () => {
    resetAutoPlay();
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      currentHeroIndex =
        (currentHeroIndex - 1 + slides.length) % slides.length;
      updateSlides(slides, dots);
      resetAutoPlay();
    } else if (e.key === "ArrowRight") {
      currentHeroIndex = (currentHeroIndex + 1) % slides.length;
      updateSlides(slides, dots);
      resetAutoPlay();
    }
  });
}

async function init() {
  setupMenu();
  setupCurrentPageHighlight();
  setupSectionNavHighlight();
  setupContactForm();
  setupHomeContactForm();
  setFooterYear();
  initHeroSlider();
  initGallery();

  try {
    await initPageData();
  } catch (error) {
    console.error("Page data failed to load:", error);
    showToast("Some live data could not be loaded right now.", "error");
  }

  setupAboutPageFeatures();
  setupInvolvedPageFeatures();
  setupResourcesPageFeatures();
  setupResourceRequestForm();
  setupProgramsPageFeatures();
  setupFellowshipPageFeatures();
  setupPublicationUploadForm();
  await setupPublicationPostPage();
  setupReveal();
}

document.addEventListener("DOMContentLoaded", init);
