import { LinkArchiveActionSchemaType } from "@/lib/shared/schemaValidation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useDeleteAllPreserved = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (action: LinkArchiveActionSchemaType) => {
			const response = await fetch("/api/v1/links/archive", {
				body: JSON.stringify({ action }),
				method: "DELETE",
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.response);

			return data.response;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["links"] });
		},
	});
}

export { useDeleteAllPreserved };
