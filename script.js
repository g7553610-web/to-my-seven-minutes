/*
  Supabase configuration
*/

const SUPABASE_URL = "https://htoqvxvvbvatblcxyfiz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_vltjatKECGVH4pQjw6HkkA_4DJdfi_p";
const BUCKET_NAME = "LOVESTORY";

const hasSupabaseConfig =
  !SUPABASE_URL.includes("PASTE_") &&
  !SUPABASE_PUBLISHABLE_KEY.includes("PASTE_");

const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

// HTML elements
const authForm = document.getElementById("authForm");
const authTitle = document.getElementById("authTitle");
const authDescription = document.getElementById("authDescription");
const authSubmit = document.getElementById("authSubmit");
const toggleAuth = document.getElementById("toggleAuth");
const authMessage = document.getElementById("authMessage");
const authCard = document.getElementById("authCard");
const privateArea = document.getElementById("privateArea");
const signedInAs = document.getElementById("signedInAs");
const logoutButton = document.getElementById("logoutButton");
const uploadForm = document.getElementById("uploadForm");
const uploadMessage = document.getElementById("uploadMessage");
const uploadButton = document.getElementById("uploadButton");
const photoGallery = document.getElementById("photoGallery");
const refreshButton = document.getElementById("refreshButton");

let isSignUpMode = false;
let currentUser = null;

// Switch between login and signup
toggleAuth.addEventListener("click", () => {
  isSignUpMode = !isSignUpMode;

  authTitle.textContent = isSignUpMode
    ? "Create our account ♡"
    : "Welcome back ♡";

  authDescription.textContent = isSignUpMode
    ? "Create one shared account to use on both of your devices."
    : "Log in to see and add your memories.";

  authSubmit.textContent = isSignUpMode
    ? "Create account"
    : "Log in";

  toggleAuth.textContent = isSignUpMode
    ? "Already have an account? Log in"
    : "Create your shared account";

  authMessage.textContent = "";
});

// Login and signup
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!supabaseClient) {
    authMessage.textContent = "Please configure Supabase keys first.";
    return;
  }

  authMessage.textContent = "Please wait…";
  authSubmit.disabled = true;

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    let result;

    if (isSignUpMode) {
      result = await supabaseClient.auth.signUp({
        email,
        password
      });

      if (!result.error && !result.data.session) {
        authMessage.textContent =
          "Account created! Check your email to confirm it, then log in.";
      }
    } else {
      result = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
    }

    if (result.error) throw result.error;

    if (result.data.session) {
      authMessage.textContent = "";
    }

  } catch (error) {
    authMessage.textContent =
      error.message || "Something went wrong. Please try again.";
  } finally {
    authSubmit.disabled = false;
  }
});

// Logout
logoutButton.addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) alert(error.message);
});

// Refresh gallery
refreshButton.addEventListener("click", loadMemories);

// Upload a photo
uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    uploadMessage.textContent = "Please log in first.";
    return;
  }

  const fileInput = document.getElementById("photoInput");
  const file = fileInput.files[0];

  const caption =
    document.getElementById("photoCaption").value.trim() ||
    "A beautiful memory ♡";

  const memoryDate =
    document.getElementById("photoDate").value || null;

  if (!file) {
    uploadMessage.textContent = "Choose a photo first.";
    return;
  }

  if (!file.type.startsWith("image/")) {
    uploadMessage.textContent = "Please choose an image file.";
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    uploadMessage.textContent =
      "Please choose a photo smaller than 8 MB.";
    return;
  }

  uploadButton.disabled = true;
  uploadMessage.textContent = "Saving your memory…";

  const safeExtension = (
    file.name.split(".").pop() || "jpg"
  ).toLowerCase().replace(/[^a-z0-9]/g, "");

  const filePath =
    `private/${currentUser.id}/${crypto.randomUUID()}.${safeExtension}`;

  try {
    const { error: storageError } = await supabaseClient.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) throw storageError;

    const { error: databaseError } = await supabaseClient
      .from("memories")
      .insert({
        user_id: currentUser.id,
        image_path: filePath,
        caption,
        memory_date: memoryDate
      });

    if (databaseError) {
      await supabaseClient.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      throw databaseError;
    }

    uploadForm.reset();

    uploadMessage.textContent =
      "Saved! Your memory is in the scrapbook. ♡";

    await loadMemories();

  } catch (error) {
    uploadMessage.textContent =
      error.message || "Couldn't save this photo. Check your setup and try again.";
  } finally {
    uploadButton.disabled = false;
  }
});

// Load memories
async function loadMemories() {
  if (!currentUser) return;

  photoGallery.innerHTML =
    '<p class="empty-state">Loading your memories…</p>';

  const { data, error } = await supabaseClient
    .from("memories")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    photoGallery.innerHTML =
      `<p class="empty-state">Could not load memories: ${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    photoGallery.innerHTML =
      '<p class="empty-state">Our first memory is waiting to be added. ♡</p>';
    return;
  }

  photoGallery.innerHTML = "";

  for (const memory of data) {
    const { data: signedData, error: signedError } =
      await supabaseClient.storage
        .from(BUCKET_NAME)
        .createSignedUrl(memory.image_path, 60 * 60);

    if (signedError) {
      console.error(signedError);
      continue;
    }

    const card = document.createElement("article");
    card.className = "polaroid";

    const image = document.createElement("img");
    image.src = signedData.signedUrl;
    image.alt = memory.caption || "A photo memory";
    image.loading = "lazy";

    const caption = document.createElement("p");
    caption.className = "caption";
    caption.textContent =
      memory.caption || "A beautiful memory ♡";

    const date = document.createElement("p");
    date.className = "photo-date";
    date.textContent = memory.memory_date
      ? formatDate(memory.memory_date)
      : "A moment to remember";

    const remove = document.createElement("button");
    remove.className = "delete-button";
    remove.type = "button";
    remove.textContent = "Remove memory";

    remove.addEventListener("click", () => {
      deleteMemory(memory);
    });

    card.append(image, caption, date, remove);
    photoGallery.appendChild(card);
  }
}

// Delete a memory
async function deleteMemory(memory) {
  if (!confirm("Are you sure you want to remove this memory?")) {
    return;
  }

  const { error: storageError } = await supabaseClient.storage
    .from(BUCKET_NAME)
    .remove([memory.image_path]);

  if (storageError) {
    alert(storageError.message);
    return;
  }

  const { error: databaseError } = await supabaseClient
    .from("memories")
    .delete()
    .eq("id", memory.id);

  if (databaseError) {
    alert(databaseError.message);
    return;
  }

  await loadMemories();
}

// Format date
function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  );
}

// Protect displayed text
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

// Update page after login/logout
async function updatePageForSession(session) {
  currentUser = session?.user || null;

  authCard.classList.toggle("hidden", Boolean(currentUser));
  privateArea.classList.toggle("hidden", !currentUser);

  if (currentUser) {
    signedInAs.textContent =
      `Signed in as ${currentUser.email}`;

    await loadMemories();

  } else {
    signedInAs.textContent = "";

    photoGallery.innerHTML =
      '<p class="empty-state">Log in to see your shared scrapbook. ♡</p>';
  }
}

// Start website
(async function startApp() {
  if (!hasSupabaseConfig) {
    authMessage.textContent =
      "First add your Supabase Project URL and Publishable key in script.js.";
    return;
  }

  const { data } = await supabaseClient.auth.getSession();

  await updatePageForSession(data.session);

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    updatePageForSession(session);
  });
})();
