import FontAwesome from "@expo/vector-icons/FontAwesome";

export type FontAwesomeIconName = React.ComponentProps<
  typeof FontAwesome
>["name"];

export enum ItemType {
  File = "file",
  Media = "media",
  Folder = "folder",
  Text = "text",
  App = "app",
}

export enum ItemSource {
  FilePicker = "FilePicker",
  FolderPicker = "FolderPicker",
  ImageLibrary = "ImageLibrary",
  Clipboard = "Clipboard",
  ManualInput = "ManualInput",
  AppPicker = "AppPicker",
}

export type FileData = {
  name: string;
  uri: string;
  size: number;
  mimeType: string;
};

export type FolderData = {
  name: string;
  uri: string;
  bookmark?: string;
};

export type MediaData = FileData; // Reuse FileData if similar

export type TextData = {
  content: string;
};

export type SelectedItemType =
  | {
      id?: string;
      type: ItemType.File;
      source: ItemSource.FilePicker | ItemSource.ImageLibrary;
      data: FileData;
    }
  | {
      id?: string;
      type: ItemType.Folder;
      source: ItemSource.FolderPicker;
      data: FolderData;
    }
  | {
      id?: string;
      type: ItemType.Media;
      source: ItemSource.ImageLibrary;
      data: MediaData;
    }
  | {
      id?: string;
      type: ItemType.Text;
      source: ItemSource.ManualInput | ItemSource.Clipboard;
      data: TextData;
    }
  | {
      id?: string;
      type: ItemType.App;
      soucre: ItemSource.AppPicker;
      data: any;
    }
  | {
      id?: string;
      type: ItemType.Media;
      source: ItemSource.ImageLibrary | ItemSource.FilePicker;
      data: MediaData;
    };

export type SelectedItemsType = {
  selectedItems: SelectedItemType[];
  addToSelection: (items: SelectedItemType[]) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
};

export type LocalDeviceType = {
  name: string;
  ip: string;
  port: number;
};

// export interface FileData {
//   name: string;
//   type: string;
//   size: number;
//   uri?: string;
//   data: Blob | File | FormData;
// }
