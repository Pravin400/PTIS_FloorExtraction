'use client';

import { ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface RuleBlockControlsProps {
  index: number;
  totalBlocks: number;
  onMoveRuleBlock: (index: number, direction: 'up' | 'down') => void;
  onRemoveRuleBlock: (index: number) => void;
}

export default function RuleBlockControls({
  index,
  totalBlocks,
  onMoveRuleBlock,
  onRemoveRuleBlock,
}: RuleBlockControlsProps) {
  return (
    <>
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMoveRuleBlock(index, 'up')}
        className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Move Up"
      >
        <ArrowUp className="w-4 h-4 text-zinc-600" />
      </button>

      <button
        type="button"
        disabled={index === totalBlocks - 1}
        onClick={() => onMoveRuleBlock(index, 'down')}
        className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Move Down"
      >
        <ArrowDown className="w-4 h-4 text-zinc-600" />
      </button>

      <button
        type="button"
        disabled={totalBlocks <= 1}
        onClick={() => onRemoveRuleBlock(index)}
        className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Remove Rule"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </>
  );
}
