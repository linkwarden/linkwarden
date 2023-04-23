// Copyright (C) 2022-present Daniel31x13 <daniel31x13@gmail.com>
// This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
// This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
// You should have received a copy of the GNU General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.

// import React, { useState } from "react";
// import CollectionSelection from "@/components/InputSelect/CollectionSelection";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faPlus } from "@fortawesome/free-solid-svg-icons";
// import useCollectionStore from "@/store/collections";

// type Props = {
//   toggleCollectionModal: Function;
// };

// export default function AddCollection({ toggleCollectionModal }: Props) {
//   const [newCollection, setNewCollection] = useState({
//     name: "",
//     ownerId: undefined,
//   });

//   const { addCollection } = useCollectionStore();

//   const setCollectionOwner = (e: any) => {
//     if (e?.__isNew__) e.value = null;

//     setNewCollection({
//       ...newCollection,
//       ownerId: e?.value,
//     });
//   };

//   return (
//     <div className="flex flex-col gap-3 sm:w-[35rem] w-80">
//       <p className="font-bold text-sky-300 mb-2 text-center">New Collection</p>

//       <div className="flex gap-5 items-center justify-between">
//         <p className="text-sm font-bold text-sky-300">Name</p>
//         <input
//           value={newCollection.name}
//           onChange={(e) =>
//             setNewCollection({ ...newCollection, name: e.target.value })
//           }
//           type="text"
//           placeholder="e.g. Example Collection"
//           className="w-full rounded-md p-3 border-sky-100 border-solid border text-sm outline-none focus:border-sky-500 duration-100"
//         />
//       </div>

//       <div className="flex gap-5 items-center justify-between">
//         <p className="text-sm font-bold text-sky-300">Owner</p>
//         <CollectionSelection onChange={setCollectionOwner} />
//       </div>

//       <div className="flex justify-end">
//         <button
//           onClick={() => submitCollection()}
//           className="py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-md"
//         >
//           <FontAwesomeIcon icon={faPlus} />
//           <span className="ml-2">Add</span>
//         </button>
//       </div>
//     </div>
//   );
// }
