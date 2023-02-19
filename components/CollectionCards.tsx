import useCollectionSlice from "@/store/collection";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

export default function Collections() {
  const { collections } = useCollectionSlice();

  return (
    <div className="flex flex-wrap">
      {collections.map((e, i) => {
        const formattedDate = new Date(e.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return (
          <div
            className="p-5 bg-gray-100 m-2 h-40 w-60 rounded border-sky-100 border-solid border flex flex-col justify-between cursor-pointer hover:shadow duration-100"
            key={i}
          >
            <div className="flex justify-between text-sky-900">
              <p className="text-lg w-max">{e.name}</p>
              <FontAwesomeIcon icon={faChevronRight} className="w-3" />
            </div>
            <p className="text-sm text-sky-300">{formattedDate}</p>
          </div>
        );
      })}
    </div>
  );
}
