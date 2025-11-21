import { useCallback, useState, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  Node,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import "./App.css";
import ItemNode from "./ItemNode";
import PaginationNode from "./PaginationNode";
import DividerNode from "./DividerNode";

const ITEMS_PER_PAGE = 5;
const TOTAL_ITEMS = 20;

const createNodes = (
  leftPage: number,
  rightPage: number,
  handleLeftPrev: () => void,
  handleLeftNext: () => void,
  handleRightPrev: () => void,
  handleRightNext: () => void,
  totalPages: number,
  edges: any[]
): Node[] => {
  const nodes: Node[] = [];
  const leftX = 50;
  const rightX = 500;
  const startY = 50;
  const itemHeight = 40;
  const itemSpacing = 10;
  const containerPadding = 30;
  const paginationHeight = 50;
  const dividerHeight = 30;

  // Determine which items need to be visible based on connections
  const leftStart = leftPage * ITEMS_PER_PAGE;
  const leftEnd = Math.min(leftStart + ITEMS_PER_PAGE, TOTAL_ITEMS);
  const rightStart = rightPage * ITEMS_PER_PAGE;
  const rightEnd = Math.min(rightStart + ITEMS_PER_PAGE, TOTAL_ITEMS);

  // Get connected items
  const connectedLeftItems = new Set<number>();
  const connectedRightItems = new Set<number>();

  edges.forEach((edge) => {
    const sourceId = parseInt(edge.source.split("-")[1]);
    const targetId = parseInt(edge.target.split("-")[1]);

    // If source is in current left page, mark target as needed
    if (sourceId >= leftStart && sourceId < leftEnd) {
      connectedRightItems.add(targetId);
    }

    // If target is in current right page, mark source as needed
    if (targetId >= rightStart && targetId < rightEnd) {
      connectedLeftItems.add(sourceId);
    }
  });

  // Determine which items to show
  const leftItemsToShow = new Set<number>();
  const rightItemsToShow = new Set<number>();

  // Add items in current page
  for (let i = leftStart; i < leftEnd; i++) {
    leftItemsToShow.add(i);
  }
  for (let i = rightStart; i < rightEnd; i++) {
    rightItemsToShow.add(i);
  }

  // Add connected items
  connectedLeftItems.forEach((id) => leftItemsToShow.add(id));
  connectedRightItems.forEach((id) => rightItemsToShow.add(id));

  // Count pinned items for each container
  const leftPinnedCount = Array.from(leftItemsToShow).filter(
    (i) => i < leftStart || i >= leftEnd
  ).length;
  const rightPinnedCount = Array.from(rightItemsToShow).filter(
    (i) => i < rightStart || i >= rightEnd
  ).length;

  // Calculate container heights dynamically
  const leftContainerHeight =
    ITEMS_PER_PAGE * (itemHeight + itemSpacing) +
    (leftPinnedCount > 0
      ? dividerHeight + leftPinnedCount * (itemHeight + itemSpacing)
      : 0) +
    containerPadding * 2 +
    paginationHeight;

  const rightContainerHeight =
    ITEMS_PER_PAGE * (itemHeight + itemSpacing) +
    (rightPinnedCount > 0
      ? dividerHeight + rightPinnedCount * (itemHeight + itemSpacing)
      : 0) +
    containerPadding * 2 +
    paginationHeight;

  // Add left container border node
  nodes.push({
    id: "left-container",
    type: "group",
    position: { x: leftX, y: startY },
    style: {
      width: 240,
      height: leftContainerHeight,
      backgroundColor: "rgba(240, 240, 255, 0.5)",
      border: "2px solid #4a5568",
      borderRadius: "10px",
      padding: `${containerPadding}px`,
    },
    data: { label: "Left Container" },
    draggable: true,
    selectable: false,
  });

  // Add right container border node
  nodes.push({
    id: "right-container",
    type: "group",
    position: { x: rightX, y: startY },
    style: {
      width: 240,
      height: rightContainerHeight,
      backgroundColor: "rgba(240, 255, 240, 0.5)",
      border: "2px solid #4a5568",
      borderRadius: "10px",
      padding: `${containerPadding}px`,
    },
    data: { label: "Right Container" },
    draggable: true,
    selectable: false,
  });

  // Create items for left container
  const leftItemsArray = Array.from(leftItemsToShow).sort((a, b) => a - b);
  const leftCurrentPageItems = leftItemsArray.filter(
    (i) => i >= leftStart && i < leftEnd
  );
  const leftPinnedItems = leftItemsArray.filter(
    (i) => i < leftStart || i >= leftEnd
  );

  // Add current page items
  leftCurrentPageItems.forEach((i) => {
    nodes.push({
      id: `left-${i}`,
      type: "itemNode",
      position: {
        x: containerPadding,
        y: containerPadding + (i - leftStart) * (itemHeight + itemSpacing),
      },
      data: {
        label: `Left Item ${i}`,
        container: "left",
        isPinned: false,
      },
      parentId: "left-container",
      extent: "parent" as const,
      draggable: false,
    });
  });

  // Add divider if there are pinned items
  if (leftPinnedItems.length > 0) {
    nodes.push({
      id: "left-divider",
      type: "dividerNode",
      position: {
        x: containerPadding,
        y: containerPadding + ITEMS_PER_PAGE * (itemHeight + itemSpacing),
      },
      data: {},
      parentId: "left-container",
      draggable: false,
      selectable: false,
    });
  }

  // Add pinned items
  leftPinnedItems.forEach((i, index) => {
    const yOffset =
      containerPadding +
      ITEMS_PER_PAGE * (itemHeight + itemSpacing) +
      dividerHeight +
      index * (itemHeight + itemSpacing);
    nodes.push({
      id: `left-${i}`,
      type: "itemNode",
      position: { x: containerPadding, y: yOffset },
      data: {
        label: `Left Item ${i} 📌`,
        container: "left",
        isPinned: true,
      },
      parentId: "left-container",
      extent: "parent" as const,
      draggable: false,
      style: {
        backgroundColor: "#fff3cd",
        borderColor: "#856404",
      },
    });
  });

  // Create items for right container
  const rightItemsArray = Array.from(rightItemsToShow).sort((a, b) => a - b);
  const rightCurrentPageItems = rightItemsArray.filter(
    (i) => i >= rightStart && i < rightEnd
  );
  const rightPinnedItems = rightItemsArray.filter(
    (i) => i < rightStart || i >= rightEnd
  );

  // Add current page items
  rightCurrentPageItems.forEach((i) => {
    nodes.push({
      id: `right-${i}`,
      type: "itemNode",
      position: {
        x: containerPadding,
        y: containerPadding + (i - rightStart) * (itemHeight + itemSpacing),
      },
      data: {
        label: `Right Item ${i}`,
        container: "right",
        isPinned: false,
      },
      parentId: "right-container",
      extent: "parent" as const,
      draggable: false,
    });
  });

  // Add divider if there are pinned items
  if (rightPinnedItems.length > 0) {
    nodes.push({
      id: "right-divider",
      type: "dividerNode",
      position: {
        x: containerPadding,
        y: containerPadding + ITEMS_PER_PAGE * (itemHeight + itemSpacing),
      },
      data: {},
      parentId: "right-container",
      draggable: false,
      selectable: false,
    });
  }

  // Add pinned items
  rightPinnedItems.forEach((i, index) => {
    const yOffset =
      containerPadding +
      ITEMS_PER_PAGE * (itemHeight + itemSpacing) +
      dividerHeight +
      index * (itemHeight + itemSpacing);
    nodes.push({
      id: `right-${i}`,
      type: "itemNode",
      position: { x: containerPadding, y: yOffset },
      data: {
        label: `Right Item ${i} 📌`,
        container: "right",
        isPinned: true,
      },
      parentId: "right-container",
      extent: "parent" as const,
      draggable: false,
      style: {
        backgroundColor: "#fff3cd",
        borderColor: "#856404",
      },
    });
  });

  // Add left pagination node
  nodes.push({
    id: "left-pagination",
    type: "paginationNode",
    position: {
      x: containerPadding,
      y: leftContainerHeight - paginationHeight - 10,
    },
    data: {
      currentPage: leftPage,
      totalPages: totalPages,
      onPrev: handleLeftPrev,
      onNext: handleLeftNext,
    },
    parentId: "left-container",
    draggable: false,
    selectable: false,
    style: {
      zIndex: 1000,
      pointerEvents: "all",
    },
  });

  // Add right pagination node
  nodes.push({
    id: "right-pagination",
    type: "paginationNode",
    position: {
      x: containerPadding,
      y: rightContainerHeight - paginationHeight - 10,
    },
    data: {
      currentPage: rightPage,
      totalPages: totalPages,
      onPrev: handleRightPrev,
      onNext: handleRightNext,
    },
    parentId: "right-container",
    draggable: false,
    selectable: false,
    style: {
      zIndex: 1000,
      pointerEvents: "all",
    },
  });

  return nodes;
};

const nodeTypes = {
  itemNode: ItemNode,
  paginationNode: PaginationNode,
  dividerNode: DividerNode,
};

const initialEdges: any[] = [];

function App() {
  const [leftPage, setLeftPage] = useState(0);
  const [rightPage, setRightPage] = useState(0);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const totalPages = Math.ceil(TOTAL_ITEMS / ITEMS_PER_PAGE);

  const handleLeftPrev = useCallback(() => {
    if (leftPage > 0) setLeftPage(leftPage - 1);
  }, [leftPage]);

  const handleLeftNext = useCallback(() => {
    if (leftPage < totalPages - 1) setLeftPage(leftPage + 1);
  }, [leftPage, totalPages]);

  const handleRightPrev = useCallback(() => {
    if (rightPage > 0) setRightPage(rightPage - 1);
  }, [rightPage]);

  const handleRightNext = useCallback(() => {
    if (rightPage < totalPages - 1) setRightPage(rightPage + 1);
  }, [rightPage, totalPages]);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    createNodes(
      0,
      0,
      handleLeftPrev,
      handleLeftNext,
      handleRightPrev,
      handleRightNext,
      totalPages,
      []
    )
  );

  useEffect(() => {
    setNodes(
      createNodes(
        leftPage,
        rightPage,
        handleLeftPrev,
        handleLeftNext,
        handleRightPrev,
        handleRightNext,
        totalPages,
        edges
      )
    );
  }, [
    leftPage,
    rightPage,
    setNodes,
    handleLeftPrev,
    handleLeftNext,
    handleRightPrev,
    handleRightNext,
    totalPages,
    edges,
  ]);

  const onConnect = useCallback(
    (params: Connection) => {
      // Only allow connections from left to right
      if (
        params.source?.startsWith("left-") &&
        params.target?.startsWith("right-")
      ) {
        setEdges((eds) => addEdge(params, eds));
      }
    },
    [setEdges]
  );

  console.log({ nodes, edges });

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        elementsSelectable={true}
      >
        <Controls />
        <MiniMap />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default App;
