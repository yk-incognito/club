/**
 * Compresses an HTML5 Canvas to an optimized Blob (100KB - 200KB)
 */
export async function getOptimizedBlob(canvas, targetMinKb = 100, targetMaxKb = 200) {
  let quality = 0.85;
  let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));

  // Dynamically step down quality if file exceeds size threshold
  while (blob.size / 1024 > targetMaxKb && quality > 0.25) {
    quality -= 0.1;
    blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  }
  return blob;
}

/**
 * Uploads compressed media blob to Supabase Storage
 */
export async function uploadToStorage(supabase, bucketName, filePath, blob) {
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) throw error;
  
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
