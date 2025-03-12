// Agregar al inicio del archivo
let groupOrder = JSON.parse(localStorage.getItem('groupOrder')) || [];

// Función para verificar si una imagen existe
function checkImageExists(url, callback) {
    const img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(false); };
    img.src = url;
}

// Función para ordenar grupos
function sortGroups() {
    const bookmarksList = document.getElementById('bookmarksList');
    const groups = Array.from(bookmarksList.getElementsByClassName('group-container'));

    groups.sort((a, b) => {
        const indexA = groupOrder.indexOf(a.dataset.groupName);
        const indexB = groupOrder.indexOf(b.dataset.groupName);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    groups.forEach(group => bookmarksList.appendChild(group));
}

// Función para guardar el orden de los grupos
function saveGroupOrder() {
    const groups = Array.from(document.getElementsByClassName('group-container'));
    groupOrder = groups.map(group => group.dataset.groupName);
    localStorage.setItem('groupOrder', JSON.stringify(groupOrder));
}

// Función para cargar y mostrar los marcadores desde localStorage
function displayBookmarks() {
    const bookmarksList = document.getElementById('bookmarksList');
    bookmarksList.innerHTML = '';

    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    let groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};

    const groupedBookmarks = {};
    bookmarks.forEach((bookmark, index) => {
        if (!groupedBookmarks[bookmark.group]) {
            groupedBookmarks[bookmark.group] = [];
        }
        groupedBookmarks[bookmark.group].push({ ...bookmark, id: index });
    });

    for (const group in groupedBookmarks) {
        const groupConfig = groupSettings[group] || {
            name: group,
            icon: '📂',
            fontSize: '15',
        };

        const groupContainer = document.createElement('div');
        groupContainer.className = 'group-container';

        const groupHeader = document.createElement('div');
        groupHeader.className = 'group-header';
        groupHeader.innerHTML = `
            <h2 style="font-size: ${groupConfig.fontSize}px;">
            <span class="badge" style="background-color: #006338; color: white">${groupedBookmarks[group].length}</span>
                ${groupConfig.name} ${groupConfig.icon}
            </h2>
            <button class="btn btn-lg" onclick="openCustomizeModal('${group}')">⚙️</button>
        `;

        const groupCards = document.createElement('div');
        groupCards.className = 'group-cards collapsed'; // Grupo cerrado por defecto

        groupedBookmarks[group].forEach(bookmark => {
            const card = document.createElement('div');
            card.className = 'card';
            
            // Verificar si la imagen existe
            checkImageExists(bookmark.imageUrl, (exists) => {
                const imageUrl = exists ? bookmark.imageUrl : '/img/placeholder-image.jpg';
                card.innerHTML = `
                    <img src="${imageUrl}" class="card-img-top" alt="${bookmark.name}">
                    <button class="btn btn-sm btn-danger btn-delete" onclick="deleteBookmark(${bookmark.id})">🗑️</button>
                    <div class="card-body">
                        <h5 class="card-title">${bookmark.name}</h5>
                        <p class="card-text">${bookmark.description || 'Sin descripción'}</p>
                        <a href="${bookmark.url}" target="_blank" class="btn btn-outline-secondary">Abrir</a>
                    </div>
                `;
            });
    
            groupCards.appendChild(card);
        });

        groupHeader.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                groupCards.classList.toggle('collapsed');
            }
        });

        groupContainer.appendChild(groupHeader);
        groupContainer.appendChild(groupCards);
        bookmarksList.appendChild(groupContainer);
        groupContainer.dataset.groupName = group;
        groupContainer.draggable = true;
        groupContainer.addEventListener('dragstart', dragStart);
        groupContainer.addEventListener('dragover', dragOver);
        groupContainer.addEventListener('drop', drop);
    }
    sortGroups();
}

// Funciones para el arrastre y soltar
function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.groupName);
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const draggedGroupName = e.dataTransfer.getData('text');
    const dropTarget = e.target.closest('.group-container');
    
    if (dropTarget && dropTarget.dataset.groupName !== draggedGroupName) {
        const bookmarksList = document.getElementById('bookmarksList');
        const draggedGroup = document.querySelector(`[data-group-name="${draggedGroupName}"]`);
        
        bookmarksList.insertBefore(draggedGroup, dropTarget);
        saveGroupOrder();
    }
}

// Función para eliminar un marcador
function deleteBookmark(id) {
    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    bookmarks = bookmarks.filter((bookmark, index) => index !== id);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    displayBookmarks(); // Actualizar la lista
}

// Función para abrir el modal de personalización
function openCustomizeModal(group) {
    const groupSettings = JSON.parse(localStorage.getItem('groupSettings')) || {};
    const groupConfig = groupSettings[group] || {
        name: group,
        icon: '📂', // Emoji por defecto
        fontSize: '15', // Tamaño de letra por defecto
    };

    document.getElementById('groupName').value = groupConfig.name;
    document.getElementById('groupIcon').value = groupConfig.icon;
    document.getElementById('groupFontSize').value = groupConfig.fontSize;

    const modal = new bootstrap.Modal(document.getElementById('customizeGroupModal'));
    modal.show();

    // Guardar la personalización al hacer clic en "Guardar"
    document.getElementById('saveGroupCustomization').onclick = () => {
        const newName = document.getElementById('groupName').value;
        const newIcon = document.getElementById('groupIcon').value;
        const newFontSize = document.getElementById('groupFontSize').value;

        groupSettings[group] = {
            name: newName,
            icon: newIcon,
            fontSize: newFontSize,
        };
        localStorage.setItem('groupSettings', JSON.stringify(groupSettings));
        modal.hide();
        displayBookmarks(); // Actualizar la lista
    };
}

// Intersection Observer para animaciones al scroll
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate__animated', 'animate__fadeInUp');
        }
    });
}, { threshold: 0.1 });


// Función para descargar los marcadores
function downloadBookmarks() {
    const bookmarks = localStorage.getItem('bookmarks');
    const groupSettings = localStorage.getItem('groupSettings');
    const data = JSON.stringify({ bookmarks, groupSettings });
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marcadores.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Función para cargar los marcadores
function uploadBookmarks() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                localStorage.setItem('bookmarks', data.bookmarks);
                localStorage.setItem('groupSettings', data.groupSettings);
                displayBookmarks();
                alert('Marcadores cargados con éxito');
            } catch (error) {
                alert('Error al cargar los marcadores: ' + error.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// Simular carga de datos
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        displayBookmarks();
    }, 1000);
});

// Cargar los marcadores al iniciar la página
displayBookmarks();

