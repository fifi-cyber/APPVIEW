// Variables globales
let currentCard;
let categories = new Set();
let currentFilter = 'all';
let isSignedIn = false;

// Elementos del DOM
const addButton = document.getElementById('addButton');
const urlInput = document.getElementById('urlInput');
const nameInput = document.getElementById('nameInput');
const categorySelect = document.getElementById('categorySelect');
const cardContainer = document.getElementById('cardContainer');
const categoryContainer = document.getElementById('categoryContainer');
const editModal = document.getElementById('editModal');
const editUrlInput = document.getElementById('editUrlInput');
const editNameInput = document.getElementById('editNameInput');
const editDescriptionInput = document.getElementById('editDescriptionInput');
const saveEditButton = document.getElementById('saveEditButton');
const closeModalButton = document.getElementById('closeModalButton');
const searchInput = document.getElementById('searchInput');

async function saveToAPI(cards) {
    try {
        const response = await fetch('/api/cards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cards })
        });
        
        if (!response.ok) {
            throw new Error('Error al sincronizar');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function loadFromAPI() {
    try {
        const response = await fetch('/api/cards');
        if (!response.ok) {
            throw new Error('Error al cargar datos');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

// Modifica la función addCard para sincronizar
async function addCard(url, name, category, logo = '', description = '') {
    const card = document.createElement('div');
    card.className = 'card';
    
    const initials = name.split(' ').map(word => word[0]).join('').toUpperCase();
    const uiAvatarsUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff`;
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;
    
    card.innerHTML = `
        <img src="${faviconUrl}" alt="${name}" class="card-logo" onerror="this.onerror=null; this.src='${logo || uiAvatarsUrl}'">
        <div class="card-content">
            <a href="${url}" target="_blank" class="font-medium">${name}</a>
            <p class="category-label">${category}</p>
        </div>
        <div class="card-buttons">
            <button onclick="editCard(this.parentNode.parentNode)" class="edit-btn">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button onclick="deleteCard(this.parentNode.parentNode)" class="delete-btn">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
        <button class="preview-button" onclick="togglePreview(this.parentNode)">
            <i class="fas fa-info-circle"></i>
        </button>
        <div class="preview-tooltip">
            <span class="preview-tooltip-text">${description}</span>
        </div>
    `;
    
    card.dataset.description = description;
    cardContainer.appendChild(card);
    categories.add(category);
    updateCategoryTags();
    
    try {
        // Sincronizar con la API
        await saveCards();
        showNotification('Tarjeta añadida y sincronizada', 'success');
    } catch (error) {
        showNotification('Error al sincronizar', 'error');
    }
}

// Modifica la función saveCards para sincronizar
async function saveCards() {
    try {
        const cards = Array.from(cardContainer.children).map(cardToObject);
        await saveToAPI(cards);
        localStorage.setItem('cards', JSON.stringify(cards)); // Backup local
        return true;
    } catch (error) {
        console.error('Error al guardar:', error);
        showNotification('Error al sincronizar las tarjetas', 'error');
        return false;
    }
}

// Modifica la función loadCards para sincronizar
async function loadCards() {
    try {
        const cards = await loadFromAPI();
        cardContainer.innerHTML = '';
        
        cards.forEach(card => {
            addCard(
                card.url, 
                card.name, 
                card.category, 
                card.logo, 
                card.description
            );
            categories.add(card.category);
        });
        
        updateCategoryTags();
        showNotification('Tarjetas sincronizadas correctamente', 'success');
    } catch (error) {
        console.error('Error al cargar:', error);
        showNotification('Error al cargar las tarjetas', 'error');
        
        // Intentar cargar desde localStorage como fallback
        const localCards = JSON.parse(localStorage.getItem('cards') || '[]');
        if (localCards.length > 0) {
            localCards.forEach(card => {
                addCard(
                    card.url, 
                    card.name, 
                    card.category, 
                    card.logo, 
                    card.description
                );
                categories.add(card.category);
            });
            updateCategoryTags();
            showNotification('Cargadas tarjetas desde caché local', 'warning');
        }
    }
}