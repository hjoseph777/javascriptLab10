// Constants
const CONFIG = {
    API_BASE: 'https://jsonplaceholder.typicode.com/posts',
    MESSAGE_TYPES: {
        ERROR: 'error-input',
        NETWORK: 'error-network',
        SERVER: 'error-server',
        SUCCESS: 'success-message'
    }
};

// Service Layer
class PostService {
    static async get(id) {
        const response = await fetch(`${CONFIG.API_BASE}/${id}`);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return response.json();
    }

    static async create(data) {
        return this.#sendRequest(CONFIG.API_BASE, 'POST', data);
    }

    static async update(id, data) {
        return this.#sendRequest(`${CONFIG.API_BASE}/${id}`, 'PUT', data);
    }

    static async delete(id) {
        const response = await fetch(`${CONFIG.API_BASE}/${id}`, { 
            method: 'DELETE' 
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return true;
    }

    static async #sendRequest(url, method, data) {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, userId: 1 })
        });
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        return response.json();
    }
}

// UI Controller
class UIController {
    constructor() {
        this.form = document.getElementById('dataForm');
        this.display = document.getElementById('dataDisplay');
        this.initializeEventListeners();
    }

    showMessage(type, title, details = '') {
        this.display.innerHTML = `
            <div class="message ${CONFIG.MESSAGE_TYPES[type]}">
                <h3>${title}</h3>
                ${details ? `<p>${details}</p>` : ''}
            </div>`;
    }

    handleError(error) {
        if (!navigator.onLine) {
            this.showMessage('NETWORK', 'Connection Error', 'Check internet connection');
        } else if (error.name === 'TypeError') {
            this.showMessage('SERVER', 'Server Error', 'Cannot connect to server');
        } else {
            this.showMessage('ERROR', 'Request Failed', error.message);
        }
    }

    resetForm() {
        this.form.reset();
    }

    getFormData() {
        return {
            id: document.getElementById('postId').value,
            title: document.getElementById('postTitle').value,
            body: document.getElementById('postBody').value
        };
    }

    async handleSubmit(event) {
        event.preventDefault();
        const data = this.getFormData();
        
        try {
            const result = data.id 
                ? await PostService.update(data.id, data)
                : await PostService.create(data);
            
            this.showMessage('SUCCESS', 
                data.id ? 'Post Updated' : 'Post Created',
                `ID: ${result.id}<br>Title: ${result.title}`
            );
            this.resetForm();
        } catch (error) {
            this.handleError(error);
        }
    }

    initializeEventListeners() {
        document.getElementById('fetchBtn').addEventListener('click', 
            () => this.fetchPost(1));
        document.getElementById('xhrBtn').addEventListener('click', 
            () => this.fetchPostXHR(2));
        document.getElementById('deleteBtn').addEventListener('click', 
            () => this.handleDelete());
        this.form.addEventListener('submit', 
            (e) => this.handleSubmit(e));
    }

    async fetchPost(id) {
        try {
            const data = await PostService.get(id);
            this.showMessage('SUCCESS', data.title, data.body);
        } catch (error) {
            this.handleError(error);
        }
    }

    fetchPostXHR(id) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `${CONFIG.API_BASE}/${id}`, true);
        
        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                this.showMessage('SUCCESS', data.title, data.body);
            } else {
                this.handleError(new Error(xhr.statusText));
            }
        };
        
        xhr.onerror = () => this.handleError(new Error('Network request failed'));
        xhr.send();
    }

    async handleDelete() {
        const { id } = this.getFormData();
        if (!id) {
            this.showMessage('ERROR', 'Missing Post ID');
            return;
        }

        try {
            await PostService.delete(id);
            this.showMessage('SUCCESS', 'Post Deleted', `Post ${id} removed`);
            this.resetForm();
        } catch (error) {
            this.handleError(error);
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});