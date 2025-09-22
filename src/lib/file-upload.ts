import { supabase } from './supabase';

/**
 * Generates a safe filename using timestamp and UUID
 * @param originalFilename - The original filename from the user
 * @returns A safe filename with the original extension
 */
export function generateSafeFilename(originalFilename: string): string {
  // Extract file extension
  const extension = originalFilename.split('.').pop() || '';
  
  // Generate safe filename using timestamp and random string
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  
  return `${timestamp}_${randomString}.${extension}`;
}

/**
 * Uploads a file to Supabase Storage with safe filename and records it in the uploads table
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - Optional folder path within the bucket
 * @returns Promise with upload result
 */
export async function uploadFileToStorage(
  file: File,
  bucket: string = 'deposits',
  folder: string = ''
) {
  try {
    // Get current user with better error handling
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Auth error:', authError);
      throw new Error('Authentication failed: ' + authError.message);
    }
    if (!user) {
      throw new Error('User not authenticated - please log in');
    }

    // Generate safe filename
    const safeFilename = generateSafeFilename(file.name);
    
    // Construct full path
    const fullPath = folder 
      ? `${folder}/${user.id}/${safeFilename}`
      : `${user.id}/${safeFilename}`;

    console.log('Uploading file to path:', fullPath);

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    console.log('File uploaded successfully, inserting record...');

    // Record upload in database with explicit user_id
    const uploadRecord = {
      user_id: user.id,
      file_path: uploadData.path,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type,
    };

    console.log('Inserting upload record:', uploadRecord);

    const { data: dbData, error: dbError } = await supabase
      .from('uploads')
      .insert([uploadRecord])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      // If database insert fails, try to clean up the uploaded file
      await supabase.storage.from(bucket).remove([uploadData.path]);
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    console.log('Upload completed successfully');

    return {
      success: true,
      data: {
        uploadRecord: dbData,
        storagePath: uploadData.path,
        publicUrl: supabase.storage.from(bucket).getPublicUrl(uploadData.path).data.publicUrl,
      },
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Gets the public URL for a file in storage
 * @param bucket - The storage bucket name
 * @param path - The file path in storage
 * @returns The public URL
 */
export function getFilePublicUrl(bucket: string, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/**
 * Deletes a file from storage and removes its record from the uploads table
 * @param uploadId - The upload record ID
 * @param bucket - The storage bucket name
 * @returns Promise with deletion result
 */
export async function deleteUploadedFile(uploadId: string, bucket: string = 'deposits') {
  try {
    // Get the upload record
    const { data: upload, error: fetchError } = await supabase
      .from('uploads')
      .select('file_path, user_id')
      .eq('id', uploadId)
      .single();

    if (fetchError || !upload) {
      throw new Error('Upload record not found');
    }

    // Verify user owns this upload
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || user.id !== upload.user_id) {
      throw new Error('Unauthorized');
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([upload.file_path]);

    if (storageError) {
      console.warn('Failed to delete from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('uploads')
      .delete()
      .eq('id', uploadId);

    if (dbError) {
      throw dbError;
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}