"use strict";

import { NativeDocumentPicker } from './spec/NativeDocumentPicker';

/**
 * For each uri whose release was requested, the result will contain an object with the uri and a status.
 * */

/**
 * Android only - Releases long-term access to the given URIs. There's no need to call this method on iOS - there's no iOS equivalent.
 *
 * See [Android documentation](https://developer.android.com/reference/android/content/ContentResolver#releasePersistableUriPermission(android.net.Uri,%20int)) for more information.
 */
export const releaseLongTermAccess = async uris => {
  return NativeDocumentPicker.releaseLongTermAccess(uris);
};

/**
 * iOS only - Releases (stops) secure access to the given URIs. Use with URIs obtained with Open mode or with the Directory Picker.
 * See [iOS documentation](https://developer.apple.com/documentation/foundation/nsurl/1413736-stopaccessingsecurityscopedresou) for more information.
 * There's no need to call this method on Android - there's no equivalent method on Android.
 * */
export const releaseSecureAccess = async uris => {
  return NativeDocumentPicker.releaseSecureAccess(uris);
};
//# sourceMappingURL=release.js.map