package app.later.mobile;

import android.content.ContentResolver;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Logger;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;

@CapacitorPlugin(name = "SendIntent")
public class SendIntentPlugin extends Plugin {

    private JSObject pendingSharedContent = null;

    @Override
    public void load() {
        super.load();
        Intent intent = getActivity().getIntent();
        if (intent != null) {
            handleIncomingIntent(intent);
        }
    }

    @Override
    protected void handleOnNewIntent(Intent intent) {
        super.handleOnNewIntent(intent);
        if (intent != null) {
            handleIncomingIntent(intent);
        }
    }

    private synchronized void handleIncomingIntent(Intent intent) {
        if (intent == null) return;

        String action = intent.getAction();
        if (!Intent.ACTION_SEND.equals(action) && !Intent.ACTION_SEND_MULTIPLE.equals(action)) {
            // Normal launch or non-share intent
            return;
        }

        try {
            JSObject sharedData = extractSharedContent(intent);
            if (sharedData != null && sharedData.getBool("hasContent", false)) {
                this.pendingSharedContent = sharedData;
                Logger.info("SendIntentPlugin", "Captured shared content: " + sharedData.getString("type"));
                // Notify any active JavaScript listeners (retain until consumed)
                notifyListeners("sharedContentReceived", sharedData, true);
            }
        } catch (Exception e) {
            Logger.error("SendIntentPlugin", "Error extracting shared intent data", e);
        }
    }

    private JSObject extractSharedContent(Intent intent) {
        String action = intent.getAction();
        String mimeType = intent.getType();

        JSObject result = new JSObject();

        // 1. Check for Image Share
        boolean isImage = (mimeType != null && mimeType.startsWith("image/"));
        if (isImage) {
            Uri imageUri = null;
            if (Intent.ACTION_SEND.equals(action)) {
                imageUri = intent.getParcelableExtra(Intent.EXTRA_STREAM);
            } else if (Intent.ACTION_SEND_MULTIPLE.equals(action)) {
                ArrayList<Uri> uris = intent.getParcelableArrayListExtra(Intent.EXTRA_STREAM);
                if (uris != null && !uris.isEmpty()) {
                    imageUri = uris.get(0);
                }
            }

            if (imageUri == null && intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
                imageUri = intent.getClipData().getItemAt(0).getUri();
            }

            if (imageUri != null) {
                String base64Image = readImageAsDataUrl(imageUri);
                if (base64Image != null) {
                    result.put("hasContent", true);
                    result.put("type", "image");
                    result.put("value", base64Image);

                    String text = intent.getStringExtra(Intent.EXTRA_TEXT);
                    String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
                    if (text != null && !text.trim().isEmpty()) {
                        result.put("text", text.trim());
                    }
                    if (subject != null && !subject.trim().isEmpty()) {
                        result.put("subject", subject.trim());
                    }
                    return result;
                }
            }
        }

        // 2. Check for Text / Link Share
        String sharedText = intent.getStringExtra(Intent.EXTRA_TEXT);
        String sharedSubject = intent.getStringExtra(Intent.EXTRA_SUBJECT);

        if (sharedText == null && intent.getClipData() != null && intent.getClipData().getItemCount() > 0) {
            CharSequence cs = intent.getClipData().getItemAt(0).getText();
            if (cs != null) {
                sharedText = cs.toString();
            }
        }

        if (sharedText == null && intent.getDataString() != null) {
            sharedText = intent.getDataString();
        }

        if (sharedText == null && sharedSubject != null) {
            sharedText = sharedSubject;
            sharedSubject = null;
        }

        if (sharedText != null && !sharedText.trim().isEmpty()) {
            result.put("hasContent", true);
            result.put("type", "text");
            result.put("value", sharedText.trim());
            if (sharedSubject != null && !sharedSubject.trim().isEmpty()) {
                result.put("subject", sharedSubject.trim());
            }
            return result;
        }

        result.put("hasContent", false);
        return result;
    }

    /**
     * Reads an image Uri into an optimized Base64 data URL.
     * Downsamples large camera photos to a max dimension of 1600px to prevent OOM
     * and corrects EXIF rotation automatically.
     */
    private String readImageAsDataUrl(Uri uri) {
        ContentResolver resolver = getContext().getContentResolver();
        try {
            // First pass: inspect dimensions
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            try (InputStream is = resolver.openInputStream(uri)) {
                if (is == null) return null;
                BitmapFactory.decodeStream(is, null, options);
            }

            int origWidth = options.outWidth;
            int origHeight = options.outHeight;
            if (origWidth <= 0 || origHeight <= 0) return null;

            int inSampleSize = 1;
            int maxDim = Math.max(origWidth, origHeight);
            while (maxDim / inSampleSize > 1600) {
                inSampleSize *= 2;
            }

            options.inJustDecodeBounds = false;
            options.inSampleSize = inSampleSize;

            Bitmap bitmap;
            try (InputStream is = resolver.openInputStream(uri)) {
                if (is == null) return null;
                bitmap = BitmapFactory.decodeStream(is, null, options);
            }

            if (bitmap == null) return null;

            // Correct EXIF orientation
            int orientation = ExifInterface.ORIENTATION_NORMAL;
            try (InputStream is = resolver.openInputStream(uri)) {
                if (is != null) {
                    ExifInterface exif = new ExifInterface(is);
                    orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
                }
            } catch (Exception ignored) {}

            Matrix matrix = new Matrix();
            if (orientation == ExifInterface.ORIENTATION_ROTATE_90) {
                matrix.postRotate(90);
            } else if (orientation == ExifInterface.ORIENTATION_ROTATE_180) {
                matrix.postRotate(180);
            } else if (orientation == ExifInterface.ORIENTATION_ROTATE_270) {
                matrix.postRotate(270);
            }

            if (!matrix.isIdentity()) {
                Bitmap rotated = Bitmap.createBitmap(bitmap, 0, 0, bitmap.getWidth(), bitmap.getHeight(), matrix, true);
                if (rotated != bitmap) {
                    bitmap.recycle();
                    bitmap = rotated;
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.JPEG, 85, baos);
            bitmap.recycle();

            byte[] bytes = baos.toByteArray();
            return "data:image/jpeg;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP);
        } catch (Exception e) {
            Logger.error("SendIntentPlugin", "Error decoding shared image stream", e);
            return null;
        }
    }

    @PluginMethod
    public void getSharedContent(PluginCall call) {
        JSObject response;
        synchronized (this) {
            if (this.pendingSharedContent != null) {
                response = this.pendingSharedContent;
                this.pendingSharedContent = null;
            } else {
                response = new JSObject();
                response.put("hasContent", false);
            }
        }
        call.resolve(response);
    }

    @PluginMethod
    public void clearSharedContent(PluginCall call) {
        synchronized (this) {
            this.pendingSharedContent = null;
        }
        call.resolve();
    }
}
