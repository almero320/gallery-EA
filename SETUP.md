# Setup Guide - Dongo Gallery Museum

## Features Fixed ✅

### 1. Window Controls (Like Real OS)
- **🗕 Minimize**: Hides the window (still accessible from taskbar)
- **🗖 Maximize**: Toggles full-screen mode for the window
- **✕ Close**: Closes the window completely

### 2. Desktop Icons
- Desktop icons are now fully clickable and functional
- Click any desktop icon to open that app
- Icons only work when the system is running (disabled during shutdown)

### 3. Image Upload with Conversion
- Images are automatically converted to **WebP** format for better compression
- Videos are uploaded as **WebM** format (optimized by Cloudinary)
- All uploads are saved to **Cloudinary Cloud Storage** (or localStorage if not configured)

---

## Cloudinary Setup (Required for Cloud Storage)

### Step 1: Create a Cloudinary Account
1. Go to https://cloudinary.com/
2. Sign up for a free account
3. You'll get a Cloud Name automatically

### Step 2: Get Your Cloud Name
1. Login to Cloudinary Dashboard
2. Go to **Settings** (gear icon)
3. Look for "Cloud Name" - copy it

### Step 3: Create an Upload Preset
1. In Cloudinary Dashboard, go to **Settings > Upload**
2. Click "Add upload preset" button
3. Set:
   - **Name**: Any name you want (e.g., `dongo_gallery`)
   - **Unsigned**: Toggle ON (for client-side uploads)
   - **Folder**: Leave blank or set to `dongo-gallery/`
4. Click **Save**
5. Copy the preset name

### Step 4: Configure Your App
1. In the project root folder, create a file named `.env.local`
2. Add these lines:
```
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset_name
```

Example:
```
VITE_CLOUDINARY_CLOUD_NAME=djzf8k9v2
VITE_CLOUDINARY_UPLOAD_PRESET=dongo_gallery
```

3. Save the file
4. Restart your development server (stop and start `npm run dev`)

### Step 5: Test Upload
1. Click the "Upload" desktop icon or use Start Menu
2. Fill in the image name and your name
3. Select an image or video
4. Click "UPLOAD FILE"
5. If successful, you'll see a "☁️ Cloudinary" badge next to your upload

---

## How It Works

### Images
- **Input**: Any image format (PNG, JPG, GIF, etc.)
- **Processing**: Automatically converted to WebP on your browser
- **Upload**: Sent to Cloudinary in WebP format
- **Benefit**: Smaller file size, better compression (50-80% smaller than original)

### Videos
- **Input**: Any video format (MP4, MOV, etc.)
- **Processing**: Uploaded as-is to Cloudinary
- **Optimization**: Cloudinary automatically converts to WebM and optimizes
- **Benefit**: Smaller file size, web-optimized format

### Metadata
Each upload saves:
- **Image Name**: What you called it (e.g., "Soldering Fun")
- **Uploader Name**: Who uploaded it (e.g., "Mero")
- **Upload Date**: Automatically captured (e.g., "17 May 2024")
- **Format**: WebP for images, WebM for videos

---

## If Cloudinary is Not Configured

The app will:
1. Show a warning message in the Upload window
2. Fall back to local storage (saves in your browser only)
3. Still convert images to WebP
4. Still work, but uploads won't be persistent across devices/browsers

---

## Troubleshooting

### "Upload failed" error
- Check that `VITE_CLOUDINARY_CLOUD_NAME` is correct
- Check that `VITE_CLOUDINARY_UPLOAD_PRESET` is correct
- Make sure the upload preset is set to "Unsigned"
- Restart the dev server after changing `.env.local`

### Large file sizes
- Make sure images are being converted to WebP (check network tab in DevTools)
- Compress videos before uploading (recommended: under 50MB)

### Files not appearing in Cloudinary
- Check Cloudinary Dashboard > Media Library
- Files may have a folder prefix (check your upload preset settings)

---

## File Structure

```
web-kenanganxiea/
├── .env.example          # Template for environment variables
├── .env.local           # Your actual configuration (create this)
├── src/
│   ├── App.tsx          # Main app with window controls
│   ├── components/
│   │   ├── UploadGallery.tsx    # Upload component
│   │   ├── CloudinaryMedia.tsx  # Gallery display
│   │   └── ...
│   └── utils/
│       └── cloudinaryUtils.ts   # Cloudinary upload & conversion
```

---

Enjoy your retro pixel museum! 🐱✨
