import fs from 'fs/promises'
import path from 'path'

export interface HybridLogEntry {
    hybridId: string
    customerId: string
    pixPaymentId: string | null
    pixStatus: string
    pixValue: number
    cardPaymentId: string | null
    cardStatus: string | null
    cardValue: number | null
    userAgent: string
    createdAt: string
    expiresAt: string
}

const LOG_FILE_PATH = path.join(process.cwd(), 'data', 'hybrid_logs.json')

export async function ensureLogFile() {
    try {
        await fs.access(LOG_FILE_PATH)
    } catch {
        // Create directory if it doesn't exist just in case
        await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true })
        await fs.writeFile(LOG_FILE_PATH, JSON.stringify([]), 'utf-8')
    }
}

export async function readHybridLogs(): Promise<HybridLogEntry[]> {
    await ensureLogFile()
    const data = await fs.readFile(LOG_FILE_PATH, 'utf-8')
    try {
        return JSON.parse(data)
    } catch {
        return []
    }
}

export async function writeHybridLogs(logs: HybridLogEntry[]): Promise<void> {
    await ensureLogFile()
    await fs.writeFile(LOG_FILE_PATH, JSON.stringify(logs, null, 2), 'utf-8')
}

export async function saveHybridLog(entry: HybridLogEntry): Promise<void> {
    const logs = await readHybridLogs()

    // Check if exists
    const existingIndex = logs.findIndex(l => l.hybridId === entry.hybridId)
    if (existingIndex >= 0) {
        logs[existingIndex] = { ...logs[existingIndex], ...entry }
    } else {
        logs.push(entry)
    }

    await writeHybridLogs(logs)
}

export async function getHybridLog(hybridId: string): Promise<HybridLogEntry | null> {
    const logs = await readHybridLogs()
    return logs.find(l => l.hybridId === hybridId) || null
}

export async function getLogByPixId(pixPaymentId: string): Promise<HybridLogEntry | null> {
    const logs = await readHybridLogs()
    return logs.find(l => l.pixPaymentId === pixPaymentId) || null
}

export async function updateHybridLogStatus(hybridId: string, updates: Partial<HybridLogEntry>): Promise<void> {
    const logs = await readHybridLogs()
    const existingIndex = logs.findIndex(l => l.hybridId === hybridId)

    if (existingIndex >= 0) {
        logs[existingIndex] = { ...logs[existingIndex], ...updates }
        await writeHybridLogs(logs)
    }
}
