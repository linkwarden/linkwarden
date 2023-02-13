import { useSession } from "next-auth/react";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { useState } from "react";

export default function Sidebar() {
  const { data: session, status } = useSession();

  const [addCollection, setAddCollection] = useState(false);

  const user = session?.user;

  const toggleAddCollection = () => {
    setAddCollection(!addCollection);
  };

  const submitCollection = async (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    const collectionName: string = (event.target as HTMLInputElement).value;

    if (event.key === "Enter" && collectionName) {
      await fetch("/api/routes/collections/postCollection", {
        body: JSON.stringify({ collectionName }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
        .then((res) => res.json())
        .then((data) => console.log(data));
    }
  };

  return (
    <div className="fixed bg-gray-200 top-0 bottom-0 left-0 w-80 p-5">
      <div className="flex justify-between gap-5 items-center h-9">
        <p>{user?.name}</p>

        {addCollection ? (
          <ClickAwayHandler onClickOutside={toggleAddCollection}>
            <input
              type="text"
              placeholder="Enter Collection Name"
              className="w-48 rounded p-2"
              onKeyDown={submitCollection}
              autoFocus
            />
          </ClickAwayHandler>
        ) : (
          <div
            onClick={toggleAddCollection}
            className="select-none cursor-pointer bg-white rounded p-2"
          >
            Create Collection +
          </div>
        )}
      </div>
    </div>
  );
}
