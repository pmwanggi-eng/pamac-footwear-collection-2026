const CATEGORIES = [
  "Dolly's Shoes",
  "Shiny Dolly's Shoes",
  "Slides",
  "Rubbers",
  "Open Shoes",
  "Sports Shoes",
  "Boots",
  "Gumboots"
];

const STARTER = [
["Dolly's Shoes","Kids","19-24",350],
["Dolly's Shoes","Teenage","25-30",350],
["Dolly's Shoes","Adult","31-36",350],
["Dolly's Shoes","Adult","37-42",350],
["Shiny Dolly's Shoes","Kids","19-24",350],
["Shiny Dolly's Shoes","Teenage","25-40",350],
["Shiny Dolly's Shoes","Adult","31-36",350],
["Shiny Dolly's Shoes","Adult","37-42",350],
["Slides","TN 132","",400],
["Slides","TN 132","",350],
["Slides","AT 003","",350],
["Slides","L1553","",500],
["Slides","Antuo","",500],
["Slides","Chanel","",350],
["Slides","Puma","",350],
["Slides","Walk Luck","",350],
["Slides","Mitindo","",350],
["Rubbers","Leather rubbers","",350],
["Rubbers","Goma","",350],
["Rubbers","Umoja","",350],
["Rubbers","Nice","",350],
["Rubbers","Men's rubbers","",400],
["Open Shoes","Men","",800],
["Open Shoes","Women","",500],
["Open Shoes","AT 637","",300],
["Open Shoes","Bata","",500],
["Open Shoes","Slippers","",100],
["Open Shoes","Zara","",850],
["Sports Shoes","Kids","",450],
["Sports Shoes","Adult","",350],
["Boots","Kids","",400],
["Boots","Adult","",500],
["Gumboots","Adult","",500],
["Gumboots","Kids","",350]
];

const KEY = "pamac_footwear_data";
let data = loadData();
let selectedPortal = "";
let selectedPhoto = "";
let sellingProduct = null;

const $ = id => document.getElementById(id);
const cash = n => "KSh " + Number(n || 0).toLocaleString("en-KE");

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.products) && Array.isArray(saved.sales)) return saved;
  } catch(e) {}
  return {products: [], sales: []};
}

function saveData() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch(e) {
    alert("Storage is full. Download a backup and use smaller photos.");
  }
}

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,7);
}

function safe(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[c]);
}

function notify(message) {
  const box = $("message");
  box.textContent = message;
  box.style.display = "block";
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => box.style.display = "none", 2500);
}

function initialise() {
  $("category").innerHTML = CATEGORIES.map(c =>
    `<option value="${safe(c)}">${safe(c)}</option>`).join("");

  $("filter").innerHTML =
    '<option value="">All portals</option>' +
    CATEGORIES.map(c => `<option value="${safe(c)}">${safe(c)}</option>`).join("");

  if (!data.products.length && !localStorage.getItem(KEY)) {
    data.products = STARTER.map(([category,name,size,price]) => ({
      id:id(), category, name, size, price,
      code:"", qty:0, sold:0, photo:""
    }));
    saveData();
  }

  $("productForm").addEventListener("submit", addProduct);
  $("photo").addEventListener("change", uploadPhoto);
  $("saleForm").addEventListener("submit", completeSale);

  render();
}

function showTab(name, button) {
  document.querySelectorAll(".tab").forEach(el => el.hidden = true);
  $(name).hidden = false;

  document.querySelectorAll("nav button").forEach(el =>
    el.classList.remove("active"));

  if (button) button.classList.add("active");

  if (name === "sales") renderSales();
  window.scrollTo({top:0,behavior:"smooth"});
}

function renderOriginal() {
  const total = data.products.reduce((s,p) => s + Number(p.qty),0);
  const sold = data.products.reduce((s,p) => s + Number(p.sold || 0),0);
  const value = data.products.reduce((s,p) => s + p.qty*p.price,0);
  const out = data.products.filter(p => p.qty === 0).length;

  $("total").textContent = total.toLocaleString();
  $("sold").textContent = sold.toLocaleString();
  $("value").textContent = cash(value);
  $("out").textContent = out;

  renderPortals();
  renderProducts();
  renderSales();
}

function renderPortals() {
  const portals = ["All", ...CATEGORIES];

  $("portals").innerHTML = portals.map(c => `
    <button class="portal ${selectedPortal === (c === "All" ? "" : c) ? "active" : ""}"
      data-category="${safe(c === "All" ? "" : c)}">${safe(c)}</button>
  `).join("");

  $("portals").querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      choosePortal(button.dataset.category);
    });
  });
}

function choosePortal(category) {
  selectedPortal = category;
  $("filter").value = category;
  renderPortals();
  renderProducts();
}

function renderProducts() {
  const query = $("search").value.toLowerCase();
  const category = $("filter").value;

  const list = data.products.filter(p => {
    const words = [p.name,p.category,p.size,p.code].join(" ").toLowerCase();
    return (!category || p.category === category) &&
           (!selectedPortal || p.category === selectedPortal) &&
           words.includes(query);
  });

  $("products").innerHTML = list.map(p => {
    const status = p.qty === 0
      ? '<span class="status out">OUT OF STOCK</span>'
      : p.qty <= 5
      ? '<span class="status low">LOW STOCK</span>'
      : '<span class="status">IN STOCK</span>';

    return `
      <article class="card">
        <div class="photo">
          ${p.photo
            ? `<img src="${p.photo}" alt="${safe(p.name)}">`
            : "No shoe photo uploaded"}
        </div>
        <div class="info">
          <h3>${safe(p.name)}</h3>
          <div class="meta">
            ${safe(p.category)}<br>
            ${p.size ? "Size: "+safe(p.size)+"<br>" : ""}
            ${p.code ? "Code: "+safe(p.code) : ""}
          </div>
          <div class="price">${cash(p.price)}</div>
          <div class="stock">
            <span>Available pairs</span>
            <strong>${p.qty}</strong>
          </div>
          <div class="stock">
            <span>Sold: ${p.sold || 0}</span>
            ${status}
          </div>
          <div class="actions">
            <button class="sell" onclick="sell('${p.id}')" ${p.qty===0?"disabled":""}>SELL</button>
            <button onclick="editProduct('${p.id}')">EDIT / ADD</button>
            <button class="delete" onclick="deleteProduct('${p.id}')">DELETE</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  $("empty").hidden = list.length !== 0;
}

function uploadPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    notify("Please select a photograph.");
    return;
  }

  const reader = new FileReader();

  reader.onload = e => {
    const image = new Image();

    image.onload = () => {
      const scale = Math.min(1,800/Math.max(image.width,image.height));
      const canvas = document.createElement("canvas");
      canvas.width = image.width*scale;
      canvas.height = image.height*scale;

      canvas.getContext("2d").drawImage(
        image,0,0,canvas.width,canvas.height
      );

      selectedPhoto = canvas.toDataURL("image/jpeg",0.70);
      $("preview").innerHTML =
        `<img src="${selectedPhoto}" alt="Shoe preview">`;
    };

    image.src = e.target.result;
  };

  reader.readAsDataURL(file);
}

function addProduct(event) {
  event.preventDefault();

  const category = $("category").value;
  const name = $("name").value.trim();
  const size = $("size").value.trim();
  const code = $("code").value.trim();
  const price = Number($("price").value);
  const quantity = Number($("quantity").value);

  if (!name || !Number.isFinite(price) || price < 0 ||
      !Number.isInteger(quantity) || quantity < 0) {
    notify("Check the name, price and quantity.");
    return;
  }

  data.products.unshift({
    id:id(),
    category,
    name,
    size,
    code,
    price,
    qty:quantity,
    sold:0,
    photo:selectedPhoto
  });

  saveData();
  resetForm();
  render();
  showTab("inventory",document.querySelector('nav button'));
  notify("New shoe stock added successfully.");
}

function editProduct(productId) {
  const p = data.products.find(x => x.id === productId);
  if (!p) return;

  const newName = prompt("Shoe name:",p.name);
  if (newName === null) return;
  if (!newName.trim()) {
    notify("Shoe name cannot be empty.");
    return;
  }

  const newPrice = prompt("Selling price in KSh:",p.price);
  if (newPrice === null) return;
  const price = Number(newPrice);
  if (!Number.isFinite(price) || price < 0) {
    notify("Invalid price.");
    return;
  }

  const newSize = prompt("Shoe size / range:",p.size || "");
  if (newSize === null) return;

  const extra = prompt("Extra pairs to add to stock (enter 0 for no change):","0");
  if (extra === null) return;
  const quantity = Number(extra);

  if (!Number.isInteger(quantity) || quantity < 0) {
    notify("Invalid quantity.");
    return;
  }

  p.name = newName.trim();
  p.price = price;
  p.size = newSize.trim();
  p.qty += quantity;

  saveData();
  render();
  notify("Product updated successfully.");
}

function deleteProduct(productId) {
  const p = data.products.find(x => x.id === productId);
  if (!p) return;

  if (!confirm("Delete " + p.name + " from inventory?")) return;

  data.products = data.products.filter(x => x.id !== productId);
  saveData();
  render();
  notify("Product deleted.");
}

function resetForm() {
  $("productForm").reset();
  selectedPhoto = "";
  $("preview").textContent = "Photo preview";
}

function sell(productId) {
  sellingProduct = data.products.find(p => p.id === productId);
  if (!sellingProduct || sellingProduct.qty < 1) return;

  $("saleProduct").textContent =
    sellingProduct.name + " · " + cash(sellingProduct.price) +
    " each · " + sellingProduct.qty + " available";

  $("saleQty").max = sellingProduct.qty;
  $("saleQty").value = 1;
  $("saleDialog").showModal();
}

function completeSale(event) {
  event.preventDefault();

  const quantity = Number($("saleQty").value);
  const p = sellingProduct;

  if (!p || !Number.isInteger(quantity) ||
      quantity < 1 || quantity > p.qty) {
    notify("Enter a valid quantity.");
    return;
  }

  p.qty -= quantity;
  p.sold = (p.sold || 0) + quantity;

  data.sales.unshift({
    name:p.name,
    category:p.category,
    quantity,
    price:p.price,
    total:quantity*p.price,
    date:new Date().toISOString()
  });

  saveData();
  $("saleDialog").close();
  render();
  notify("Sale recorded. Remaining stock updated.");
}

function renderSales() {
  $("salesRows").innerHTML = data.sales.map(s => `
    <tr>
      <td>${new Date(s.date).toLocaleString()}</td>
      <td>${safe(s.name)}</td>
      <td>${safe(s.category)}</td>
      <td>${s.quantity}</td>
      <td><strong>${cash(s.total)}</strong></td>
    </tr>
  `).join("");

  $("noSales").style.display = data.sales.length ? "none" : "block";
}

function backup() {
  const file = new Blob([
    JSON.stringify({
      app:"PAMAC FOOT WEAR COLLECTION",
      products:data.products,
      sales:data.sales
    },null,2)
  ],{type:"application/json"});

  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "PAMAC-FOOTWEAR-BACKUP.json";
  link.click();
  URL.revokeObjectURL(link.href);
  notify("Backup download started.");
}

function restore() {
  const file = $("restoreFile").files[0];
  if (!file) {
    notify("Select a backup file first.");
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const backupData = JSON.parse(reader.result);

      if (!Array.isArray(backupData.products) ||
          !Array.isArray(backupData.sales)) {
        throw new Error("Invalid backup");
      }

      if (!confirm("Replace all current stock and sales with this backup?")) return;

      data = {
        products:backupData.products,
        sales:backupData.sales
      };

      saveData();
      render();
      notify("Backup restored successfully.");
    } catch(e) {
      notify("Invalid backup file.");
    }
  };

  reader.readAsText(file);
}

function clearData() {
  if (!confirm("Delete ALL stock and sales records?")) return;
  if (!confirm("Final confirmation: this cannot be undone without a backup.")) return;

  data = {products:[],sales:[]};
  saveData();
  render();
  notify("All data deleted.");
}

initialise();


// PAMAC FOOTWEAR: daily, weekly and monthly sales dashboard
function updatePamacSalesSummary() {
  const sales = Array.isArray(data.sales) ? data.sales : [];
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today);
  const day = (today.getDay() + 6) % 7;
  weekStart.setDate(today.getDate() - day);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  function countSales(start) {
    return sales.reduce((total, sale) => {
      const date = new Date(sale.date);
      if (isNaN(date.getTime()) || date < start || date > now) return total;

      const quantity = Number(
        sale.quantity ?? sale.qty ?? sale.pairs ??
        sale.count ?? sale.soldQty ?? 1
      );
      return total + (Number.isFinite(quantity) ? quantity : 0);
    }, 0);
  }

  let panel = document.getElementById("pamac-sales-summary");

  if (!panel) {
    panel = document.createElement("section");
    panel.id = "pamac-sales-summary";
    document.body.prepend(panel);
  }

  const cards = [
    ["SOLD TODAY", countSales(today), "today"],
    ["SOLD THIS WEEK", countSales(weekStart), "week"],
    ["SOLD THIS MONTH", countSales(monthStart), "month"]
  ];

  panel.innerHTML = `
    <div class="pamac-heading">PAMAC FOOT WEAR COLLECTION</div>
    <div class="pamac-sales-grid">
      ${cards.map(([label, number, type]) => `
        <div class="pamac-sales-card ${type}">
          <div class="pamac-sales-label">${label}</div>
          <div class="pamac-sales-number">${number}</div>
          <div class="pamac-sales-unit">Pairs sold</div>
        </div>
      `).join("")}
    </div>
  `;
}

function render() {
  if (typeof renderOriginal === "function") renderOriginal();
  updatePamacSalesSummary();
}

// TERFEES SHOES CATEGORY
(function addTerfeesShoes() {
  const category = "Terfees Shoes";

  if (typeof CATEGORIES !== "undefined" &&
      !CATEGORIES.includes(category)) {
    CATEGORIES.push(category);
  }

  const items = [
    { name: "Terfees Shoes 27-4", size: "27-4", price: 800 },
    { name: "Terfees Shoes 5-8", size: "5-8", price: 1000 }
  ];

  items.forEach((item, index) => {
    const exists = data.products.some(p =>
      p.category === category && p.size === item.size
    );

    if (!exists) {
      data.products.push({
        id: "terfees-" + Date.now() + "-" + index,
        name: item.name,
        category: category,
        size: item.size,
        price: item.price,
        code: "",
        qty: 0,
        sold: 0,
        photo: ""
      });
    }
  });

  localStorage.setItem(KEY, JSON.stringify(data));
  render();
  console.log("Terfees Shoes added successfully.");
})();
