interface PaginationNodeProps {
  data: {
    currentPage: number;
    totalPages: number;
    onPrev: () => void;
    onNext: () => void;
  };
}

function PaginationNode({ data }: PaginationNodeProps) {
  return (
    <div className="pagination-node">
      <button
        onClick={data.onPrev}
        disabled={data.currentPage === 0}
        className="pagination-btn"
      >
        Previous
      </button>
      <span className="pagination-page-info">
        Page {data.currentPage + 1} of {data.totalPages}
      </span>
      <button
        onClick={data.onNext}
        disabled={data.currentPage === data.totalPages - 1}
        className="pagination-btn"
      >
        Next
      </button>
    </div>
  );
}

export default PaginationNode;
