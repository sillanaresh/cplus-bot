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

    console.log(`📡 API Request: ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`📥 API Response: ${response.status} ${response.statusText}`);

    if (response.status === 401 || response.status === 403) {
      throw new Error('Session expired. Please re-authenticate.');
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error Response Body:`, errorText);
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ API Response Data:`, JSON.stringify(data).substring(0, 200) + '...');
    return data;
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

  /**
   * Save or update a dataflow with blocks and configuration
   */
  async saveDataflow(dataflowConfig: {
    dataflowUuid: string;
    description: string;
    schedule: string;
    blocks: Array<{
      id: string;
      blockId: string;
      blockName: string;
      blockType: string;
      destinationBlockIds: string[];
      blockInputs: any[];
    }>;
  }) {
    return this.makeRequest('/dataflows', {
      method: 'PUT',
      body: JSON.stringify(dataflowConfig),
    });
  }

  /**
   * Create a complete dataflow with just block IDs (simplified helper)
   * This handles all the complexity: creating canvas, fetching metadata, and saving
   */
  async createSimpleDataflow(params: {
    name: string;
    blockIds: number[];
  }) {
    try {
      console.log('🚀 Starting createSimpleDataflow:', params);

      // Step 1: Create canvas with unique name
      // Add short random ID to ensure uniqueness (6 characters)
      const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const uniqueName = `${params.name} ${randomId}`;

      console.log('📝 Creating canvas...');
      const canvasResponse = await this.createDataflowCanvas(uniqueName);
      const dataflowUuid = canvasResponse.dataflowId;
      console.log('✅ Canvas created:', dataflowUuid);

      // Step 2: Fetch metadata for each block
      console.log('📦 Fetching metadata for blocks:', params.blockIds);
      const blockMetadataPromises = params.blockIds.map(blockId =>
        this.getBlockMetadata(blockId)
      );
      const blocksMetadata = await Promise.all(blockMetadataPromises);
      console.log('✅ Metadata fetched for', blocksMetadata.length, 'blocks');

      // Step 3: Build blocks array
      const blocks = blocksMetadata.map((metadata, index) => {
        const blockId = params.blockIds[index];
        const isLastBlock = index === blocksMetadata.length - 1;

        return {
          id: `block${index + 1}`,
          blockId: String(blockId),
          blockName: this.generateBlockName(metadata.type),
          blockType: metadata.type,
          destinationBlockIds: isLastBlock ? [] : [`block${index + 2}`],
          blockInputs: metadata.blockInputs,
        };
      });
      console.log('🔗 Built blocks array:', blocks.map(b => b.blockType).join(' → '));

      // Step 4: Generate description
      const blockTypes = blocksMetadata.map(m => m.type).join(' → ');
      const description = `Pipeline: ${blockTypes}`;

      // Step 5: Save the dataflow
      console.log('💾 Saving dataflow...');
      const result = await this.saveDataflow({
        dataflowUuid,
        description,
        schedule: '0/1 0 * * * ? *',
        blocks,
      });
      console.log('✅ Dataflow saved successfully:', result);

      return result;
    } catch (error: any) {
      console.error('❌ Error in createSimpleDataflow:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Generate a friendly block name from block type
   */
  private generateBlockName(blockType: string): string {
    const nameMap: { [key: string]: string } = {
      'sftp_read': 'SFTP-Source',
      'sftp_write': 'SFTP-Destination',
      's3_read': 'S3-Source',
      's3_write': 'S3-Destination',
      'http_write': 'API-Writer',
      'http_read': 'API-Reader',
      'convert_csv_to_json': 'CSV-to-JSON',
      'neo_block': 'Transform',
      'kafka_read': 'Kafka-Source',
      'kafka_write': 'Kafka-Destination',
    };

    return nameMap[blockType] || blockType.replace(/_/g, '-').toUpperCase();
  }
}
