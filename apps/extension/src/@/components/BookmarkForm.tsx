import { useForm } from "react-hook-form";
import {
  bookmarkFormSchema,
  bookmarkFormValues,
} from "../lib/validators/bookmarkForm.ts";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/Form.tsx";
import { Input } from "./ui/Input.tsx";
import { Button } from "./ui/Button.tsx";
import TagInput from "./TagInput.tsx";
import CollectionInput from "./CollectionInput.tsx";
import { Textarea } from "./ui/Textarea.tsx";
import {
  getCurrentTabInfo,
  getStorageItem,
  setStorageItem,
  updateBadge,
} from "../lib/utils.ts";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { getConfig, isConfigured as getIsConfigured } from "../lib/config.ts";
import { Collection, getCollections } from "../lib/actions/collections.ts";
import {
  deleteLinks,
  fetchLinkById,
  findSavedLink,
  findSavedLinks,
  postLink,
  updateLink,
} from "../lib/actions/links.ts";
import { AxiosError } from "axios";
import { toast } from "../../hooks/useToast.ts";
import { Toaster } from "./ui/Toaster.tsx";
import { getShouldUseTagSearch, getTags } from "../lib/actions/tags.ts";
import { ExternalLink } from "lucide-react";
import { Checkbox } from "./ui/CheckBox.tsx";
import { Label } from "./ui/Label.tsx";

// The popup is torn down every time it loses focus, so remember whether the
// user had the extra options expanded and bring them back that way.
const MORE_OPTIONS_KEY = "lw_more_options_open";

function resolveCollection(
  collection: bookmarkFormValues["collection"],
  collections: Collection[] | undefined
): bookmarkFormValues["collection"] {
  if (!collection) return collection;
  if (collection.id != null && collection.ownerId != null) return collection;

  const match = collections?.find(
    (item) =>
      (collection.id != null && item.id === collection.id) ||
      item.name === collection.name
  );
  if (!match) return collection;

  return {
    id: match.id,
    ownerId: match.ownerId,
    name: match.name,
  };
}

const BookmarkForm = () => {
  const [openOptions, setOpenOptions] = useState<boolean>(false);
  const [openCollections, setOpenCollections] = useState<boolean>(false);
  const [uploadImage, setUploadImage] = useState<boolean>(false);
  const [state, setState] = useState<"capturing" | "uploading" | null>(null);
  const [tagSearch, setTagSearch] = useState<string>("");

  const [isConfigured, setIsConfigured] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [savedLinkId, setSavedLinkId] = useState<number | null>(null);
  const savedLinkIdRef = useRef<number | null>(null);
  savedLinkIdRef.current = savedLinkId;

  const [config, setConfig] = useState<{
    baseUrl: string;
    defaultCollection: string;
    apiKey: string;
    syncBookmarks: boolean;
  }>();
  const [tabInfo, setTabInfo] = useState<{
    id: number | undefined;
    title: string | undefined;
    url: string | undefined;
  }>();

  const handleCheckedChange = (s: boolean | "indeterminate") => {
    if (s === "indeterminate") return;
    setUploadImage(s);
    form.setValue("image", s ? "png" : undefined);
  };

  const handleOptionsToggle = () => {
    const next = !openOptions;
    setOpenOptions(next);
    void setStorageItem(MORE_OPTIONS_KEY, next ? "true" : "false");
  };

  const form = useForm<bookmarkFormValues>({
    resolver: zodResolver(bookmarkFormSchema),
    defaultValues: {
      url: "",
      name: "",
      collection: {
        name: "Unorganized",
      },
      tags: [],
      description: "",
      image: undefined,
    },
  });

  const { mutate: onSubmit, isPending } = useMutation({
    mutationFn: async (values: bookmarkFormValues) => {
      const existingId = savedLinkIdRef.current;
      let collection = values.collection;

      if (
        existingId != null &&
        (collection?.id == null || collection.ownerId == null) &&
        config?.baseUrl &&
        config.apiKey
      ) {
        const list = (await getCollections(config.baseUrl, config.apiKey)).data
          .response;
        collection = resolveCollection(collection, list);
      }

      const payload = {
        ...values,
        collection,
      };

      if (existingId != null) {
        await updateLink(
          config?.baseUrl as string,
          existingId,
          uploadImage,
          payload,
          setState,
          config?.apiKey as string
        );
        return "updated" as const;
      }

      await postLink(
        config?.baseUrl as string,
        uploadImage,
        payload,
        setState,
        config?.apiKey as string
      );
      return "saved" as const;
    },
    onError: (error) => {
      console.error(error);
      if (error instanceof AxiosError) {
        toast({
          title: "Error",
          description:
            error.response?.data.response ||
            "There was an error while trying to save the link. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "There was an error while trying to save the link. Please try again.",
          variant: "destructive",
        });
      }
      return;
    },
    onSuccess: (result) => {
      updateBadge(tabInfo?.id, true);
      setIsDuplicate(true);
      setTimeout(() => {
        window.close();
      }, 3500);
      toast({
        title: "Success",
        description:
          result === "updated"
            ? "Link updated successfully!"
            : "Link saved successfully!",
        variant: "success",
      });
    },
  });

  const { mutate: onRemove, isPending: isRemoving } = useMutation({
    mutationFn: async () => {
      const c = await getConfig();
      const tab = await getCurrentTabInfo();
      const ids = new Set<number>();
      if (savedLinkIdRef.current != null) ids.add(savedLinkIdRef.current);

      const matches = await findSavedLinks(c.baseUrl, c.apiKey, tab.url);
      if (Array.isArray(matches)) {
        for (const link of matches) ids.add(link.id);
      }

      if (!c.baseUrl || !c.apiKey || ids.size === 0) {
        throw new Error("Nothing to remove");
      }

      await deleteLinks(c.baseUrl, [...ids], c.apiKey, tab.url);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "There was an error while trying to remove the link. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: () => {
      setIsDuplicate(false);
      setSavedLinkId(null);
      updateBadge(tabInfo?.id, false);
      toast({
        title: "Removed",
        description: "Link removed successfully!",
        variant: "success",
      });
      setTimeout(() => {
        window.close();
      }, 1500);
    },
  });

  useEffect(() => {
    const setTabInformation = async () => {
      setOpenOptions((await getStorageItem(MORE_OPTIONS_KEY)) === "true");

      const t = await getCurrentTabInfo();
      const c = await getConfig();

      setTabInfo(t);
      setConfig(c);

      form.setValue("url", t.url ? t.url : "");
      form.setValue("name", t.title ? t.title : "");
      form.setValue("collection", {
        name: c.defaultCollection,
      });

      const configured = await getIsConfigured();
      setIsConfigured(configured);

      if (!configured) return;

      const found = await findSavedLink(c.baseUrl, c.apiKey, t.url);
      if (found === null) return;
      if (found === false) {
        setIsDuplicate(false);
        setSavedLinkId(null);
        updateBadge(t.id, false);
        return;
      }
      const saved = (await fetchLinkById(c.baseUrl, c.apiKey, found.id)) ?? found;
      setIsDuplicate(true);
      setSavedLinkId(saved.id);
      updateBadge(t.id, true);
      form.setValue("collection", {
        id: saved.collection?.id,
        ownerId: saved.collection?.ownerId,
        name: saved.collection?.name || c.defaultCollection,
      });
      form.setValue(
        "tags",
        (saved.tags ?? [])
          .filter((tag) => tag?.name)
          .map((tag) => ({
            ...(typeof tag.id === "number" ? { id: tag.id } : {}),
            name: tag.name,
          }))
      );
      form.setValue("name", saved.name || t.title || "");
      form.setValue("description", saved.description || "");
    };

    setTabInformation();
  }, []);

  const { handleSubmit, control } = form;

  // useEffect(() => {
  //   const syncBookmarks = async () => {
  //     try {
  //       const { syncBookmarks, baseUrl, defaultCollection } = await getConfig();
  //       form.setValue('collection', {
  //         name: defaultCollection,
  //       });
  //       if (!syncBookmarks) {
  //         return;
  //       }
  //       if (await isConfigured()) {
  //         await saveLinksInCache(baseUrl);
  //         await syncLocalBookmarks(baseUrl);
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };
  //   syncBookmarks();
  // }, [form]);

  const {
    isLoading: loadingCollections,
    data: collections,
    error: collectionError,
  } = useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const response = await getCollections(
        config?.baseUrl as string,
        config?.apiKey as string
      );

      return response.data.response.sort((a, b) => {
        return a.pathname.localeCompare(b.pathname);
      });
    },
    enabled: isConfigured,
  });

  useEffect(() => {
    if (!collections?.length) return;
    const current = form.getValues("collection");
    const resolved = resolveCollection(current, collections);
    if (
      resolved &&
      (resolved.id !== current?.id || resolved.ownerId !== current?.ownerId)
    ) {
      form.setValue("collection", resolved);
    }
  }, [collections, form]);

  const { data: shouldUseTagSearch = false } = useQuery({
    queryKey: ["tag-search-support", config?.baseUrl, config?.apiKey],
    queryFn: async () =>
      await getShouldUseTagSearch(
        config?.baseUrl as string,
        config?.apiKey as string
      ),
    enabled: isConfigured && openOptions,
  });
  const effectiveTagSearch = shouldUseTagSearch ? tagSearch : "";
  const {
    isLoading: loadingTags,
    data: tagsData,
    error: tagsError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["tags", config?.baseUrl, config?.apiKey, effectiveTagSearch],
    queryFn: async ({ pageParam }) => {
      return await getTags(
        config?.baseUrl as string,
        config?.apiKey as string,
        pageParam,
        effectiveTagSearch
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: isConfigured && openOptions,
  });

  const tags = useMemo(() => {
    return (
      tagsData?.pages
        .flatMap((page) => page.tags)
        .sort((a, b) => a.name.localeCompare(b.name)) ?? []
    );
  }, [tagsData]);

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={handleSubmit((e) => onSubmit(e))}
          className="py-1 space-y-5"
        >
          {collectionError ? (
            <p className="text-red-600">
              There was an error, please make sure the website is available.
            </p>
          ) : null}
          <FormField
            control={control}
            name="collection"
            render={({ field }) => (
              <FormItem className={`my-2`}>
                <FormLabel>Collection</FormLabel>
                <CollectionInput
                  value={field.value}
                  onChange={field.onChange}
                  collections={collections}
                  isLoading={loadingCollections}
                  open={openCollections}
                  onOpenChange={setOpenCollections}
                  fullScreen={!openOptions}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {!openOptions && (
            <Label className="flex items-center gap-2 w-fit cursor-pointer">
              <Checkbox
                checked={uploadImage}
                onCheckedChange={handleCheckedChange}
              />
              Upload image from browser
            </Label>
          )}

          {openOptions && (
            <>
              {tagsError ? <p>There was an error...</p> : null}
              <FormField
                control={control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    {loadingTags ? (
                      <TagInput
                        onChange={field.onChange}
                        value={[{ name: "Loading tags..." }]}
                        tags={[{ id: 1, name: "Loading tags..." }]}
                        hasNextPage={false}
                        isFetchingNextPage={false}
                      />
                    ) : tagsError ? (
                      <TagInput
                        onChange={field.onChange}
                        value={[{ name: "Not found" }]}
                        tags={[{ id: 1, name: "Not found" }]}
                        hasNextPage={false}
                        isFetchingNextPage={false}
                      />
                    ) : (
                      <TagInput
                        onChange={field.onChange}
                        value={field.value ?? []}
                        tags={tags}
                        hasNextPage={hasNextPage}
                        isFetchingNextPage={isFetchingNextPage}
                        onSearchChange={setTagSearch}
                        onReachEnd={() => {
                          if (!hasNextPage || isFetchingNextPage) return;
                          void fetchNextPage();
                        }}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Google..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Description..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {openOptions && (
                <Label className="flex items-center gap-2 w-fit cursor-pointer">
                  <Checkbox
                    checked={uploadImage}
                    onCheckedChange={handleCheckedChange}
                  />
                  Upload image from browser
                </Label>
              )}
            </>
          )}

          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              type="button"
              onClick={handleOptionsToggle}
            >
              {openOptions ? "Hide" : "More"} Options
            </Button>

            <div className="flex items-center gap-2">
              {savedLinkId != null && (
                <Button
                  variant="destructive"
                  type="button"
                  disabled={isRemoving || isPending}
                  onClick={() => onRemove()}
                >
                  {isRemoving ? "Removing..." : "Remove"}
                </Button>
              )}
              <Button disabled={isPending || isRemoving} type="submit">
                {isPending
                  ? savedLinkId != null
                    ? "Updating..."
                    : "Saving..."
                  : savedLinkId != null
                    ? "Update"
                    : "Save"}
              </Button>
            </div>
          </div>

          {isDuplicate && (
            <div className="w-fit ml-auto">
              <a
                className="text-muted text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  window.open(
                    config?.baseUrl +
                      "/search?q=" +
                      encodeURIComponent(`url:${tabInfo?.url}`),
                    "_blank"
                  );
                  window.close();
                }}
              >
                Note: You've already saved this link{" "}
                <ExternalLink size={16} className="inline-block mb-1" />
              </a>
            </div>
          )}
        </form>
      </Form>
      <Toaster />
      {state && (
        <div className="fixed inset-0 bg-black backdrop-blur-md bg-opacity-50 flex items-center justify-center">
          <div className="text-white p-4 rounded-md flex flex-col items-center w-fit">
            <svg
              className="animate-spin h-10 w-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>

            <p className="text-xl mt-1">
              {state === "capturing"
                ? "Capturing the page..."
                : "Uploading image..."}
            </p>
            <p className="text-xs text-center max-w-xs">
              Please do not close this window, this may take a few seconds
              depending on the size of the page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkForm;
