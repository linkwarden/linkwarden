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
    /**
     * Id of collection or tag to drop into.
     */
    id?: string;
    /**
     * Name of collection or tag to drop into.
     */
    name?: string;
    ownerId?: string;
    type?: "collection" | "tag";
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
