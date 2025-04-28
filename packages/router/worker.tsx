import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { LinkArchiveActionSchemaType } from "@linkwarden/lib/schemaValidation";

interface WorkerStats {
	totalLinks: number;
	archival: {
		preserved: number;
		remaining: number;
		percent: number;
	};
};

const useWorkerStats = () => {
	const { status } = useSession();

	return useQuery({
		queryKey: ["worker-stats"],
		queryFn: async () => {
			const response = await fetch("/api/v1/links/archive");
			if (!response.ok) throw new Error("Failed to fetch worker statistics.");

			const data = await response.json();
			return data.stats as WorkerStats;
		},
		enabled: status === "authenticated",
		refetchInterval: 10000
	});
}

const useArchiveAction = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (action: LinkArchiveActionSchemaType) => {
			const response = await fetch("/api/v1/links/archive", {
				body: JSON.stringify({ action: action }),
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.response);

			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["worker-stats"] });
		},
	});
};

export { useWorkerStats, useArchiveAction };