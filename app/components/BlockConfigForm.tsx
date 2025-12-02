'use client';

import { useState } from 'react';

interface BlockInput {
  id: string;
  name: string;
  key: string;
  type: string;
  value: any;
  htmlType: string;
  selectValues?: Array<{label: string; value: string}>;
  childrenFields?: any;
}

interface Block {
  id: string;
  blockId: string;
  blockName: string;
  blockType: string;
  destinationBlockIds: string[];
  blockInputs: BlockInput[];
}

interface BlockConfigFormProps {
  dataflowUuid: string;
  dataflowName: string;
  description: string;
  schedule?: string;
  blocks: Block[];
  onSubmit: (updatedBlocks: Block[]) => Promise<void>;
  onCancel: () => void;
}

export default function BlockConfigForm({
  dataflowUuid,
  dataflowName,
  description,
  schedule = '0/1 0 * * * ? *',
  blocks,
  onSubmit,
  onCancel,
}: BlockConfigFormProps) {
  const [formBlocks, setFormBlocks] = useState<Block[]>(blocks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    blockIndex: number,
    inputIndex: number,
    newValue: any
  ) => {
    const updated = [...formBlocks];
    updated[blockIndex].blockInputs[inputIndex].value = newValue;
    setFormBlocks(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(formBlocks);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
      setIsSubmitting(false);
    }
  };

  const renderInput = (input: BlockInput, blockIndex: number, inputIndex: number) => {
    const inputId = `${blockIndex}-${inputIndex}-${input.id}`;

    switch (input.htmlType) {
      case 'password':
        return (
          <input
            id={inputId}
            type="password"
            value={input.value || ''}
            onChange={(e) => handleInputChange(blockIndex, inputIndex, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder={`Enter ${input.name}`}
          />
        );

      case 'select':
        return (
          <select
            id={inputId}
            value={input.value || ''}
            onChange={(e) => handleInputChange(blockIndex, inputIndex, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">-- Select --</option>
            {input.selectValues?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            id={inputId}
            type="number"
            value={input.value || ''}
            onChange={(e) => handleInputChange(blockIndex, inputIndex, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder={`Enter ${input.name}`}
          />
        );

      default: // text
        return (
          <input
            id={inputId}
            type="text"
            value={input.value || ''}
            onChange={(e) => handleInputChange(blockIndex, inputIndex, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder={`Enter ${input.name}`}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configure Dataflow</h2>
          <p className="text-sm text-gray-600 mt-1">{dataflowName}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {formBlocks.map((block, blockIndex) => (
              <div key={block.id} className="mb-6 pb-6 border-b border-gray-200 last:border-b-0">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  {block.blockName}
                  <span className="text-sm text-gray-500 ml-2">({block.blockType})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {block.blockInputs.map((input, inputIndex) => (
                    <div key={input.id} className="flex flex-col">
                      <label
                        htmlFor={`${blockIndex}-${inputIndex}-${input.id}`}
                        className="text-sm font-medium text-gray-700 mb-1"
                      >
                        {input.name}
                        {input.type === 'password' && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {renderInput(input, blockIndex, inputIndex)}
                      <span className="text-xs text-gray-500 mt-1">{input.key}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
