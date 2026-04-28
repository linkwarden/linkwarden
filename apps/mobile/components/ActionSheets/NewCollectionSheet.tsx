import { Alert, Text, View } from "react-native";
import { useRef, useState } from "react";
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Input from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import useAuthStore from "@/store/auth";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { useCreateCollection } from "@linkwarden/router/collections";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SheetHeader from "./SheetHeader";

export default function NewCollectionSheet() {
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const { auth } = useAuthStore();
  const createCollection = useCreateCollection(auth);
  const [collection, setCollection] = useState({
    name: "",
    description: "",
  });
  const { colorScheme } = useColorScheme();

  const insets = useSafeAreaInsets();

  const closeSheet = () => {
    actionSheetRef.current?.hide();
    setCollection({
      name: "",
      description: "",
    });
  };

  return (
    <ActionSheet
      ref={actionSheetRef}
      gestureEnabled
      indicatorStyle={{
        display: "none",
      }}
      containerStyle={{
        backgroundColor: rawTheme[colorScheme as ThemeName]["base-200"],
      }}
      safeAreaInsets={insets}
      onClose={() => {
        setCollection({
          name: "",
          description: "",
        });
      }}
    >
      <SheetHeader title="New Collection" onClose={closeSheet} />

      <View className="px-8 pb-5">
        <Input
          placeholder="Name"
          className="mb-4 bg-base-100"
          value={collection.name}
          onChangeText={(text) => setCollection({ ...collection, name: text })}
        />

        <Input
          placeholder="Description"
          className="mb-4 bg-base-100"
          value={collection.description}
          onChangeText={(text) =>
            setCollection({ ...collection, description: text })
          }
        />

        <Button
          onPress={() =>
            createCollection.mutate(
              { name: collection.name, description: collection.description },
              {
                onSuccess: () => {
                  actionSheetRef.current?.hide();
                  setCollection({ name: "", description: "" });
                },
                onError: (error) => {
                  Alert.alert(
                    "Error",
                    "There was an error creating the collection."
                  );
                  console.error("Error creating collection:", error);
                },
              }
            )
          }
          isLoading={createCollection.isPending}
          variant="accent"
        >
          <Text className="text-white">Save Collection</Text>
        </Button>
      </View>
    </ActionSheet>
  );
}
