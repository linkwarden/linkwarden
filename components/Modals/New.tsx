import { Tab } from "@headlessui/react";
import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import NewLink from "./Tabs.tsx/NewLink";
import NewCollection from "./Tabs.tsx/NewCollection";

type Props = {
  index?: number;
  modalId: string;
  isOpen: boolean;
  onClose: Function;
};

export default function New({ index, modalId, isOpen, onClose }: Props) {
  const newModal = document.getElementById(modalId);
  const [tabIndex, setTabIndex] = useState(index);

  useEffect(() => {
    setTabIndex(index);

    newModal?.addEventListener("close", () => {
      onClose();
    });

    return () => {
      newModal?.addEventListener("close", () => {
        onClose();
      });
    };
  }, [isOpen]);

  return (
    <dialog
      id={modalId}
      className="modal backdrop-blur-sm overflow-y-auto"
      open={isOpen}
    >
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className:
            "border border-sky-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white",
        }}
      />
      <div className="modal-box max-h-full overflow-y-visible border border-neutral-content w-11/12 max-w-2xl">
        <form method="dialog">
          <button className="btn btn-sm outline-none btn-circle btn-ghost absolute right-5 top-5">
            ✕
          </button>
        </form>

        <Tab.Group
          onChange={(i: any) => setTabIndex(i)}
          selectedIndex={tabIndex}
        >
          <Tab.List className="tabs-boxed flex w-fit mr-auto justify-center gap-1 p-1">
            <Tab
              className={({ selected }) =>
                `${
                  selected ? "btn-primary" : "btn-ghost"
                } outline-none rounded-md btn btn-sm w-24`
              }
            >
              Link
            </Tab>
            {/* <Tab
              className={({ selected }) =>
                `${
                  selected ? "btn-primary" : "btn-ghost"
                } outline-none rounded-md btn btn-sm w-24`
              }
            >
              File
            </Tab> */}
            {/* <Tab
              className={({ selected }) =>
                `${
                  selected ? "btn-primary" : "btn-ghost"
                } outline-none rounded-md btn btn-sm w-24`
              }
            >
              Note
            </Tab> */}
            <Tab
              className={({ selected }) =>
                `${
                  selected ? "btn-primary" : "btn-ghost"
                } outline-none rounded-md btn btn-sm w-24`
              }
            >
              Collection
            </Tab>
          </Tab.List>
          <Tab.Panels className="mt-5">
            <Tab.Panel>
              <NewLink isOpen={isOpen} modalId={modalId} />
            </Tab.Panel>
            {/* <Tab.Panel>File</Tab.Panel> */}
            {/* <Tab.Panel>Note</Tab.Panel> */}
            <Tab.Panel>
              <NewCollection isOpen={isOpen} modalId={modalId} />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
