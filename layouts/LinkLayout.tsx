import LinkSidebar from "@/components/LinkSidebar";
import { ReactNode, useEffect, useState } from "react";
import ModalManagement from "@/components/ModalManagement";
import useModalStore from "@/store/modals";
import { useRouter } from "next/router";
import ClickAwayHandler from "@/components/ClickAwayHandler";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons";
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
import EditLinkModal from "@/components/ModalContent/EditLinkModal";
import Link from "next/link";
import PreservedFormatsModal from "@/components/ModalContent/PreservedFormatsModal";
import toast from "react-hot-toast";
import DeleteLinkModal from "@/components/ModalContent/DeleteLinkModal";

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
    if (links[0]) setLink(links.find((e) => e.id === Number(router.query.id)));
  }, [links]);

  useEffect(() => {
    if (link)
      setLinkCollection(collections.find((e) => e.id === link?.collection?.id));
  }, [link, collections]);

  const deleteLink = async () => {
    const load = toast.loading("Deleting...");

    const response = await removeLink(link?.id as number);

    toast.dismiss(load);

    response.ok && toast.success(`Link Deleted.`);

    router.push("/dashboard");
  };

  const [editLinkModal, setEditLinkModal] = useState(false);
  const [deleteLinkModal, setDeleteLinkModal] = useState(false);
  const [preservedFormatsModal, setPreservedFormatsModal] = useState(false);

  return (
    <>
      <div className="flex mx-auto">
        {/* <div className="hidden lg:block fixed left-5 h-screen">
          <LinkSidebar />
        </div> */}

        <div className="w-full flex flex-col min-h-screen max-w-screen-md mx-auto p-5">
          <div className="flex gap-3 mb-3 duration-100 items-center justify-between">
            {/* <div
              onClick={toggleSidebar}
              className="inline-flex lg:hidden gap-1 items-center select-none cursor-pointer p-2 text-neutral rounded-md duration-100 hover:bg-neutral-content"
            >
              <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
            </div> */}

            <Link
              href={
                router.pathname.startsWith("/public")
                  ? `/public/collections/${
                      linkCollection?.id || link?.collection.id
                    }`
                  : `/dashboard`
              }
              className="inline-flex gap-1 btn btn-ghost btn-sm text-neutral px-2"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4" />
              <span className="capitalize">
                {router.pathname.startsWith("/public")
                  ? linkCollection?.name || link?.collection?.name
                  : "Dashboard"}
              </span>
            </Link>

            <div className="flex gap-3">
              {link?.collection?.ownerId === userId ||
              linkCollection?.members.some(
                (e) => e.userId === userId && e.canUpdate
              ) ? (
                <div
                  title="Edit"
                  onClick={() => setEditLinkModal(true)}
                  className={`btn btn-ghost btn-square btn-sm`}
                >
                  <FontAwesomeIcon
                    icon={faPen}
                    className="w-4 h-4 text-neutral"
                  />
                </div>
              ) : undefined}

              <div
                onClick={() => setPreservedFormatsModal(true)}
                title="Preserved Formats"
                className={`btn btn-ghost btn-square btn-sm`}
              >
                <FontAwesomeIcon
                  icon={faBoxesStacked}
                  className="w-4 h-4 text-neutral"
                />
              </div>

              {link?.collection?.ownerId === userId ||
              linkCollection?.members.some(
                (e) => e.userId === userId && e.canDelete
              ) ? (
                <div
                  onClick={(e) => {
                    (document?.activeElement as HTMLElement)?.blur();
                    e.shiftKey ? deleteLink() : setDeleteLinkModal(true);
                  }}
                  title="Delete"
                  className={`btn btn-ghost btn-square btn-sm`}
                >
                  <FontAwesomeIcon
                    icon={faTrashCan}
                    className="w-4 h-4 text-neutral"
                  />
                </div>
              ) : undefined}
            </div>
          </div>

          {children}

          {sidebar ? (
            <div className="fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center fade-in z-30">
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
        {link && editLinkModal ? (
          <EditLinkModal
            onClose={() => setEditLinkModal(false)}
            activeLink={link}
          />
        ) : undefined}
        {link && deleteLinkModal ? (
          <DeleteLinkModal
            onClose={() => setDeleteLinkModal(false)}
            activeLink={link}
          />
        ) : undefined}
        {link && preservedFormatsModal ? (
          <PreservedFormatsModal
            onClose={() => setPreservedFormatsModal(false)}
            activeLink={link}
          />
        ) : undefined}
      </div>
    </>
  );
}
