class Note {
    constructor(id, title, text, color = "#ffffff") {
        this.id = id;
        this.title = title;
        this.text = text;
        this.color = color;
    }
}

class App {
    constructor() {
        this.notes = JSON.parse(localStorage.getItem("notes")) || [];
        this.selectedNoteId = "";
        this.miniSidebar = true;

        // Form elements
        this.$activeForm = document.querySelector(".active-form");
        this.$inactiveForm = document.querySelector(".inactive-form");
        this.$noteTitle = document.querySelector("#note-title");
        this.$noteText = document.querySelector("#note-text");
        this.$notes = document.querySelector(".notes");
        this.$form = document.querySelector("#form");

        // Modal elements
        this.$modal = document.querySelector(".modal");
        this.$modalForm = document.querySelector("#modal-form");
        this.$modalTitle = document.querySelector("#modal-title");
        this.$modalText = document.querySelector("#modal-text");
        this.$closeModalForm = document.querySelector("#modal-btn");

        // Sidebar elements
        this.$sidebar = document.querySelector(".sidebar");
        this.$sidebarActiveItem = document.querySelector(".active-item");

        // Search elements
        this.$searchInput = document.querySelector(".search-area input");

        // Dark mode elements
        this.$darkModeToggle = document.querySelector("#dark-mode-toggle");
        this.darkMode = JSON.parse(localStorage.getItem("darkMode")) || false;

        // Apply saved dark mode state
        if (this.darkMode) {
            document.body.classList.add("dark-mode");
            this.$darkModeToggle.textContent = "light_mode";
        }

        this.addEventListeners();
        this.displayNotes();
    }

    addEventListeners() {
        // Main body click handler
        document.body.addEventListener("click", (event) => {
            this.handleFormClick(event);
            this.handleColorPalette(event);
            this.closeModal(event);
            this.openModal(event);
            this.handleArchiving(event);
        });

        // Form submit
        this.$form.addEventListener("submit", (event) => {
            event.preventDefault();
            const title = this.$noteTitle.value;
            const text = this.$noteText.value;
            this.addNote({ title, text });
            this.closeActiveForm();
        });

        // Modal form submit
        this.$modalForm.addEventListener("submit", (event) => {
            event.preventDefault();
        });

        // Sidebar hover
        this.$sidebar.addEventListener("mouseover", () => {
            this.handleToggleSidebar();
        });

        this.$sidebar.addEventListener("mouseout", () => {
            this.handleToggleSidebar();
        });

        // Search input
        this.$searchInput.addEventListener("input", (event) => {
            this.searchNotes(event.target.value);
        });

        // Dark mode toggle
        this.$darkModeToggle.addEventListener("click", () => {
            this.toggleDarkMode();
        });
    }

    // ==================== FORM HANDLING ====================

    handleFormClick(event) {
        const isActiveFormClickedOn = this.$activeForm.contains(event.target);
        const isInactiveFormClickedOn = this.$inactiveForm.contains(event.target);
        const title = this.$noteTitle.value;
        const text = this.$noteText.value;

        if (isInactiveFormClickedOn) {
            this.openActiveForm();
        } else if (!isInactiveFormClickedOn && !isActiveFormClickedOn) {
            this.addNote({ title, text });
            this.closeActiveForm();
        }
    }

    openActiveForm() {
        this.$inactiveForm.style.display = "none";
        this.$activeForm.style.display = "block";
        this.$noteText.focus();
    }

    closeActiveForm() {
        this.$inactiveForm.style.display = "block";
        this.$activeForm.style.display = "none";
        this.$noteText.value = "";
        this.$noteTitle.value = "";
    }

    // ==================== MODAL HANDLING ====================

    openModal(event) {
        const $selectedNote = event.target.closest(".note");
        if (
            $selectedNote &&
            !event.target.closest(".archive") &&
            !event.target.closest(".palette-icon") &&
            !event.target.closest(".color-palette")
        ) {
            this.selectedNoteId = $selectedNote.id;
            this.$modalTitle.value = $selectedNote.querySelector(".title").innerHTML;
            this.$modalText.value = $selectedNote.querySelector(".text").innerHTML;

            // Apply note color to modal
            const note = this.notes.find((n) => n.id === this.selectedNoteId);
            if (note) {
                this.$modal.querySelector(".form-container").style.backgroundColor = note.color;
            }

            this.$modal.classList.add("open-modal");
        }
    }

    closeModal(event) {
        const isModalFormClickedOn = this.$modalForm.contains(event.target);
        const isCloseModalBtnClickedOn = this.$closeModalForm.contains(event.target);
        if (
            (!isModalFormClickedOn || isCloseModalBtnClickedOn) &&
            this.$modal.classList.contains("open-modal")
        ) {
            this.editNote(this.selectedNoteId, {
                title: this.$modalTitle.value,
                text: this.$modalText.value,
            });
            this.$modal.classList.remove("open-modal");
        }
    }

    // ==================== NOTE CRUD ====================

    addNote({ title, text }) {
        if (text !== "") {
            const newNote = new Note(cuid(), title, text);
            this.notes = [...this.notes, newNote];
            this.render();
        }
    }

    editNote(id, { title, text }) {
        this.notes = this.notes.map((note) => {
            if (note.id === id) {
                note.title = title;
                note.text = text;
            }
            return note;
        });
        this.render();
    }

    deleteNote(id) {
        this.notes = this.notes.filter((note) => note.id !== id);
        this.render();
    }

    // ==================== ARCHIVING ====================

    handleArchiving(event) {
        const $selectedNote = event.target.closest(".note");
        if ($selectedNote && event.target.closest(".archive")) {
            this.selectedNoteId = $selectedNote.id;
            this.deleteNote(this.selectedNoteId);
        }
    }

    // ==================== COLOR CODING ====================

    handleColorPalette(event) {
        // Toggle color palette visibility
        if (event.target.closest(".palette-icon")) {
            const palette = event.target
                .closest(".note")
                .querySelector(".color-palette");

            // Close all other palettes first
            document.querySelectorAll(".color-palette").forEach((p) => {
                if (p !== palette) p.classList.remove("show");
            });

            palette.classList.toggle("show");
            return;
        }

        // Handle color selection
        if (event.target.classList.contains("color-option")) {
            const color = event.target.dataset.color;
            const $note = event.target.closest(".note");
            if ($note) {
                this.changeNoteColor($note.id, color);
            }
            event.target.closest(".color-palette").classList.remove("show");
            return;
        }

        // Close all palettes when clicking elsewhere
        document.querySelectorAll(".color-palette").forEach((p) => {
            p.classList.remove("show");
        });
    }

    changeNoteColor(id, color) {
        this.notes = this.notes.map((note) => {
            if (note.id === id) {
                note.color = color;
            }
            return note;
        });
        this.render();
    }

    // ==================== SEARCH ====================

    searchNotes(query) {
        const searchTerm = query.toLowerCase().trim();

        if (searchTerm === "") {
            this.displayNotes();
            return;
        }

        const filteredNotes = this.notes.filter(
            (note) =>
                note.title.toLowerCase().includes(searchTerm) ||
                note.text.toLowerCase().includes(searchTerm)
        );

        this.$notes.innerHTML = filteredNotes
            .map((note) => this.generateNoteHTML(note))
            .join("");
    }

    // ==================== DARK MODE ====================

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle("dark-mode");
        this.$darkModeToggle.textContent = this.darkMode
            ? "light_mode"
            : "dark_mode";
        localStorage.setItem("darkMode", JSON.stringify(this.darkMode));
    }

    // ==================== SIDEBAR ====================

    handleToggleSidebar() {
        if (this.miniSidebar) {
            this.$sidebar.style.width = "250px";
            this.$sidebar.classList.add("sidebar-hover");
            this.$sidebarActiveItem.classList.add("sidebar-active-item");
            this.miniSidebar = false;
        } else {
            this.$sidebar.style.width = "80px";
            this.$sidebar.classList.remove("sidebar-hover");
            this.$sidebarActiveItem.classList.remove("sidebar-active-item");
            this.miniSidebar = true;
        }
    }

    // ==================== RENDERING ====================

    saveNotes() {
        localStorage.setItem("notes", JSON.stringify(this.notes));
    }

    render() {
        this.saveNotes();
        this.displayNotes();
    }

    generateNoteHTML(note) {
        return `
        <div class="note" id="${note.id}" style="background-color: ${note.color || "#ffffff"}">
            <span class="material-symbols-outlined check-circle">check_circle</span>
            <div class="title">${note.title}</div>
            <div class="text">${note.text}</div>
            <div class="note-footer">
                <div class="tooltip">
                    <span class="material-symbols-outlined hover small-icon">add_alert</span>
                    <span class="tooltip-text">Remind me</span>
                </div>
                <div class="tooltip">
                    <span class="material-symbols-outlined hover small-icon">person_add</span>
                    <span class="tooltip-text">Collaborator</span>
                </div>
                <div class="tooltip color-tooltip">
                    <span class="material-symbols-outlined hover small-icon palette-icon">palette</span>
                    <span class="tooltip-text">Change Color</span>
                    <div class="color-palette">
                        <div class="color-option" style="background-color: #ffffff; border: 2px solid #e0e0e0;" data-color="#ffffff"></div>
                        <div class="color-option" style="background-color: #f28b82;" data-color="#f28b82"></div>
                        <div class="color-option" style="background-color: #fbbc04;" data-color="#fbbc04"></div>
                        <div class="color-option" style="background-color: #fff475;" data-color="#fff475"></div>
                        <div class="color-option" style="background-color: #ccff90;" data-color="#ccff90"></div>
                        <div class="color-option" style="background-color: #a7ffeb;" data-color="#a7ffeb"></div>
                        <div class="color-option" style="background-color: #cbf0f8;" data-color="#cbf0f8"></div>
                        <div class="color-option" style="background-color: #aecbfa;" data-color="#aecbfa"></div>
                        <div class="color-option" style="background-color: #d7aefb;" data-color="#d7aefb"></div>
                        <div class="color-option" style="background-color: #fdcfe8;" data-color="#fdcfe8"></div>
                        <div class="color-option" style="background-color: #e6c9a8;" data-color="#e6c9a8"></div>
                        <div class="color-option" style="background-color: #e8eaed;" data-color="#e8eaed"></div>
                    </div>
                </div>
                <div class="tooltip">
                    <span class="material-symbols-outlined hover small-icon">image</span>
                    <span class="tooltip-text">Add Image</span>
                </div>
                <div class="tooltip archive">
                    <span class="material-symbols-outlined hover small-icon">archive</span>
                    <span class="tooltip-text">Archive</span>
                </div>
                <div class="tooltip">
                    <span class="material-symbols-outlined hover small-icon">more_vert</span>
                    <span class="tooltip-text">More</span>
                </div>
            </div>
        </div>`;
    }

    displayNotes() {
        this.$notes.innerHTML = this.notes
            .map((note) => this.generateNoteHTML(note))
            .join("");
    }
}

const app = new App();