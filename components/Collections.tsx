import { useEffect, useState } from "react";

interface Collections {
  id: number;
  name: string;
  createdAt: string;
}

export default function Collections() {
  const [collections, setCollections] = useState<Collections[]>([]);
  useEffect(() => {
    fetch("/api/routes/collections/getCollections")
      .then((res) => res.json())
      .then((data) => setCollections(data.response));
  }, []);

  return (
    <div className="flex flex-wrap">
      {collections.map((e, i) => {
        return (
          <div className="p-5 bg-gray-200 m-2 w-max rounded" key={i}>
            <p>{e.name}</p>
          </div>
        );
      })}
    </div>
  );
}
