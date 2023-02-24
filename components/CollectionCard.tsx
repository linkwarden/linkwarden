import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Collection } from "@prisma/client";

export default function ({ collection }: { collection: Collection }) {
  const formattedDate = new Date(collection.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-5 bg-gray-100 m-2 h-40 w-60 rounded border-sky-100 border-solid border flex flex-col justify-between cursor-pointer hover:bg-gray-50 duration-100">
      <div className="flex justify-between text-sky-900 items-center">
        <p className="text-lg w-max">{collection.name}</p>
        <FontAwesomeIcon icon={faChevronRight} className="w-3" />
      </div>
      <p className="text-sm text-sky-300 font-bold">{formattedDate}</p>
    </div>
  );
}
