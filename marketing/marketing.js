const imageInput = document.getElementById("marketingImages");
const preview = document.getElementById("marketingPreview");

if(imageInput){

imageInput.addEventListener("change",()=>{

    preview.innerHTML="";

    [...imageInput.files].forEach(file=>{

        const img=document.createElement("img");

        img.src=URL.createObjectURL(file);

        preview.appendChild(img);

    });

});

}
/* =========================================
   BENNYFIX STUDIO
   Marketing Module
========================================= */
import { Uploader } from "../marketing/uploader.js";

class MarketingManager {
    constructor() {
        this.images = [];
        this.init();
    }

    init() {
        this.uploader = new Uploader({

    container:"#marketingUploader",

    multiple:true,

    accept:"image/*"

});
    }

    cacheDOM() {
        this.imageInput = document.getElementById("marketingImages");
        this.preview = document.getElementById("marketingPreview");
        this.caption = document.getElementById("postCaption");

        this.publishBtn = document.getElementById("publishBtn");
        this.saveBtn = document.getElementById("saveDraftBtn");
    }

    bindEvents() {

        if(this.imageInput){

            this.imageInput.addEventListener(
                "change",
                this.previewImages.bind(this)
            );

        }

        if(this.saveBtn){

            this.saveBtn.addEventListener(
                "click",
                this.saveDraft.bind(this)
            );

        }

        if(this.publishBtn){

            this.publishBtn.addEventListener(
                "click",
                this.publish.bind(this)
            );

        }

    }

    previewImages(e){

        this.images = [...e.target.files];

        this.preview.innerHTML = "";

        this.images.forEach(file=>{

            const img = document.createElement("img");

            img.src = URL.createObjectURL(file);

            this.preview.appendChild(img);

        });

    }

    saveDraft(){

        console.log("Saving Draft...");

        console.log({

            caption:this.caption.value,

            images:this.images

        });

    }

    publish(){

        console.log("Publishing...");

    }

}

window.addEventListener("DOMContentLoaded",()=>{

    new MarketingManager();

});