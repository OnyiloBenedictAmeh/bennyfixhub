/* =========================================
   BENNYFIX STUDIO
   Marketing Module
========================================= */
import { Uploader } from "./uploader.js";

import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

/* =========================
   FIREBASE (reuses the app admin.js already initialized)
========================= */
const firebaseConfig = {
  apiKey: "AIzaSyA4btiZMSBa4g6vt3XKf1uHeJiu8GJtTj4",
  authDomain: "bennyfixhub.firebaseapp.com",
  projectId: "bennyfixhub",
  storageBucket: "bennyfixhub.appspot.com",
  messagingSenderId: "281036247412",
  appId: "1:281036247412:web:19db51739bc6c81fbc1c21",
  measurementId: "G-EZ4FHYDFZB",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/* =========================
   API
========================= */
const API_BASE = "https://bennyfix-backend-v.vercel.app/api";
const UPLOAD_MEDIA_API_URL = `${API_BASE}/upload-media`;
const GET_MEDIA_API_URL = `${API_BASE}/get-media`;
const DELETE_MEDIA_API_URL = `${API_BASE}/delete-media`;

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.innerText = msg;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

class MarketingManager {
  constructor() {
    this.currentUser = null;

    // Images attached to the post currently being composed.
    // Each entry looks like { id, url, filename }.
    this.attachedImages = [];

    this.libraryMedia = [];
    this.libraryLoaded = false;

    this.cacheDOM();
    this.bindEvents();
    this.initUploader();
    this.initLibraryUploadInput();

    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
    });
  }

  cacheDOM() {
    this.caption = document.getElementById("postCaption");
    this.selectedGrid = document.getElementById("marketingSelectedImages");

    this.saveBtn = document.getElementById("saveDraftBtn");
    this.publishBtn = document.getElementById("publishBtn");

    this.facebookCheckbox = document.getElementById("facebookPlatform");
    this.instagramCheckbox = document.getElementById("instagramPlatform");
    this.linkedinCheckbox = document.getElementById("linkedinPlatform");

    this.tabButtons = document.querySelectorAll(".marketing-tab");
    this.composePanel = document.getElementById("marketingTab-compose");
    this.libraryPanel = document.getElementById("marketingTab-library");
    this.libraryGrid = document.getElementById("mediaLibraryGrid");
    this.libraryUploadBtn = document.getElementById("libraryUploadBtn");
  }

  bindEvents() {
    if (this.saveBtn) {
      this.saveBtn.addEventListener("click", () => this.saveDraft());
    }

    if (this.publishBtn) {
      this.publishBtn.addEventListener("click", () => this.publish());
    }

    this.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.setTab(btn.dataset.tab));
    });

    if (this.libraryUploadBtn) {
      this.libraryUploadBtn.addEventListener("click", () => {
        this.libraryFileInput.click();
      });
    }
  }

  initUploader() {
    // Dropping/selecting images here only stages them locally (the
    // Uploader shows its own preview). They aren't uploaded to the media
    // library until Save Draft or Publish is clicked.
    this.uploader = new Uploader({
      container: "#marketingUploader",
      multiple: true,
      accept: "image/*",
    });
  }

  initLibraryUploadInput() {
    this.libraryFileInput = document.createElement("input");
    this.libraryFileInput.type = "file";
    this.libraryFileInput.accept = "image/*";
    this.libraryFileInput.multiple = true;
    this.libraryFileInput.hidden = true;

    this.libraryFileInput.addEventListener("change", async (e) => {
      const files = [...e.target.files];
      this.libraryFileInput.value = "";

      if (!files.length) return;

      try {
        const uploaded = await this.uploadToLibrary(files);
        showToast(
          uploaded.length > 1 ? `${uploaded.length} images uploaded` : "Image uploaded"
        );
      } catch (err) {
        console.error(err);
        showToast(err.message || "Could not upload image");
      }
    });

    document.body.appendChild(this.libraryFileInput);
  }

  setTab(tab) {
    this.tabButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    if (this.composePanel) {
      this.composePanel.style.display = tab === "compose" ? "block" : "none";
    }

    if (this.libraryPanel) {
      this.libraryPanel.style.display = tab === "library" ? "block" : "none";
    }

    if (tab === "library" && !this.libraryLoaded) {
      this.loadMediaLibrary();
    }
  }

  async getIdToken() {
    const user = this.currentUser || auth.currentUser;

    if (!user) {
      throw new Error("Login required");
    }

    return user.getIdToken();
  }

  // Uploads files to Vercel Blob + the Firestore media collection.
  // Throws on failure so callers (save/publish, library upload) can each
  // decide how to react instead of silently losing images.
  async uploadToLibrary(files) {
    if (!files.length) return [];

    const idToken = await this.getIdToken();

    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));

    const response = await fetch(UPLOAD_MEDIA_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Upload failed");
    }

    if (result.warning) {
      showToast(result.warning);
    }

    this.libraryMedia = [...result.uploaded, ...this.libraryMedia];

    if (this.libraryLoaded) {
      this.renderLibraryGrid();
    }

    return result.uploaded;
  }

  // Uploads any newly staged (not-yet-uploaded) files and combines them
  // with images picked from the Media Library into one list for the post.
  async collectPostImages() {
    const staged = this.uploader.getFiles();

    if (!staged.length) {
      return [...this.attachedImages];
    }

    const uploaded = await this.uploadToLibrary(staged);
    this.uploader.clear();

    return [...this.attachedImages, ...uploaded];
  }

  attachImage(item) {
    if (this.attachedImages.some((img) => img.id === item.id)) return;

    this.attachedImages.push(item);
    this.renderSelectedImages();
  }

  removeAttachedImage(id) {
    this.attachedImages = this.attachedImages.filter((img) => img.id !== id);
    this.renderSelectedImages();

    if (this.libraryLoaded) {
      this.renderLibraryGrid();
    }
  }

  renderSelectedImages() {
    if (!this.selectedGrid) return;

    this.selectedGrid.innerHTML = "";

    this.attachedImages.forEach((img) => {
      const card = document.createElement("div");
      card.className = "marketing-selected-item";

      const thumb = document.createElement("img");
      thumb.src = img.url;
      thumb.alt = img.filename || "";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.innerHTML = "✕";
      remove.onclick = () => this.removeAttachedImage(img.id);

      card.append(thumb, remove);
      this.selectedGrid.appendChild(card);
    });
  }

  async loadMediaLibrary() {
    if (!this.libraryGrid) return;

    this.libraryGrid.innerHTML = `<p class="empty-state">Loading media...</p>`;

    try {
      const idToken = await this.getIdToken();

      const response = await fetch(GET_MEDIA_API_URL, {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load media library");
      }

      this.libraryMedia = result.media;
      this.libraryLoaded = true;
      this.renderLibraryGrid();
    } catch (err) {
      console.error(err);
      this.libraryGrid.innerHTML = `<p class="empty-state">Could not load media library</p>`;
      showToast(err.message || "Could not load media library");
    }
  }

  renderLibraryGrid() {
    if (!this.libraryGrid) return;

    if (!this.libraryMedia.length) {
      this.libraryGrid.innerHTML = `<p class="empty-state">No images yet. Upload some to get started.</p>`;
      return;
    }

    this.libraryGrid.innerHTML = "";

    this.libraryMedia.forEach((item) => {
      const isSelected = this.attachedImages.some((img) => img.id === item.id);

      const card = document.createElement("div");
      card.className = "media-library-item" + (isSelected ? " selected" : "");

      const thumb = document.createElement("img");
      thumb.src = item.url;
      thumb.title = item.filename || "";
      thumb.alt = item.filename || "";

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "media-library-delete";
      deleteBtn.innerHTML = "✕";
      deleteBtn.title = "Delete from library";

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteMediaItem(item);
      });

      card.append(thumb, deleteBtn);

      card.addEventListener("click", () => {
        if (this.attachedImages.some((img) => img.id === item.id)) {
          this.removeAttachedImage(item.id);
        } else {
          this.attachImage(item);
          this.renderLibraryGrid();
        }
      });

      this.libraryGrid.appendChild(card);
    });
  }

  async deleteMediaItem(item) {
    const confirmed = window.confirm(
      `Delete "${item.filename || "this image"}" from the media library? This can't be undone.`
    );

    if (!confirmed) return;

    try {
      const idToken = await this.getIdToken();

      const response = await fetch(`${DELETE_MEDIA_API_URL}?id=${encodeURIComponent(item.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not delete media");
      }

      this.libraryMedia = this.libraryMedia.filter((media) => media.id !== item.id);
      this.attachedImages = this.attachedImages.filter((img) => img.id !== item.id);

      this.renderLibraryGrid();
      this.renderSelectedImages();

      showToast("Image deleted");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not delete image");
    }
  }

  selectedPlatforms() {
    const platforms = [];

    if (this.facebookCheckbox?.checked) platforms.push("facebook");
    if (this.instagramCheckbox?.checked) platforms.push("instagram");
    if (this.linkedinCheckbox?.checked) platforms.push("linkedin");

    return platforms;
  }

  async saveDraft() {
    if (this.isSaving) return;

    if (!this.currentUser) {
      return showToast("Login first");
    }

    const caption = this.caption?.value.trim() || "";
    const hasImages = this.attachedImages.length > 0 || this.uploader.getFiles().length > 0;

    if (!caption && !hasImages) {
      return showToast("Add a caption or at least one image");
    }

    this.isSaving = true;
    this.setSaveButtonLoading(true);

    try {
      const images = await this.collectPostImages();

      await addDoc(collection(db, "posts"), {
        caption,
        images,
        platforms: this.selectedPlatforms(),
        status: "draft",
        createdBy: this.currentUser.uid,
        createdByEmail: this.currentUser.email || "",
        createdAt: serverTimestamp(),
      });

      showToast("Draft saved");
      this.resetCompose();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Could not save draft");
    } finally {
      this.isSaving = false;
      this.setSaveButtonLoading(false);
    }
  }

  setSaveButtonLoading(isLoading) {
    if (!this.saveBtn) return;

    this.saveBtn.disabled = isLoading;
    this.saveBtn.innerText = isLoading ? "Saving..." : "Save Draft";
  }

  publish() {
    // Publishing to Facebook/Instagram/LinkedIn needs a connected Meta
    // account, which hasn't been built yet (next step on the roadmap).
    showToast("Connect a Meta account before publishing — coming soon");
  }

  resetCompose() {
    if (this.caption) this.caption.value = "";

    this.attachedImages = [];
    this.uploader.clear();
    this.renderSelectedImages();

    if (this.libraryLoaded) {
      this.renderLibraryGrid();
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  new MarketingManager();
});