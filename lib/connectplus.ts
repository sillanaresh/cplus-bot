const BASE_URL = 'https://eucrm.connectplus.capillarytech.com/api/v3';

export interface ConnectPlusAuth {
  cookie: string;
  orgId: string;
}

export class ConnectPlusClient {
  private auth: ConnectPlusAuth;

  constructor(auth: ConnectPlusAuth) {
    this.auth = auth;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-CAP-API-AUTH-ORG-ID': this.auth.orgId,
      'Cookie': this.auth.cookie,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('Session expired. Please re-authenticate.');
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get all available blocks
   */
  async getAllBlocks() {
    return this.makeRequest('/blocks', {
      method: 'GET',
      headers: {
        'Content-Length': '0',
      },
    });
  }

  /**
   * Get metadata for a specific block
   */
  async getBlockMetadata(blockId: number) {
    return this.makeRequest(`/blocks/${blockId}/metadata`, {
      method: 'GET',
    });
  }

  /**
   * Create an empty canvas for dataflow
   */
  async createDataflowCanvas(name: string) {
    return this.makeRequest(`/dataflows/canvas?name=${encodeURIComponent(name)}`, {
      method: 'POST',
    });
  }

  /**
   * Get basic details of an existing dataflow
   */
  async getDataflow(dataflowId: string) {
    return this.makeRequest(`/dataflows/${dataflowId}`, {
      method: 'GET',
    });
  }

  /**
   * Get full details of an existing dataflow (with values)
   */
  async getDataflowWithValues(dataflowId: string) {
    return this.makeRequest(`/dataflows/${dataflowId}/with-values`, {
      method: 'GET',
    });
  }
}
