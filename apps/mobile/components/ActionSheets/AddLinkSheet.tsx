import { Text, View } from "react-native";
import { useRef, useState } from "react";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAddLink } from "@linkwarden/router/links";
import useAuthStore from "@/store/auth";

export default function AddLinkSheet() {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const { auth } = useAuthStore();
  const addLink = useAddLink(auth);
  const [link, setLink] = useState("");

  return (
    <ActionSheet ref={actionSheetRef} gestureEnabled>
      <View className="px-8 py-5">
        <Input
          placeholder="e.g. https://example.com"
          className="mb-4"
          value={link}
          onChangeText={setLink}
        />

        <Button
          onPress={() =>
            addLink.mutate(
              { url: link },
              {
                onSuccess: () => {
                  actionSheetRef.current?.hide();
                  setLink("");
                },
                onError: (error) => {
                  console.error("Error adding link:", error);
                },
              }
            )
          }
          variant="accent"
          className="mb-2"
        >
          <Text className="text-white">Save to Linkwarden</Text>
        </Button>

        <Button
          onPress={() => {
            actionSheetRef.current?.hide();
            setLink("");
          }}
          variant="outline"
          className="mb-2"
        >
          <Text>Cancel</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
