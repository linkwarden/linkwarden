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
import { TagInput } from "./TagInput.tsx";
import { Textarea } from "./ui/Textarea.tsx";
import { getCurrentTabInfo, updateBadge } from "../lib/utils.ts";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { getConfig, isConfigured as getIsConfigured } from "../lib/config.ts";
import { checkLinkExists, postLink } from "../lib/actions/links.ts";
import { AxiosError } from "axios";
import { toast } from "../../hooks/use-toast.ts";
import { Toaster } from "./ui/Toaster.tsx";
import { getCollections } from "../lib/actions/collections.ts";
import { getShouldUseTagSearch, getTags } from "../lib/actions/tags.ts";
import { ExternalLink, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/Popover.tsx";
import { CaretSortIcon } from "@radix-ui/react-icons";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/Command.tsx";
import { Checkbox } from "./ui/CheckBox.tsx";
import { Label } from "./ui/Label.tsx";

const BookmarkForm = () => {
  const [openOptions, setOpenOptions] = useState<boolean>(false);
  const [openCollections, setOpenCollections] = useState<boolean>(false);
  const [uploadImage, setUploadImage] = useState<boolean>(false);
  const [state, setState] = useState<"capturing" | "uploading" | null>(null);
  const [tagSearch, setTagSearch] = useState<string>("");

  const [isConfigured, setIsConfigured] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

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
      await postLink(
        config?.baseUrl as string,
        uploadImage,
        values,
        setState,
        config?.apiKey as string
      );

      return;
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
            "There was an error while trying to save the link. Please try again.",
          variant: "destructive",
        });
      }
      return;
    },
    onSuccess: () => {
      // Update badge to show link is saved
      getCurrentTabInfo().then(({ id }) => {
        updateBadge(id);
      });
      setTimeout(() => {
        window.close();
        // I want to show some confirmation before it's closed...
      }, 3500);
      toast({
        title: "Success",
        description: "Link saved successfully!",
      });
    },
  });

  useEffect(() => {
    const setTabInformation = async () => {
      const t = await getCurrentTabInfo();
      const c = await getConfig();

      setTabInfo(t);
      setConfig(c);

      updateBadge(t.id);

      form.setValue("url", t.url ? t.url : "");
      form.setValue("name", t.title ? t.title : "");
      form.setValue("collection", {
        name: c.defaultCollection,
      });

      const configured = await getIsConfigured();
      const duplicate = await checkLinkExists(c.baseUrl, c.apiKey);
      setIsDuplicate(duplicate);
      setIsConfigured(configured);
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
                <div className="min-w-full inset-x-0">
                  <Popover
                    open={openCollections}
                    onOpenChange={setOpenCollections}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCollections}
                          className={
                            "w-full justify-between bg-neutral-100 dark:bg-neutral-900"
                          }
                        >
                          {loadingCollections
                            ? "Unorganized"
                            : field.value?.name
                              ? collections?.find(
                                  (collection: { name: string }) =>
                                    collection.name === field.value?.name
                                )?.name || form.getValues("collection")?.name
                              : "Select a collection..."}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                    {!openOptions && openCollections ? (
                      <div
                        className={`fade-up min-w-full p-0 overflow-y-auto ${
                          openCollections
                            ? "fixed inset-0 w-full h-full z-50 bg-white"
                            : ""
                        }`}
                      >
                        <Button
                          className="absolute top-1 right-1 bg-transparent hover:bg-transparent hover:opacity-50 transition-colors ease-in-out duration-200"
                          onClick={() => setOpenCollections(false)}
                        >
                          <X className={`h-4 w-4 text-black dark:text-white`} />
                        </Button>
                        <Command className="flex-grow min-w-full dropdown-content rounded-none">
                          <CommandInput
                            className="min-w-[280px]"
                            placeholder="Search Collection..."
                          />

                          {loadingCollections ? (
                            <p className="w-full text-center my-auto">
                              Loading...
                            </p>
                          ) : (
                            <>
                              <CommandEmpty>No Collection found.</CommandEmpty>
                              {Array.isArray(collections) && (
                                <CommandGroup className="w-full overflow-y-auto">
                                  {isPending ? (
                                    <CommandItem
                                      value="Loading collections..."
                                      key="Loading collections..."
                                      onSelect={() => {
                                        form.setValue("collection", {
                                          name: "Unorganized",
                                        });
                                        setOpenCollections(false);
                                      }}
                                    >
                                      Unorganized
                                    </CommandItem>
                                  ) : (
                                    collections?.map(
                                      (collection: {
                                        name: string;
                                        id: number;
                                        ownerId: number;
                                        pathname: string;
                                      }) => (
                                        <CommandItem
                                          value={collection.name}
                                          key={collection.id}
                                          className="cursor-pointer flex flex-col items-start justify-start"
                                          onSelect={() => {
                                            form.setValue("collection", {
                                              ownerId: collection.ownerId,
                                              id: collection.id,
                                              name: collection.name,
                                            });
                                            setOpenCollections(false);
                                          }}
                                        >
                                          <p>{collection.name}</p>
                                          <p className="text-xs text-neutral-500">
                                            {collection.pathname}
                                          </p>
                                        </CommandItem>
                                      )
                                    )
                                  )}
                                </CommandGroup>
                              )}
                            </>
                          )}
                        </Command>
                      </div>
                    ) : openOptions && openCollections ? (
                      <PopoverContent
                        className={`min-w-full p-0 overflow-y-auto max-h-[200px]`}
                      >
                        <Command className="flex-grow min-w-full dropdown-content">
                          <CommandInput
                            className="min-w-[280px]"
                            placeholder="Search collection..."
                          />
                          <CommandEmpty>No Collection found.</CommandEmpty>
                          {Array.isArray(collections) && (
                            <CommandGroup className="w-full">
                              {isPending ? (
                                <CommandItem
                                  value="Loading collections..."
                                  key="Loading collections..."
                                  onSelect={() => {
                                    form.setValue("collection", {
                                      name: "Unorganized",
                                    });
                                    setOpenCollections(false);
                                  }}
                                >
                                  Unorganized
                                </CommandItem>
                              ) : (
                                collections?.map(
                                  (collection: {
                                    name: string;
                                    id: number;
                                    ownerId: number;
                                    pathname: string;
                                  }) => (
                                    <CommandItem
                                      value={collection.name}
                                      key={collection.id}
                                      className="cursor-pointer flex flex-col items-start justify-start"
                                      onSelect={() => {
                                        form.setValue("collection", {
                                          ownerId: collection.ownerId,
                                          id: collection.id,
                                          name: collection.name,
                                        });
                                        setOpenCollections(false);
                                      }}
                                    >
                                      <p>{collection.name}</p>
                                      <p className="text-xs text-neutral-500">
                                        {collection.pathname}
                                      </p>
                                    </CommandItem>
                                  )
                                )
                              )}
                            </CommandGroup>
                          )}
                        </Command>
                      </PopoverContent>
                    ) : undefined}
                  </Popover>
                </div>
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
              onClick={() => setOpenOptions((prevState) => !prevState)}
            >
              {openOptions ? "Hide" : "More"} Options
            </Button>

            <Button disabled={isPending} type="submit">
              Save
            </Button>
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
