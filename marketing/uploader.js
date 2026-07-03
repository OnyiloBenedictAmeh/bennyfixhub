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
                    class="bf-input"
                    accept="${this.accept}"
                    ${this.multiple ? "multiple" : ""}
                    hidden
                >

                <div class="bf-dropzone">

                    <div class="bf-icon">☁️</div>

                    <h3>Drop files here</h3>

                    <p>or click to browse</p>

                </div>

                <div class="bf-preview"></div>

            </div>

        `;

        this.input = this.container.querySelector(".bf-input");

        this.dropzone = this.container.querySelector(".bf-dropzone");

        this.preview = this.container.querySelector(".bf-preview");

    }

    attachEvents() {

        this.dropzone.addEventListener("click", () => {

            this.input.click();

        });

        this.input.addEventListener("change", e => {

            this.addFiles(e.target.files);

            this.input.value = "";

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