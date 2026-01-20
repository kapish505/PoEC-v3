/**
 * Data source interface for CSV assembly.
 * Agents can implement different strategies for acquiring transaction data.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface DataSource {
    /**
     * Acquire and return CSV file data.
     */
    acquireCSV(): Promise<Buffer>;
}

/**
 * File-based data source - reads CSV from local filesystem.
 */
export class FileDataSource implements DataSource {
    constructor(private filePath: string) { }

    async acquireCSV(): Promise<Buffer> {
        const absolutePath = path.resolve(this.filePath);

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`CSV file not found: ${absolutePath}`);
        }

        return fs.readFileSync(absolutePath);
    }
}

/**
 * Mock API data source - simulates fetching from external API.
 * In production, this would call real APIs and assemble CSV.
 */
export class MockAPIDataSource implements DataSource {
    async acquireCSV(): Promise<Buffer> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock CSV data
        const mockCSV = `transaction_id,source_entity,target_entity,amount,timestamp,transaction_type
T001,A1,A2,10000,2024-01-01,TRANSFER
T002,A2,A3,5000,2024-01-02,TRANSFER
T003,A3,A1,10000,2024-01-03,TRANSFER`;

        return Buffer.from(mockCSV, 'utf-8');
    }
}
