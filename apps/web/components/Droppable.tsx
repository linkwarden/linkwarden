import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";

const Droppable = ({
  children,
  id,
  data,
  className,
}: {
  children: React.ReactNode;
  id: string;
  data?: {
    collectionId?: string;
    collectionName?: string;
    ownerId?: string;
  };
  className?: string;
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data,
  });

  const extraProps = isOver ? { "data-over": "" } : {};
  return (
    <div
      ref={setNodeRef}
      className={cn(
        isOver &&
          "bg-primary/10 outline-2 outline-dashed outline-primary rounded-lg",
        "transition-colors duration-200",
        className
      )}
      {...extraProps}
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
