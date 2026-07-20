export class Uploader {

    constructor(options = {}) {

        this.container = document.querySelector(options.container);

        this.accept = options.accept || "image/*";

        this.multiple = options.multiple ?? true;

        this.onAdd = options.onAdd || null;

        this.files = [];

        this.render();

        this.attachEvents();

    }

    render() {

        this.container.innerHTML = `

            <div class="bf-upload">

                <input
                    type="file"
                    class="bf-input-camera"
                    accept="image/*"
                    capture="environment"
                    ${this.multiple ? "multiple" : ""}
                    hidden
                >

                <input
                    type="file"
                    class="bf-input-library"
                    accept="${this.accept}"
                    ${this.multiple ? "multiple" : ""}
                    hidden
                >

                <div class="bf-dropzone">

                    <div class="bf-icon">☁️</div>

                    <h3>Add Images</h3>

                    <p>Drag &amp; drop, or pick an option below</p>

                    <div class="bf-upload-actions">

                        <button type="button" class="bf-action-btn bf-camera-btn">
                            📷 Take Photo
                        </button>

                        <button type="button" class="bf-action-btn bf-library-btn">
                            🖼️ Choose Files
                        </button>

                    </div>

                </div>

                <div class="bf-preview"></div>

                <div class="bf-camera-modal" hidden>
                    <div class="bf-camera-box">
                        <video class="bf-camera-video" autoplay playsinline></video>
                        <div class="bf-camera-actions">
                            <button type="button" class="bf-action-btn bf-capture-btn">Capture</button>
                            <button type="button" class="bf-action-btn bf-close-camera-btn">Cancel</button>
                        </div>
                    </div>
                </div>

            </div>

        `;

        this.cameraInput = this.container.querySelector(".bf-input-camera");

        this.libraryInput = this.container.querySelector(".bf-input-library");

        this.dropzone = this.container.querySelector(".bf-dropzone");

        this.cameraBtn = this.container.querySelector(".bf-camera-btn");

        this.libraryBtn = this.container.querySelector(".bf-library-btn");

        this.preview = this.container.querySelector(".bf-preview");
        this.cameraModal = this.container.querySelector(".bf-camera-modal");
        this.cameraVideo = this.container.querySelector(".bf-camera-video");
        this.captureBtn = this.container.querySelector(".bf-capture-btn");
        this.closeCameraBtn = this.container.querySelector(".bf-close-camera-btn");

    }

    attachEvents() {

        this.cameraBtn.addEventListener("click", (e) => {

            e.stopPropagation();

            this.openCamera();

        });

        this.captureBtn.addEventListener("click", () => this.capturePhoto());
        this.closeCameraBtn.addEventListener("click", () => this.closeCamera());

        this.libraryBtn.addEventListener("click", (e) => {

            e.stopPropagation();

            this.libraryInput.click();

        });

        this.cameraInput.addEventListener("change", e => {

            this.addFiles(e.target.files);

            this.cameraInput.value = "";

        });

        this.libraryInput.addEventListener("change", e => {

            this.addFiles(e.target.files);

            this.libraryInput.value = "";

        });

        this.dropzone.addEventListener("dragover", e => {

            e.preventDefault();

            this.dropzone.classList.add("dragging");

        });

        this.dropzone.addEventListener("dragleave", () => {

            this.dropzone.classList.remove("dragging");

        });

        this.dropzone.addEventListener("drop", e => {

            e.preventDefault();

            this.dropzone.classList.remove("dragging");

            this.addFiles(e.dataTransfer.files);

        });

    }

    async openCamera() {

        if (!navigator.mediaDevices?.getUserMedia) {
            this.cameraInput.click();
            return;
        }

        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.cameraVideo.srcObject = this.cameraStream;
            this.cameraModal.hidden = false;
        } catch {
            this.cameraInput.click();
        }

    }

    capturePhoto() {

        const canvas = document.createElement("canvas");
        canvas.width = this.cameraVideo.videoWidth;
        canvas.height = this.cameraVideo.videoHeight;
        canvas.getContext("2d").drawImage(this.cameraVideo, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
            this.addFiles([file]);
            this.closeCamera();
        }, "image/jpeg", 0.9);

    }

    closeCamera() {

        this.cameraStream?.getTracks().forEach((track) => track.stop());
        this.cameraStream = null;
        this.cameraVideo.srcObject = null;
        this.cameraModal.hidden = true;

    }

    addFiles(fileList) {

        const added = [];

        [...fileList].forEach(file => {

            this.files.push(file);

            this.createPreview(file);

            added.push(file);

        });

        if (added.length && this.onAdd) {

            this.onAdd(added);

        }

    }

    createPreview(file) {

        const card = document.createElement("div");

        card.className = "bf-file";

        const img = document.createElement("img");

        img.src = URL.createObjectURL(file);

        const remove = document.createElement("button");

        remove.innerHTML = "✕";

        remove.onclick = () => {

            this.files = this.files.filter(f => f !== file);

            card.remove();

        };

        card.append(img, remove);

        this.preview.append(card);

    }

    getFiles() {

        return this.files;

    }

    clear() {

        this.files = [];

        this.preview.innerHTML = "";

    }

}
