import { Handle, Position } from '@xyflow/react';

interface ItemNodeProps {
  data: {
    label: string;
    container: 'left' | 'right';
  };
}

function ItemNode({ data }: ItemNodeProps) {
  return (
    <div className="item-node">
      {data.container === 'left' && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: '#555' }}
        />
      )}
      <div className="item-content">{data.label}</div>
      {data.container === 'right' && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: '#555' }}
        />
      )}
    </div>
  );
}

export default ItemNode;
