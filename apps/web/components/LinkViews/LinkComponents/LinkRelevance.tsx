import { Star } from "@phosphor-icons/react";

type Props = {
  relevance?: number;
};

function LinkRelevance({ relevance = 0 }: Props) {
  return (
    <div className="flex items-center gap-1">
      <p className="text-neutral text-sm">{relevance}</p>
      <Star
        className={"text-yellow-400 fill-yellow-400"}
        weight={"fill"}
        size={14}
      />
    </div>
  );
}

export default LinkRelevance;
