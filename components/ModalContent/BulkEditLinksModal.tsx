import React, { useState } from "react";
import CollectionSelection from "@/components/InputSelect/CollectionSelection";
import TagSelection from "@/components/InputSelect/TagSelection";
import useLinkStore from "@/store/links";
import { LinkIncludingShortenedCollectionAndTags } from "@/types/global";
import toast from "react-hot-toast";
import Modal from "../Modal";

type Props = {
	onClose: Function;
};

export default function BulkEditLinksModal({ onClose }: Props) {
	const { updateLinks, selectedLinks, setSelectedLinks } = useLinkStore();
	const [submitLoader, setSubmitLoader] = useState(false);
	const [updatedValues, setUpdatedValues] = useState<Pick<LinkIncludingShortenedCollectionAndTags, "tags" | "collectionId">>({ tags: [] });

	const setCollection = (e: any) => {
		const collectionId = e?.value || null;
		setUpdatedValues((prevValues) => ({ ...prevValues, collectionId }));
	};

	const setTags = (e: any) => {
		const tags = e.map((tag: any) => ({ name: tag.label }));
		setUpdatedValues((prevValues) => ({ ...prevValues, tags }));
	};

	const submit = async () => {
		if (!submitLoader) {
			setSubmitLoader(true);

			const load = toast.loading("Updating...");

			const response = await updateLinks(selectedLinks, updatedValues);

			toast.dismiss(load);

			if (response.ok) {
				toast.success(`Updated!`);
				onClose();
			} else toast.error(response.data as string);

			setSelectedLinks([]);
			setSubmitLoader(false);
			onClose();
			return response;
		}
	};

	return (
		<Modal toggleModal={onClose}>
			<p className="text-xl font-thin">Edit Link</p>
			<div className="divider mb-3 mt-1"></div>
			<div className="mt-5">
				<div className="grid sm:grid-cols-2 gap-3">
					<div>
						<p className="mb-2">Collection</p>
						<CollectionSelection onChange={setCollection} />
					</div>

					<div>
						<p className="mb-2">Tags</p>
						<TagSelection onChange={setTags} />
					</div>
				</div>
			</div>

			<div className="flex justify-end items-center mt-5">
				<button
					className="btn btn-accent dark:border-violet-400 text-white"
					onClick={submit}
				>
					Save Changes
				</button>
			</div>
		</Modal>
	);
}
