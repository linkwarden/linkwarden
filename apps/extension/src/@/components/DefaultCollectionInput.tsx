import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Label } from "./ui/Label.tsx";
import SelectInput, { SelectOption } from "./SelectInput.tsx";
import { getCollections } from "../lib/actions/collections.ts";
import { updateConfig } from "../lib/config.ts";
import { toast } from "../../hooks/useToast.ts";

// Sentinel for "no specific collection". Linkwarden creates the "Unorganized"
// collection on demand, so it is not guaranteed to be in the list yet — this
// keeps the option available (and resettable) either way.
const UNORGANIZED = "unorganized";

type Props = {
  baseUrl: string;
  apiKey: string;
  /** The default collection currently stored in the config, if any. */
  initialCollectionId?: number;
};

/**
 * Lets a signed-in user pick the collection new links are pre-assigned to.
 *
 * The options come from the configured account, so only a collection that
 * actually exists can be chosen. The choice is persisted as soon as it is
 * made — the settings panel it lives in has no submit button of its own.
 */
const DefaultCollectionInput = ({
  baseUrl,
  apiKey,
  initialCollectionId,
}: Props) => {
  const [selectedId, setSelectedId] = useState(initialCollectionId);

  const {
    data: collections,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["collections", baseUrl, apiKey],
    queryFn: async () => {
      const response = await getCollections(baseUrl, apiKey);

      return response.data.response.sort((a, b) =>
        a.pathname.localeCompare(b.pathname)
      );
    },
  });

  const options = useMemo<SelectOption[]>(
    () => [
      { value: UNORGANIZED, label: "Unorganized" },
      // The pathname keeps nested collections with the same name apart.
      ...(collections ?? []).map((collection) => ({
        value: String(collection.id),
        label: collection.pathname,
      })),
    ],
    [collections]
  );

  const { mutate: onSelect } = useMutation({
    mutationFn: async (value: string) => {
      const collection =
        value === UNORGANIZED
          ? undefined
          : collections?.find((c) => c.id === Number(value));

      // A partial update rather than a full save: signing out while this is in
      // flight must clear the account for good, not have it written back here.
      const saved = await updateConfig({
        defaultCollection: collection?.name ?? "Unorganized",
        defaultCollectionId: collection?.id,
      });

      return { saved: saved !== null, collection };
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not save the default collection. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: ({ saved, collection }) => {
      // Signed out mid-save: nothing was written and this panel is gone.
      if (!saved) return;

      setSelectedId(collection?.id);

      toast({
        title: "Saved",
        description: `New links will be pre-assigned to "${
          collection?.pathname ?? "Unorganized"
        }".`,
        variant: "success",
      });
    },
  });

  // While the collections are loading there is nothing to match against yet,
  // so the select shows its placeholder rather than a value that may change a
  // moment later. A stored id that no longer resolves (e.g. the collection was
  // deleted) falls back to the sentinel.
  const value = isLoading
    ? ""
    : selectedId !== undefined &&
        collections?.some((collection) => collection.id === selectedId)
      ? String(selectedId)
      : UNORGANIZED;

  return (
    <div className="space-y-2">
      <Label htmlFor="default-collection">Default collection</Label>
      <p className="text-sm text-muted-foreground">
        New links are pre-assigned to this collection in the popup.
      </p>
      {error ? (
        <p className="text-sm text-red-600">
          Could not load your collections. Please make sure the instance is
          available.
        </p>
      ) : (
        <SelectInput
          id="default-collection"
          value={value}
          onChange={onSelect}
          options={options}
          placeholder={isLoading ? "Loading collections..." : "Unorganized"}
          disabled={isLoading}
          inFormField={false}
        />
      )}
    </div>
  );
};

export default DefaultCollectionInput;
