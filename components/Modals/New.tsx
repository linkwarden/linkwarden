import { Tab } from "@headlessui/react";
import React from "react";
import { Toaster } from "react-hot-toast";
import NewLink from "./Tabs.tsx/NewLink";
import NewCollection from "./Tabs.tsx/NewCollection";

export default function New() {
  return (
    <dialog id="new-modal" className="modal backdrop-blur-sm overflow-y-auto">
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

        <Tab.Group>
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
              <NewLink />
            </Tab.Panel>
            {/* <Tab.Panel>Content 2</Tab.Panel> */}
            <Tab.Panel>
              <NewCollection />
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
