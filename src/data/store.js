/**
 * Local JSON-based data store
 * Provides persistent storage for inventory, decks, and sales
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
const INVENTORY_FILE = path.join(DATA_DIR, 'inventory.json');
const DECKS_FILE = path.join(DATA_DIR, 'decks.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize files if they don't exist
const initFile = (filePath, defaultData = {}) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

initFile(INVENTORY_FILE, { users: {} });
initFile(DECKS_FILE, { users: {} });
initFile(SALES_FILE, { sales: [] });

class DataStore {
  // ============ INVENTORY ============

  getInventory(userId = 'default') {
    const data = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));
    return data.users[userId]?.cards || [];
  }

  addCard(userId = 'default', card) {
    const data = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));
    if (!data.users[userId]) data.users[userId] = { cards: [] };

    const existing = data.users[userId].cards.find(
      c => c.name.toLowerCase() === card.name.toLowerCase() &&
           (c.folder || 'Unsorted') === (card.folder || 'Unsorted')
    );

    if (existing) {
      existing.quantity = (existing.quantity || 1) + (card.quantity || 1);
    } else {
      data.users[userId].cards.push({
        ...card,
        id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        quantity: card.quantity || 1,
        folder: card.folder || 'Unsorted',
        addedAt: new Date().toISOString()
      });
    }

    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(data, null, 2));
    return { success: true, message: `Added ${card.quantity || 1}x ${card.name}` };
  }

  removeCard(userId = 'default', cardName, quantity = 1) {
    const data = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));
    if (!data.users[userId]) return { success: false, message: 'User not found' };

    const idx = data.users[userId].cards.findIndex(
      c => c.name.toLowerCase() === cardName.toLowerCase()
    );
    if (idx === -1) return { success: false, message: `Card "${cardName}" not found` };

    const card = data.users[userId].cards[idx];
    if (card.quantity <= quantity) {
      data.users[userId].cards.splice(idx, 1);
    } else {
      card.quantity -= quantity;
    }

    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(data, null, 2));
    return { success: true, message: `Removed ${quantity}x ${cardName}` };
  }

  searchInventory(userId = 'default', query) {
    const cards = this.getInventory(userId);
    const q = query.toLowerCase();
    return cards.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.type?.toLowerCase().includes(q) ||
      c.folder?.toLowerCase().includes(q) ||
      c.colors?.some(col => col.toLowerCase().includes(q))
    );
  }

  moveCard(userId = 'default', cardName, targetFolder, quantity = null) {
    const data = JSON.parse(fs.readFileSync(INVENTORY_FILE, 'utf-8'));
    if (!data.users[userId]) return { success: false, message: 'User not found' };

    const matchingCards = data.users[userId].cards.filter(
      c => c.name.toLowerCase().includes(cardName.toLowerCase())
    );

    if (matchingCards.length === 0) {
      return { success: false, message: `No cards matching "${cardName}" found` };
    }

    let movedCount = 0;
    for (const card of matchingCards) {
      if (quantity === null) {
        card.folder = targetFolder;
        movedCount += card.quantity || 1;
      } else if (quantity > 0) {
        const toMove = Math.min(quantity, card.quantity || 1);
        if (toMove >= card.quantity) {
          card.folder = targetFolder;
        } else {
          card.quantity -= toMove;
          data.users[userId].cards.push({
            ...card,
            id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            quantity: toMove,
            folder: targetFolder
          });
        }
        movedCount += toMove;
        quantity -= toMove;
      }
    }

    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(data, null, 2));
    return { success: true, message: `Moved ${movedCount}x ${cardName} to "${targetFolder}"`, movedCount };
  }

  getFolders(userId = 'default') {
    const cards = this.getInventory(userId);
    return [...new Set(cards.map(c => c.folder || 'Unsorted'))];
  }

  // ============ DECKS ============

  getDecks(userId = 'default') {
    const data = JSON.parse(fs.readFileSync(DECKS_FILE, 'utf-8'));
    return data.users[userId]?.decks || [];
  }

  getDeck(userId = 'default', deckId) {
    return this.getDecks(userId).find(
      d => d.id === deckId || d.name.toLowerCase() === deckId.toLowerCase()
    );
  }

  createDeck(userId = 'default', deck) {
    const data = JSON.parse(fs.readFileSync(DECKS_FILE, 'utf-8'));
    if (!data.users[userId]) data.users[userId] = { decks: [] };

    const newDeck = {
      id: `deck_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: deck.name,
      commander: deck.commander || null,
      format: deck.format || 'commander',
      cards: deck.cards || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.users[userId].decks.push(newDeck);
    fs.writeFileSync(DECKS_FILE, JSON.stringify(data, null, 2));
    return { success: true, deck: newDeck, message: `Created deck "${deck.name}"` };
  }

  updateDeck(userId = 'default', deckId, updates) {
    const data = JSON.parse(fs.readFileSync(DECKS_FILE, 'utf-8'));
    if (!data.users[userId]) return { success: false, message: 'User not found' };

    const deck = data.users[userId].decks.find(
      d => d.id === deckId || d.name.toLowerCase() === deckId.toLowerCase()
    );
    if (!deck) return { success: false, message: `Deck "${deckId}" not found` };

    Object.assign(deck, updates, { updatedAt: new Date().toISOString() });
    fs.writeFileSync(DECKS_FILE, JSON.stringify(data, null, 2));
    return { success: true, deck, message: `Updated deck "${deck.name}"` };
  }

  addCardToDeck(userId = 'default', deckId, card) {
    const data = JSON.parse(fs.readFileSync(DECKS_FILE, 'utf-8'));
    const deck = data.users[userId]?.decks?.find(
      d => d.id === deckId || d.name.toLowerCase() === deckId.toLowerCase()
    );
    if (!deck) return { success: false, message: `Deck "${deckId}" not found` };

    const existing = deck.cards.find(c => c.name.toLowerCase() === card.name.toLowerCase());
    if (existing) {
      existing.quantity = (existing.quantity || 1) + (card.quantity || 1);
    } else {
      deck.cards.push({ ...card, quantity: card.quantity || 1 });
    }

    deck.updatedAt = new Date().toISOString();
    fs.writeFileSync(DECKS_FILE, JSON.stringify(data, null, 2));
    return { success: true, message: `Added ${card.quantity || 1}x ${card.name} to ${deck.name}` };
  }

  removeCardFromDeck(userId = 'default', deckId, cardName, quantity = 1) {
    const data = JSON.parse(fs.readFileSync(DECKS_FILE, 'utf-8'));
    const deck = data.users[userId]?.decks?.find(
      d => d.id === deckId || d.name.toLowerCase() === deckId.toLowerCase()
    );
    if (!deck) return { success: false, message: `Deck "${deckId}" not found` };

    const idx = deck.cards.findIndex(c => c.name.toLowerCase() === cardName.toLowerCase());
    if (idx === -1) return { success: false, message: `Card "${cardName}" not in deck` };

    if (deck.cards[idx].quantity <= quantity) {
      deck.cards.splice(idx, 1);
    } else {
      deck.cards[idx].quantity -= quantity;
    }

    deck.updatedAt = new Date().toISOString();
    fs.writeFileSync(DECKS_FILE, JSON.stringify(data, null, 2));
    return { success: true, message: `Removed ${quantity}x ${cardName} from ${deck.name}` };
  }

  deleteDeck(userId = 'default', deckId) {
    const data = JSON.parse(fs.readFileSync(DECKS_FILE, 'utf-8'));
    if (!data.users[userId]) return { success: false, message: 'User not found' };

    const idx = data.users[userId].decks.findIndex(
      d => d.id === deckId || d.name.toLowerCase() === deckId.toLowerCase()
    );
    if (idx === -1) return { success: false, message: `Deck "${deckId}" not found` };

    const removed = data.users[userId].decks.splice(idx, 1);
    fs.writeFileSync(DECKS_FILE, JSON.stringify(data, null, 2));
    return { success: true, message: `Deleted deck "${removed[0].name}"` };
  }

  // ============ SALES ============

  recordSale(userId = 'default', sale) {
    const data = JSON.parse(fs.readFileSync(SALES_FILE, 'utf-8'));

    const newSale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      userId,
      cardName: sale.cardName,
      quantity: sale.quantity || 1,
      price: sale.price,
      pricePerCard: sale.price / (sale.quantity || 1),
      soldAt: new Date().toISOString()
    };

    data.sales.push(newSale);
    fs.writeFileSync(SALES_FILE, JSON.stringify(data, null, 2));

    // Remove from inventory
    this.removeCard(userId, sale.cardName, sale.quantity || 1);

    return { success: true, sale: newSale, message: `Recorded sale of ${sale.quantity || 1}x ${sale.cardName} for $${sale.price}` };
  }

  getSales(userId = 'default') {
    const data = JSON.parse(fs.readFileSync(SALES_FILE, 'utf-8'));
    return userId ? data.sales.filter(s => s.userId === userId) : data.sales;
  }
}

export const store = new DataStore();
export default store;
