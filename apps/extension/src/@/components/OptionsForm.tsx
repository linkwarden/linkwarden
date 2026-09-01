// ./OptionsForm.tsx

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/Form.tsx";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  optionsFormInput,
  optionsFormSchema,
  optionsFormValues,
} from "../lib/validators/optionsForm.ts";
import { Input } from "./ui/Input.tsx";
import { Button } from "./ui/Button.tsx";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  clearConfig,
  getConfig,
  isConfigured,
  saveConfig,
} from "../lib/config.ts";
import { Toaster } from "./ui/Toaster.tsx";
import { toast } from "../../hooks/useToast.ts";
import { AxiosError } from "axios";
import { clearBookmarksMetadata } from "../lib/cache.ts";
import { getSession } from "../lib/auth/auth.ts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/Select.tsx";

interface OptionsFormProps {
  onSaved?: () => void;
  onCleared?: () => void;
}

const displayInstance = (baseUrl: string) =>
  baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

const OptionsForm = ({ onSaved, onCleared }: OptionsFormProps) => {
  const [signedInTo, setSignedInTo] = useState<string | undefined | null>(
    undefined
  );

  const form = useForm<optionsFormInput, unknown, optionsFormValues>({
    resolver: zodResolver(optionsFormSchema),
    defaultValues: {
      baseUrl: "https://cloud.linkwarden.app",
      method: "username",
      username: "",
      password: "",
      apiKey: "",
      syncBookmarks: false,
      defaultCollection: "Unorganized",
    },
  });

  const { mutate: onSignOut, isPending: signOutLoading } = useMutation({
    mutationFn: async () => {
      const configured = await isConfigured();

      if (!configured) {
        return new Error("Not configured");
      }

      return;
    },
    onError: () => {
      toast({
        title: "Error",
        description:
          "Either you didn't configure the extension or there was an error while trying to sign out. Please try again.",
        variant: "destructive",
      });
      return;
    },
    onSuccess: async () => {
      // Reset the form
      form.reset({
        baseUrl: "",
        method: "username",
        username: "",
        password: "",
        apiKey: "",
        syncBookmarks: false,
        defaultCollection: "Unorganized",
      });
      await clearConfig();
      await clearBookmarksMetadata();
      setSignedInTo(null);
      onCleared?.();
      return;
    },
  });

  const { mutate: onSubmit, isPending } = useMutation({
    mutationFn: async (values: optionsFormValues) => {
      values.baseUrl = values.baseUrl.replace(/\/$/, "");
      // Do API call to test the connection and save the values

      if (values.method === "apiKey") {
        return {
          ...values,
          data: {
            response: {
              token: values.apiKey,
            },
          } as {
            response: {
              token: string;
            };
          },
        };
      } else {
        // Handle Username/Password authentication
        const session = await getSession(
          values.baseUrl,
          values.username,
          values.password
        );

        if (session.status !== 200) {
          throw new Error("Invalid credentials");
        }

        return {
          ...values,
          data: session.data as {
            response: {
              token: string;
            };
          },
        };
      }
    },
    onError: (error) => {
      // Handle errors appropriately
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast({
            title: "Error",
            description: "Invalid credentials or API Key",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "Something went wrong, try again please.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Something went wrong, check your values are correct.",
          variant: "destructive",
        });
      }
    },
    onSuccess: async (values) => {
      await saveConfig({
        baseUrl: values.baseUrl,
        defaultCollection: values.defaultCollection,
        syncBookmarks: values.syncBookmarks,
        apiKey:
          values.method === "apiKey" && values.apiKey
            ? values.apiKey
            : values.data.response.token,
      });

      setSignedInTo(values.baseUrl);

      toast({
        title: "Saved",
        description: "Your settings have been saved.",
        variant: "default",
      });

      onSaved?.();
    },
  });

  useEffect(() => {
    (async () => {
      const configured = await isConfigured();
      if (configured) {
        const cachedOptions = await getConfig();
        form.reset(cachedOptions);
        setSignedInTo(cachedOptions.baseUrl);
      } else {
        setSignedInTo(null);
      }
    })();
  }, [form]);

  const { handleSubmit, control, watch } = form;
  const method = watch("method");

  if (signedInTo === undefined) return null;

  if (signedInTo) {
    return (
      <div className="px-2 space-y-4">
        <p className="text-sm">
          Signed in to{" "}
          <span className="font-medium break-all">
            {displayInstance(signedInTo)}
          </span>
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => onSignOut()}
          disabled={signOutLoading}
        >
          Sign Out
        </Button>
        <Toaster />
      </div>
    );
  }

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={handleSubmit((data) => onSubmit(data))}
          className="space-y-3 px-2"
        >
          <FormField
            control={control}
            name="baseUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormDescription>
                  The address of the Linkwarden instance.
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="https://cloud.linkwarden.app"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Authentication Method Select */}
          <FormField
            control={control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Method</FormLabel>
                <FormDescription>
                  Choose your preferred authentication method.
                </FormDescription>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full justify-between bg-neutral-100 dark:bg-neutral-900 outline-none focus:outline-none ring-0 focus:ring-0">
                      <SelectValue placeholder="Select authentication method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="username">
                        Username and Password
                      </SelectItem>
                      <SelectItem value="apiKey">API Key</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Conditionally render API Key or Username/Password fields */}
          {method === "apiKey" ? (
            <FormField
              control={control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormDescription>
                    Enter your Linkwarden API Key.
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Your API Key"
                      {...field}
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <>
              <FormField
                control={control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or Email</FormLabel>
                    <FormDescription>
                      Your Linkwarden Username or Email.
                    </FormDescription>
                    <FormControl>
                      <Input placeholder="johnny" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormDescription>
                      Password for your Linkwarden account.
                    </FormDescription>
                    <FormControl>
                      <Input
                        placeholder="••••••••••••••"
                        {...field}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Commented out fields */}
          {/* 
          <FormField
            control={control}
            name="defaultCollection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default collection</FormLabel>
                <FormDescription>
                  Default collection to add bookmarks to.
                </FormDescription>
                <FormControl>
                  <Input placeholder="Unorganized" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          */}

          {/* 
          <FormField
            control={control}
            name="syncBookmarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sync Bookmarks (Experimental)</FormLabel>
                <FormDescription>
                  Sync your bookmarks with Linkwarden.
                </FormDescription>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          */}

          <div className="flex justify-end pb-2">
            <Button disabled={isPending} type="submit">
              Save
            </Button>
          </div>
        </form>
      </Form>
      <Toaster />
    </div>
  );
};

export default OptionsForm;
