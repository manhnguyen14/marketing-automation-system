class Book {
    constructor(data = {}) {
        this.bookId = data.book_id || null;
        this.title = data.title || '';
        this.author = data.author || '';
        this.genre = data.genre || '';
        this.topics = data.topics || [];
        this.status = data.status || 'published';
        this.createdAt = data.created_at || null;
    }

    // Business logic methods
    isPublished() {
        return this.status === 'published';
    }

    isAvailable() {
        return this.status === 'published';
    }

    hasTopic(topic) {
        return this.topics.includes(topic);
    }

    hasAnyTopic(topics) {
        return topics.some(topic => this.topics.includes(topic));
    }

    // Validation methods
    validate() {
        const errors = [];

        if (!this.title || this.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (!this.author || this.author.trim().length === 0) {
            errors.push('Author is required');
        }

        if (!['draft', 'published', 'archived'].includes(this.status)) {
            errors.push('Status must be draft, published, or archived');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Data transformation methods
    toDatabaseFormat() {
        return {
            book_id: this.bookId,
            title: this.title,
            author: this.author,
            genre: this.genre,
            topics: this.topics,
            status: this.status,
            created_at: this.createdAt
        };
    }

    toJSON() {
        return {
            bookId: this.bookId,
            title: this.title,
            author: this.author,
            genre: this.genre,
            topics: this.topics,
            status: this.status,
            createdAt: this.createdAt,
            isPublished: this.isPublished(),
            isAvailable: this.isAvailable()
        };
    }

    // Factory methods
    static fromDatabaseRow(row) {
        return new Book(row);
    }

    static create(bookData) {
        const book = new Book(bookData);
        const validation = book.validate();

        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }

        return book;
    }

    // Update method
    update(updateData) {
        // Only update allowed fields
        const allowedFields = ['title', 'author', 'genre', 'topics', 'status'];

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                if (key === 'topics') {
                    this.topics = updateData[key] || [];
                } else {
                    this[this._camelCase(key)] = updateData[key];
                }
            }
        });

        const validation = this.validate();
        if (!validation.isValid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
    }

    // Helper method for field name conversion
    _camelCase(str) {
        return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
    }

    // Search and filtering methods
    matchesGenre(genre) {
        return this.genre.toLowerCase() === genre.toLowerCase();
    }

    matchesAuthor(author) {
        return this.author.toLowerCase().includes(author.toLowerCase());
    }

    matchesTitle(title) {
        return this.title.toLowerCase().includes(title.toLowerCase());
    }
}

// export the class, not the instance (new Book())
module.exports = Book;