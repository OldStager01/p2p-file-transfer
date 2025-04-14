import FontAwesome from "@expo/vector-icons/FontAwesome";

export type FontAwesomeIconName = React.ComponentProps<
  typeof FontAwesome
>["name"];

export enum ItemType {
  File = "file",
  Media = "media",
  Text = "text",
  Paste = "paste",
  App = "app",
}
