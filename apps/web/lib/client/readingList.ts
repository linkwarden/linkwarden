import { useUpdateReadingList } from "@linkwarden/router/readingList";
import { ReadingListStatus } from "@linkwarden/types/global";
import toast from "react-hot-toast";

// Returns a function that moves links to a reading list status (null removes
// them) and resolves to whether the change was saved.
const useSetReadingListStatus = () => {
  const updateReadingList = useUpdateReadingList();

  return async (linkIds: number[], status: ReadingListStatus | null) => {
    try {
      await updateReadingList.mutateAsync({ linkIds, status });
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
  };
};

export default useSetReadingListStatus;
