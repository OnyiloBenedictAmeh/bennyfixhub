/* =========================
   BLOG MANAGEMENT
========================= */

let adminBlogPosts = [];

function listenToBlogPosts() {
  const container = document.getElementById("blogAdminGrid");
  if (!container) return;

  onSnapshot(
    collection(db, "blogPosts"),
    (snapshot) => {

      adminBlogPosts = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      adminBlogPosts.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      renderBlogAdmin();
    },
    (err) => {
      console.error(err);
      container.innerHTML =
        `<p class="empty-state">Could not load blog posts.</p>`;
    }
  );
}


window.renderBlogAdmin = function () {

  const container = document.getElementById("blogAdminGrid");
  if (!container) return;

  const search =
    document.getElementById("blogAdminSearch")?.value
      .trim()
      .toLowerCase() || "";

  const filter =
    document.getElementById("blogAdminFilter")?.value || "all";

  const posts = adminBlogPosts.filter(post => {

    const matchesSearch =
      !search ||
      post.title?.toLowerCase().includes(search) ||
      post.category?.toLowerCase().includes(search);

    const matchesFilter =
      filter === "all" ||
      post.status === filter;

    return matchesSearch && matchesFilter;
  });

  if (!posts.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class='bx bx-news'></i>
        <p>No blog posts found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = posts.map(post => {

    const image = post.image
      ? `<img src="${escapeHtml(post.image)}" alt="">`
      : `<div class="blog-admin-image-placeholder">
          <i class='bx bx-image'></i>
        </div>`;

    return `
      <article class="blog-admin-card">

        <div class="blog-admin-image">
          ${image}
        </div>

        <div class="blog-admin-content">

          <span class="blog-admin-category">
            ${escapeHtml(post.category || "General")}
          </span>

          <h3>
            ${escapeHtml(post.title || "Untitled")}
          </h3>

          <p>
            ${escapeHtml(post.excerpt || "")}
          </p>

          <div class="blog-admin-meta">

            <span class="blog-status ${post.status}">
              ${post.status === "published"
                ? "Published"
                : "Draft"}
            </span>

            <span>
              ${formatDate(post.createdAt)}
            </span>

          </div>

          <div class="blog-admin-actions">

            <button
              onclick="editBlogPost('${post.id}')"
              class="btn btn-secondary"
            >
              <i class='bx bx-edit'></i>
              Edit
            </button>

            <button
              onclick="toggleBlogPublish('${post.id}')"
              class="btn btn-primary"
            >
              <i class='bx ${
                post.status === "published"
                  ? "bx-hide"
                  : "bx-show"
              }'></i>

              ${
                post.status === "published"
                  ? "Unpublish"
                  : "Publish"
              }

            </button>

            <button
              onclick="deleteBlogPost('${post.id}')"
              class="danger-btn"
            >
              <i class='bx bx-trash'></i>
            </button>

          </div>

        </div>

      </article>
    `;
  }).join("");
};
window.openBlogEditor = function () {

  document.getElementById("blogPostId").value = "";
  document.getElementById("blogTitle").value = "";
  document.getElementById("blogCategory").value = "";
  document.getElementById("blogExcerpt").value = "";
  document.getElementById("blogContent").value = "";
  document.getElementById("blogImage").value = "";

  document.getElementById("blogEditorTitle").innerText =
    "Create Blog Post";

  document
    .getElementById("blogEditorModal")
    .classList.remove("hidden");
};


window.closeBlogEditor = function () {
  document
    .getElementById("blogEditorModal")
    .classList.add("hidden");
};


window.editBlogPost = function (id) {

  const post = adminBlogPosts.find(p => p.id === id);

  if (!post) return;

  document.getElementById("blogPostId").value = id;
  document.getElementById("blogTitle").value = post.title || "";
  document.getElementById("blogCategory").value = post.category || "";
  document.getElementById("blogExcerpt").value = post.excerpt || "";
  document.getElementById("blogContent").value = post.content || "";
  document.getElementById("blogImage").value = post.image || "";

  document.getElementById("blogEditorTitle").innerText =
    "Edit Blog Post";

  document
    .getElementById("blogEditorModal")
    .classList.remove("hidden");
};
window.saveBlogPost = async function (status) {

  const id =
    document.getElementById("blogPostId").value;

  const title =
    document.getElementById("blogTitle").value.trim();

  const category =
    document.getElementById("blogCategory").value.trim();

  const excerpt =
    document.getElementById("blogExcerpt").value.trim();

  const content =
    document.getElementById("blogContent").value.trim();

  const image =
    document.getElementById("blogImage").value.trim();

  if (!title || !content) {
    return showToast("Title and content are required");
  }

  const data = {
    title,
    category,
    excerpt,
    content,
    image,
    status,
    updatedAt: serverTimestamp(),
    updatedBy: auth.currentUser?.uid || ""
  };

  try {

    if (id) {

      await updateDoc(
        doc(db, "blogPosts", id),
        data
      );

      showToast("Blog post updated");

    } else {

      await addDoc(
        collection(db, "blogPosts"),
        {
          ...data,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid || "",
        }
      );

      showToast(
        status === "published"
          ? "Blog post published"
          : "Draft saved"
      );
    }

    closeBlogEditor();

  } catch (err) {

    console.error(err);
    showToast("Could not save blog post");
  }
};
window.toggleBlogPublish = async function (id) {

  const post = adminBlogPosts.find(p => p.id === id);

  if (!post) return;

  const newStatus =
    post.status === "published"
      ? "draft"
      : "published";

  try {

    await updateDoc(
      doc(db, "blogPosts", id),
      {
        status: newStatus,
        updatedAt: serverTimestamp()
      }
    );

    showToast(
      newStatus === "published"
        ? "Blog post published"
        : "Blog post unpublished"
    );

  } catch (err) {

    console.error(err);
    showToast("Could not update post");
  }
};
window.deleteBlogPost = async function (id) {

  if (!confirm("Delete this blog post?")) return;

  try {

    await deleteDoc(
      doc(db, "blogPosts", id)
    );

    showToast("Blog post deleted");

  } catch (err) {

    console.error(err);
    showToast("Could not delete post");
  }
};