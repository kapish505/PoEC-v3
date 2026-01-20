/**
 * PoEC API Client - Wrapper for backend API calls.
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

export interface AnalysisResult {
    snapshot: any;
    anomalies: any[];
    results_hash: string;
    model_hash: string;
    graph_data: any;
    execution_metadata?: {
        analysis_mode: string;
        gnn_enabled: boolean;
    };
}

export interface ProofBuildResult {
    success: boolean;
    task_id: string;
    merkle_root: string;
    dataset_hash: string;
    model_hash: string;
    bundle_cid: string;
    anomaly_count: number;
    timestamp: string;
}

export class PoECClient {
    private client: AxiosInstance;

    constructor(baseURL: string) {
        this.client = axios.create({
            baseURL,
            timeout: 120000, // 2 minute timeout for analysis
        });
    }

    /**
     * Upload CSV file to PoEC backend.
     */
    async ingestCSV(csvBuffer: Buffer, filename: string = 'data.csv'): Promise<{ batch_id: string; content_hash: string }> {
        const formData = new FormData();
        formData.append('file', csvBuffer, {
            filename,
            contentType: 'text/csv',
        });

        const response = await this.client.post('/api/v1/ingest', formData, {
            headers: formData.getHeaders(),
        });

        return response.data;
    }

    /**
     * Run analysis on ingested data.
     */
    async runAnalysis(): Promise<AnalysisResult> {
        const response = await this.client.post('/api/v1/analyze');
        return response.data;
    }

    /**
     * Build proof bundle from analysis results.
     */
    async buildProof(datasetHash: string, modelHash: string, taskId?: string): Promise<ProofBuildResult> {
        const response = await this.client.post('/api/v2/proof/build', {
            dataset_hash: datasetHash,
            model_hash: modelHash,
            task_id: taskId,
        });

        return response.data;
    }

    /**
     * Get v2 configuration and limits.
     */
    async getConfig(): Promise<any> {
        const response = await this.client.get('/api/v2/config');
        return response.data;
    }

    /**
     * Verify Merkle proof on backend.
     */
    async verifyMerkleProof(leaf: string, proofPath: any[], expectedRoot: string): Promise<boolean> {
        const response = await this.client.post('/api/v2/verify/merkle', {
            leaf,
            proof_path: proofPath,
            expected_root: expectedRoot,
        });

        return response.data.valid;
    }
}
