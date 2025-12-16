import { Database } from "bun:sqlite";

const db = new Database(process.env.SQLITE_DB_NAME, { create: true });

// Initialize the accounts table
db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
        user_id TEXT PRIMARY KEY,
        balance INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )
`);

// Prepared statements for better performance
const getBalanceStmt = db.prepare("SELECT balance FROM accounts WHERE user_id = ?");
const createAccountStmt = db.prepare("INSERT INTO accounts (user_id, balance) VALUES (?, ?)");
const updateBalanceStmt = db.prepare("UPDATE accounts SET balance = ?, updated_at = strftime('%s', 'now') WHERE user_id = ?");
const addBalanceStmt = db.prepare("UPDATE accounts SET balance = balance + ?, updated_at = strftime('%s', 'now') WHERE user_id = ?");

/**
 * Get the balance for a user, creating an account if it doesn't exist
 */
export function getBalance(userId: string): number {
    const result = getBalanceStmt.get(userId) as { balance: number } | undefined;
    
    if (!result) {
        // Create account with 0 balance
        createAccountStmt.run(userId, 0);
        return 0;
    }
    
    return result.balance;
}

/**
 * Add currency to a user's account
 */
export function addBalance(userId: string, amount: number): number {
    // Ensure account exists
    getBalance(userId);
    
    addBalanceStmt.run(amount, userId);
    return getBalance(userId);
}

/**
 * Subtract currency from a user's account
 * Returns the new balance, or null if insufficient funds
 */
export function subtractBalance(userId: string, amount: number): number | null {
    const currentBalance = getBalance(userId);
    
    if (currentBalance < amount) {
        return null; // Insufficient funds
    }
    
    addBalanceStmt.run(-amount, userId);
    return getBalance(userId);
}

/**
 * Set a user's balance to a specific amount
 */
export function setBalance(userId: string, amount: number): number {
    // Ensure account exists
    getBalance(userId);
    
    updateBalanceStmt.run(amount, userId);
    return amount;
}

/**
 * Transfer currency from one user to another
 * Returns true if successful, false if insufficient funds
 */
export function transferBalance(fromUserId: string, toUserId: string, amount: number): boolean {
    const newBalance = subtractBalance(fromUserId, amount);
    
    if (newBalance === null) {
        return false; // Insufficient funds
    }
    
    addBalance(toUserId, amount);
    return true;
}
