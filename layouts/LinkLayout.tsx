import LinkSidebar from "@/components/LinkSidebar";
import { ReactNode, useEffect, useState } from "react";
import ModalManagement from "@/components/ModalManagement";
import useModalStore from "@/store/modals";
import { useRouter } from "next/router";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import useWindowDimensions from "@/hooks/useWindowDimensions";
import {
  faPen,
  faBoxesStacked,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import useLinkStore from "@/store/links";
import {
  CollectionIncludingMembersAndLinkCount,
  LinkIncludingShortenedCollectionAndTags,
} from "@/types/global";
import { useSession } from "next-auth/react";
import useCollectionStore from "@/store/collections";

interface Props {
  children: ReactNode;
}

export default function LinkLayout({ children }: Props) {
  const { modal } = useModalStore();

  const router = useRouter();

  useEffect(() => {
    modal
      ? (document.body.style.overflow = "hidden")
      : (document.body.style.overflow = "auto");
  }, [modal]);

  const [sidebar, setSidebar] = useState(false);

  const { width } = useWindowDimensions();

  useEffect(() => {
    setSidebar(false);
  }, [width]);

  useEffect(() => {
    setSidebar(false);
  }, [router]);

  const toggleSidebar = () => {
    setSidebar(!sidebar);
  };

  const session = useSession();
  const userId = session.data?.user.id;

  const { setModal } = useModalStore();

  const { links, removeLink } = useLinkStore();
  const { collections } = useCollectionStore();

  const [linkCollection, setLinkCollection] =
    useState<CollectionIncludingMembersAndLinkCount>();

  const [link, setLink] = useState<LinkIncludingShortenedCollectionAndTags>();

  useEffect(() => {
    if (links) setLink(links.find((e) => e.id === Number(router.query.id)));
  }, [links]);

  useEffect(() => {
    if (link)
      setLinkCollection(collections.find((e) => e.id === link?.collection.id));
  }, [link]);

  return (
    <>
      <ModalManagement />

      <div className="flex mx-auto">
        <div className="hidden lg:block fixed left-5 h-screen">
          <LinkSidebar />
        </div>

        <div className="w-full flex flex-col min-h-screen max-w-screen-md mx-auto p-5">
          <div className="flex gap-3 mb-5 duration-100 items-center justify-between">
            {/* <div
              onClick={toggleSidebar}
              className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-2 text-gray-500 dark:text-gray-300 rounded-md duration-100 hover:bg-slate-200 dark:hover:bg-neutral-700"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </div> */}

            <div
              onClick={() => router.push(`/collections/${linkCollection?.id}`)}
              className="inline-flex gap-1 hover:opacity-60 items-center select-none cursor-pointer p-2 lg:p-0 lg:px-1 lg:my-2 text-gray-500 dark:text-gray-300 rounded-md duration-100"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
              Back{" "}
              <span className="hidden sm:inline-block">
                to <span className="capitalize">{linkCollection?.name}</span>
              </span>
            </div>

            <div className="lg:hidden">
              <div className="flex gap-5">
                {link?.collection.ownerId === userId ||
                linkCollection?.members.some(
                  (e) => e.userId === userId && e.canUpdate
                ) ? (
                  <div
                    title="Edit"
                    onClick={() => {
                      link
                        ? setModal({
                            modal: "LINK",
                            state: true,
                            active: link,
                            method: "UPDATE",
                          })
                        : undefined;
                    }}
                    className={`hover:opacity-60 duration-100 py-2 px-2 cursor-pointer flex items-center gap-4 w-full rounded-md h-8`}
                  >
                    <FontAwesomeIcon
                      icon={faPen}
                      className="w-6 h-6 text-gray-500 dark:text-gray-300"
                    />
                  </div>
                ) : undefined}

                <div
                  onClick={() => {
                    link
                      ? setModal({
                          modal: "LINK",
                          state: true,
                          active: link,
                          method: "FORMATS",
                        })
                      : undefined;
                  }}
                  title="Preserved Formats"
                  className={`hover:opacity-60 duration-100 py-2 px-2 cursor-pointer flex items-center gap-4 w-full rounded-md h-8`}
                >
                  <FontAwesomeIcon
                    icon={faBoxesStacked}
                    className="w-6 h-6 text-gray-500 dark:text-gray-300"
                  />
                </div>

                {link?.collection.ownerId === userId ||
                linkCollection?.members.some(
                  (e) => e.userId === userId && e.canDelete
                ) ? (
                  <div
                    onClick={() => {
                      if (link?.id) {
                        removeLink(link.id);
                        router.back();
                      }
                    }}
                    title="Delete"
                    className={`hover:opacity-60 duration-100 py-2 px-2 cursor-pointer flex items-center gap-4 w-full rounded-md h-8`}
                  >
                    <FontAwesomeIcon
                      icon={faTrashCan}
                      className="w-6 h-6 text-gray-500 dark:text-gray-300"
                    />
                  </div>
                ) : undefined}
              </div>
            </div>
          </div>

          {children}

          {sidebar ? (
            <div className="fixed top-0 bottom-0 right-0 left-0 bg-gray-500 bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
              <ClickAwayHandler
                className="h-full"
                onClickOutside={toggleSidebar}
              >
                <div className="slide-right h-full shadow-lg">
                  <LinkSidebar onClick={() => setSidebar(false)} />
                </div>
              </ClickAwayHandler>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
