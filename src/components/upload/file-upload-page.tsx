import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { uploadFileToStorage, getFilePublicUrl } from '@/lib/file-upload';
import { ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadResult {
  id: string;
  file_path: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export default function FileUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const result = await uploadFileToStorage(selectedFile, 'deposits', 'user-uploads');
      
      if (result.success && result.data) {
        setUploadResult(result.data.uploadRecord);
        toast({
          title: 'Upload successful!',
          description: `File "${selectedFile.name}" has been uploaded successfully.`,
        });
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">File Upload</h1>
              <p className="text-sm text-muted-foreground">
                Upload files securely to Supabase Storage
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload File
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-input">Select File</Label>
                <Input
                  id="file-input"
                  type="file"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: Images, PDF, DOC, DOCX, TXT
                </p>
              </div>

              {selectedFile && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </CardContent>
          </Card>

          {/* Upload Result */}
          {uploadResult && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  Upload Successful
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-muted-foreground">Original Name:</span>
                    <p className="font-mono">{uploadResult.original_name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">File Size:</span>
                    <p>{formatFileSize(uploadResult.file_size)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Upload Time:</span>
                    <p>{formatDate(uploadResult.created_at)}</p>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">File Type:</span>
                    <p>{uploadResult.mime_type}</p>
                  </div>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Storage Path:</span>
                  <p className="font-mono text-xs bg-white p-2 rounded border break-all">
                    {uploadResult.file_path}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">File ID:</span>
                  <p className="font-mono text-xs">{uploadResult.id}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Information Card */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Safe Filename Generation</h4>
                <p className="text-sm text-muted-foreground">
                  Files are automatically renamed using a timestamp and UUID to avoid issues with special characters (like Arabic text). The original filename is preserved in the database.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Storage Structure</h4>
                <p className="text-sm text-muted-foreground">
                  Files are organized in folders by user ID within the "deposits" bucket for security and organization.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Database Record</h4>
                <p className="text-sm text-muted-foreground">
                  Each upload creates a record in the "uploads" table with the file path, original name, and upload timestamp.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}