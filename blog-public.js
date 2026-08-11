/* ==========================================================
   BENNYFIX HUB - PUBLIC BLOG
   ========================================================== */

import {
  db,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from "./js/firebase.js";
/* ==========================================================
   STATE
   ========================================================== */

let blogPosts = [];

let activeCategory = "all";

/* ==========================================================
   ELEMENTS
   ========================================================== */

const searchInput = document.getElementById("blogSearch");

const postsGrid = document.getElementById("postsGrid");

const featuredPost = document.getElementById("featuredPost");

const categoryFilters = document.getElementById("categoryFilters");

const noResults = document.getElementById("noResults");

const blogLoading = document.getElementById("blogLoading");

const articleView = document.getElementById("articleView");

const articleContent = document.getElementById("articleContent");

const blogLayout = document.querySelector(".blog-layout");

const blogBottom = document.querySelector(".blog-bottom");

/* ==========================================================
   SECURITY / HTML ESCAPING
   ========================================================== */

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
}

/* ==========================================================
   DATE FORMAT
   ========================================================== */

function formatDate(timestamp) {
  if (!timestamp) {
    return "Recently";
  }

  const date = timestamp?.toDate
    ? timestamp.toDate()
    : timestamp?.seconds
      ? new Date(timestamp.seconds * 1000)
      : new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",

    month: "short",

    year: "numeric",
  }).format(date);
}

/* ==========================================================
   READING TIME
   ========================================================== */

function getReadTime(content = "") {
  const words = String(content).trim().split(/\s+/).filter(Boolean).length;

  return `${Math.max(1, Math.ceil(words / 200))} min read`;
}

/* ==========================================================
   ARTICLE CONTENT
   ========================================================== */

function contentToHtml(content = "") {
  return escapeHtml(content)
    .split(/\n{2,}/)

    .map((block) => {
      return `
        <p>
          ${block.replace(/\n/g, "<br>")}
        </p>
      `;
    })

    .join("");
}

/* ==========================================================
   IMAGE
   ========================================================== */

function imageMarkup(post, featured = false) {
  if (!post.image) {
    return `

      <div class="image-placeholder">

        <i class="bx bx-news"></i>

        <span>Article</span>

      </div>

    `;
  }

  return `

    <img

      src="${escapeHtml(post.image)}"

      alt="${escapeHtml(post.title || "BennyFix Hub article")}"

      loading="${featured ? "eager" : "lazy"}"

      onerror="
        this.onerror=null;
        this.src='';
        this.parentElement.innerHTML=
        '<div class=&quot;image-placeholder&quot;><i class=&quot;bx bx-image&quot;></i><span>Article image</span></div>'
      "

    >

  `;
}

/* ==========================================================
   ARTICLE URL
   ========================================================== */

function articleUrl(id) {
  return `blog.html?post=${encodeURIComponent(id)}`;
}

/* ==========================================================
   FEATURED POST
   ========================================================== */

function renderFeatured(post) {
  if (!featuredPost) {
    return;
  }

  if (!post) {
    featuredPost.hidden = true;

    return;
  }

  featuredPost.hidden = false;

  featuredPost.innerHTML = `

    <div class="featured-image">

      ${imageMarkup(post, true)}

    </div>


    <div class="featured-content">

      <span class="post-category">

        ${escapeHtml(post.category || "General")}

      </span>


      <h2>

        ${escapeHtml(post.title || "Untitled")}

      </h2>


      <p>

        ${escapeHtml(post.excerpt || "")}

      </p>


      <div class="post-meta">

        <span>

          <i class="bx bx-calendar"></i>

          ${formatDate(post.createdAt)}

        </span>


        <span>

          <i class="bx bx-time-five"></i>

          ${getReadTime(post.content)}

        </span>

      </div>


      <a

        href="${articleUrl(post.id)}"

        class="read-more"

      >

        Read article

        <i class="bx bx-right-arrow-alt"></i>

      </a>

    </div>

  `;
}

/* ==========================================================
   POSTS GRID
   ========================================================== */

function renderPosts(posts) {
  if (!postsGrid) {
    return;
  }

  if (!posts.length) {
    postsGrid.innerHTML = "";

    if (noResults) {
      noResults.hidden = false;
    }

    return;
  }

  if (noResults) {
    noResults.hidden = true;
  }

  postsGrid.innerHTML = posts
    .map(
      (post) => `

    <article class="post-card">

      <div class="post-image">

        ${imageMarkup(post)}

      </div>


      <div class="post-content">

        <span class="post-category">

          ${escapeHtml(post.category || "General")}

        </span>


        <h3>

          ${escapeHtml(post.title || "Untitled")}

        </h3>


        <p>

          ${escapeHtml(post.excerpt || "")}

        </p>


        <div class="post-footer">

          <span>

            ${formatDate(post.createdAt)}

          </span>


          <a

            href="${articleUrl(post.id)}"

          >

            Read

            <i class="bx bx-right-arrow-alt"></i>

          </a>

        </div>

      </div>

    </article>

  `,
    )
    .join("");
}

/* ==========================================================
   CATEGORIES
   ========================================================== */

function renderCategories() {
  if (!categoryFilters) {
    return;
  }

  const counts = {};

  blogPosts.forEach((post) => {
    const category = String(post.category || "General").trim() || "General";

    counts[category] = (counts[category] || 0) + 1;
  });

  const categories = Object.keys(counts).sort((a, b) => a.localeCompare(b));

  categoryFilters.innerHTML = `

    <button

      class="category-filter ${activeCategory === "all" ? "active" : ""}"

      data-category="all"

    >

      <span>

        <i class="bx bx-grid-alt"></i>

        All articles

      </span>


      <strong>

        ${blogPosts.length}

      </strong>

    </button>


    ${categories
      .map(
        (category) => `

      <button

        class="category-filter ${activeCategory === category ? "active" : ""}"

        data-category="${escapeHtml(category)}"

      >

        <span>

          <i class="bx bx-folder"></i>

          ${escapeHtml(category)}

        </span>


        <strong>

          ${counts[category]}

        </strong>

      </button>

    `,
      )
      .join("")}

  `;

  categoryFilters.querySelectorAll(".category-filter").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "all";

      renderCategories();

      renderCurrentPosts();
    });
  });
}

/* ==========================================================
   SEARCH + FILTER
   ========================================================== */

function renderCurrentPosts() {
  const text = searchInput?.value.trim().toLowerCase() || "";

  const filtered = blogPosts.filter((post) => {
    const title = String(post.title || "").toLowerCase();

    const category = String(post.category || "").toLowerCase();

    const excerpt = String(post.excerpt || "").toLowerCase();

    const matchesSearch =
      !text ||
      title.includes(text) ||
      category.includes(text) ||
      excerpt.includes(text);

    const matchesCategory =
      activeCategory === "all" ||
      String(post.category || "General") === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const newest = blogPosts[0];

  const showFeatured = activeCategory === "all" && !text;

  renderFeatured(showFeatured ? newest : null);

  renderPosts(
    showFeatured ? filtered.filter((post) => post.id !== newest?.id) : filtered,
  );
}

/* ==========================================================
   LOADING
   ========================================================== */

function showLoading(value) {
  if (blogLoading) {
    blogLoading.hidden = !value;
  }
}

/* ==========================================================
   ERROR
   ========================================================== */

function showBlogError() {
  showLoading(false);

  if (featuredPost) {
    featuredPost.hidden = true;
  }

  if (postsGrid) {
    postsGrid.innerHTML = `

      <div class="article-error">

        <i class="bx bx-cloud-off"></i>

        <h3>

          Articles could not be loaded

        </h3>

        <p>

          Please refresh the page
          and try again.

        </p>

      </div>

    `;
  }

  if (noResults) {
    noResults.hidden = true;
  }
}

/* ==========================================================
   SHOW SINGLE ARTICLE
   ========================================================== */

function showArticle(post) {
  if (!articleView || !articleContent) {
    return;
  }

  document.querySelector(".blog-hero")?.setAttribute("hidden", "");

  blogLayout?.setAttribute("hidden", "");

  blogBottom?.setAttribute("hidden", "");

  articleView.hidden = false;

  articleContent.innerHTML = `

    <header class="article-header">

      <span class="post-category">

        ${escapeHtml(post.category || "General")}

      </span>


      <h1>

        ${escapeHtml(post.title || "Untitled")}

      </h1>


      <p class="article-excerpt">

        ${escapeHtml(post.excerpt || "")}

      </p>


      <div class="article-meta">

        <span>

          <i class="bx bx-calendar"></i>

          ${formatDate(post.createdAt)}

        </span>


        <span>

          <i class="bx bx-time-five"></i>

          ${getReadTime(post.content)}

        </span>

      </div>

    </header>


    ${
      post.image
        ? `

          <div class="article-hero-image">

            ${imageMarkup(post, true)}

          </div>

        `
        : ""
    }


    <div class="article-body">

      ${contentToHtml(post.content || "No article content available.")}

    </div>

  `;

  document.title = `${post.title || "Article"} | BennyFix Hub`;

  window.scrollTo({
    top: 0,

    behavior: "smooth",
  });
}

/* ==========================================================
   ARTICLE NOT FOUND
   ========================================================== */

function showArticleError() {
  if (!articleView || !articleContent) {
    return;
  }

  document.querySelector(".blog-hero")?.setAttribute("hidden", "");

  blogLayout?.setAttribute("hidden", "");

  blogBottom?.setAttribute("hidden", "");

  articleView.hidden = false;

  articleContent.innerHTML = `

    <div class="article-error">

      <i class="bx bx-error-circle"></i>

      <h3>

        Article not found

      </h3>


      <p>

        This article may have been
        removed or is no longer published.

      </p>


      <a

        href="blog.html"

        class="read-more"

      >

        Back to blog

        <i class="bx bx-right-arrow-alt"></i>

      </a>

    </div>

  `;
}

/* ==========================================================
   LOAD SINGLE ARTICLE
   ========================================================== */

async function loadSingleArticle(id) {
  try {
    const snapshot = await getDoc(doc(db, "blogPosts", id));

    if (!snapshot.exists()) {
      showArticleError();

      return;
    }

    const post = {
      id: snapshot.id,

      ...snapshot.data(),
    };

    if (post.status !== "published") {
      showArticleError();

      return;
    }

    showArticle(post);
  } catch (error) {
    console.error("Could not load blog article:", error);

    showArticleError();
  }
}

/* ==========================================================
   LOAD PUBLISHED POSTS
   ========================================================== */

function loadPublishedPosts() {
  showLoading(true);

  const ordered = query(
    collection(db, "blogPosts"),

    where("status", "==", "published"),

    orderBy("createdAt", "desc"),
  );

  onSnapshot(
    ordered,

    (snapshot) => {
      blogPosts = snapshot.docs.map((item) => ({
        id: item.id,

        ...item.data(),
      }));

      showLoading(false);

      renderCategories();

      renderCurrentPosts();
    },

    (error) => {
      console.warn("Ordered blog query failed; using fallback query.", error);

      const fallback = query(
        collection(db, "blogPosts"),

        where("status", "==", "published"),
      );

      onSnapshot(
        fallback,

        (snapshot) => {
          blogPosts = snapshot.docs

            .map((item) => ({
              id: item.id,

              ...item.data(),
            }))

            .sort(
              (a, b) =>
                (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
            );

          showLoading(false);

          renderCategories();

          renderCurrentPosts();
        },

        (fallbackError) => {
          console.error("Could not load published blog posts:", fallbackError);

          showBlogError();
        },
      );
    },
  );
}

/* ==========================================================
   SEARCH EVENT
   ========================================================== */

searchInput?.addEventListener(
  "input",

  renderCurrentPosts,
);

/* ==========================================================
   CHECK URL FOR SINGLE ARTICLE
   ========================================================== */

const postId = new URLSearchParams(window.location.search).get("post");

if (postId) {
  loadSingleArticle(postId);
} else {
  loadPublishedPosts();
}
