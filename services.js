/* ==========================================
   BENNYFIX SERVICES
========================================== */

const services = [

{
    title:"Screen Replacement",
    description:"Cracked or dead display? Genuine-grade screen replacement with calibration and 90-day warranty.",
    img:"images/services/screen-replacement.jpg",
    device:["Phone","Tablet","Laptop"],
    price:"₦18,000",
    turnaround:"2–24 hrs",
    tag:"Popular"
},

{
    title:"Battery Replacement",
    description:"Restore battery life using high-quality replacement batteries tested for performance.",
    img:"images/services/battery-replacement.jpg",
    device:["Phone","Laptop","Tablet","Ear Buds"],
    price:"₦12,000",
    turnaround:"1–3 hrs",
    tag:"Fast"
},

{
    title:"Charging Port Repair",
    description:"Repair damaged charging ports using professional soldering techniques.",
    img:"images/services/charging-port-repair.jpg",
    device:["Phone","Laptop","Tablet","Console"],
    price:"₦8,000",
    turnaround:"Same Day"
},

{
    title:"Water Damage Recovery",
    description:"Advanced board cleaning, diagnostics and recovery for liquid damaged devices.",
    img:"images/services/water-damage-recovery.jpg",
    device:["Phone","Laptop","Tablet"],
    price:"₦25,000",
    turnaround:"2–5 Days",
    tag:"Premium"
},

{
    title:"Overheating Repair",
    description:"Thermal paste replacement, fan servicing and cooling optimization.",
    img:"images/services/overheating-repair.jpg",
    device:["Laptop","Desktop","Console"],
    price:"₦10,000",
    turnaround:"Same Day"
},

{
    title:"Performance Optimization",
    description:"Speed up slow computers with malware removal, startup cleanup and tuning.",
    img:"images/services/performance-optimization.jpg",
    device:["Laptop","Desktop"],
    price:"₦7,500",
    turnaround:"1–2 Hours",
    tag:"Popular"
},

{
    title:"RAM & SSD Upgrade",
    description:"Upgrade RAM or SSD with complete data migration.",
    img:"images/services/ram-ssd-upgrade.jpg",
    device:["Laptop","Desktop"],
    price:"₦22,000",
    turnaround:"2–4 Hours"
},

{
    title:"WiFi & Network Repair",
    description:"Router setup, signal improvement and network troubleshooting.",
    img:"images/services/wifi-network-repair.jpg",
    device:["Network"],
    price:"₦5,000",
    turnaround:"Same Day"
},

{
    title:"TV Repair",
    description:"Repair Smart TVs, LED TVs, HDMI faults and backlight issues.",
    img:"images/services/tv-repair.jpg",
    device:["TV"],
    price:"₦15,000",
    turnaround:"1–3 Days"
},

{
    title:"Game Console Repair",
    description:"PlayStation, Xbox and Nintendo repairs including HDMI ports and overheating.",
    img:"images/services/game-console-repair.jpg",
    device:["Console"],
    price:"₦12,000",
    turnaround:"1–2 Days"
},

{
    title:"Printer Repair",
    description:"Fix paper jams, ink issues, rollers and printer configuration.",
    img:"images/services/printer-repair.jpg",
    device:["Printer"],
    price:"₦6,000",
    turnaround:"Same Day"
},

{
    title:"Ear Bud Repair",
    description:"Charging case, speaker replacement and pairing issues.",
    img:"images/services/ear-bud-repair.jpg",
    device:["Ear Buds"],
    price:"₦5,000",
    turnaround:"24 Hours"
},

{
    title:"Home Appliance Repair",
    description:"Repair microwaves, blenders, electric kettles and other appliances.",
    img:"images/services/home-appliance-repair.jpg",
    device:["Appliance"],
    price:"₦8,000",
    turnaround:"1–3 Days"
},

{
    title:"Custom PC Build",
    description:"Gaming PCs, Workstations and Creator systems built to your specification.",
    img:"images/services/custom-pc-build.jpg",
    device:["Desktop"],
    price:"₦45,000",
    turnaround:"3–7 Days",
    tag:"Premium"
}

];


/* ==========================================
   ELEMENTS
========================================== */

const grid=document.getElementById("servicesGrid");

const search=document.getElementById("serviceSearch");

const count=document.getElementById("serviceCount");

const empty=document.getElementById("emptyState");

const buttons=document.querySelectorAll(".device-btn");

let currentDevice="All";


/* ==========================================
   RENDER
========================================== */

function renderServices(){

    const keyword=search.value.toLowerCase();

    const filtered=services.filter(service=>{

        const matchesDevice=
        currentDevice==="All" ||
        service.device.includes(currentDevice);

        const matchesSearch=

        service.title.toLowerCase().includes(keyword) ||

        service.description.toLowerCase().includes(keyword);

        return matchesDevice && matchesSearch;

    });

    grid.innerHTML="";

    count.textContent=filtered.length;

    if(filtered.length===0){

        empty.style.display="block";

        return;

    }

    empty.style.display="none";

    filtered.forEach(service=>{

        grid.innerHTML+=`

<div class="service-card">

${service.tag ? `<div class="service-tag">${service.tag}</div>`:""}

<div class="service-icon">

<img src="${service.img}" alt="" class="service-icon-img">

</div>

<h3>${service.title}</h3>

<p>${service.description}</p>

<div class="service-meta">

<div>

<strong>From</strong><br>

${service.price}

</div>

<div>

<strong>Turnaround</strong><br>

${service.turnaround}

</div>

</div>

<button class="primary-btn">

<i class='bx bx-wrench'></i>

Start Repair

</button>

</div>

`;

    });

}


/* ==========================================
   SEARCH
========================================== */

search.addEventListener("keyup",renderServices);


/* ==========================================
   FILTERS
========================================== */

buttons.forEach(button=>{

button.addEventListener("click",()=>{

buttons.forEach(btn=>btn.classList.remove("active"));

button.classList.add("active");

currentDevice=button.dataset.device;

renderServices();

});

});


/* ==========================================
   START
========================================== */

renderServices();