import { useDroppable } from "@dnd-kit/core";

const Droppable = ({
  children,
  id,
  data,
}: {
  children: React.ReactNode;
  id: string;
  data?: {
    collectionId?: string;
    collectionName?: string;
    ownerId?: string;
  };
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data,
  });

  return (
    <div
      ref={setNodeRef}
      className={`${
        isOver
          ? "bg-primary/10 border-2 border-dashed border-primary rounded-lg"
          : ""
      } transition-colors duration-200 p-2 min-h-20`}
      style={{
        position: "relative",
        zIndex: isOver ? 1 : "auto",
      }}
    >
      {children}
    </div>
  );
};

export default Droppable;
