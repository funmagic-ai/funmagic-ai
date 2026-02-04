'use client';

import { useState } from 'react';
import { useUploadFiles } from '@better-upload/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { UploadDropzone } from '@/components/ui/upload-dropzone';
import { Plus, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { getS3PublicUrl } from '@/lib/s3-url';

interface StyleReference {
  id: string;
  name: string;
  imageUrl: string;
  prompt: string;
}

interface FigmeStyleEditorProps {
  styles: StyleReference[];
  maxStyles: number;
  onChange: (styles: StyleReference[]) => void;
}

export function FigmeStyleEditor({ styles, maxStyles, onChange }: FigmeStyleEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const uploadControl = useUploadFiles({
    route: 'styles',
    api: '/api/admin/tools/figme/styles/upload',
    onUploadComplete: ({ files }) => {
      if (files.length > 0 && editingIndex !== null) {
        const file = files[0];
        const s3BaseUrl = process.env.NEXT_PUBLIC_S3_PUBLIC_URL || '';
        const imageUrl = s3BaseUrl ? `${s3BaseUrl}/${file.objectInfo.key}` : file.objectInfo.key;

        const newStyles = [...styles];
        newStyles[editingIndex] = {
          ...newStyles[editingIndex],
          imageUrl,
        };
        onChange(newStyles);
      }
    },
    onError: (error) => {
      console.error('Upload failed:', error);
    },
  });

  const addStyle = () => {
    if (styles.length >= maxStyles) return;

    const newStyle: StyleReference = {
      id: `style-${Date.now()}`,
      name: '',
      imageUrl: '',
      prompt: '',
    };
    onChange([...styles, newStyle]);
  };

  const removeStyle = (index: number) => {
    const newStyles = styles.filter((_, i) => i !== index);
    onChange(newStyles);
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  const updateStyle = (index: number, field: keyof StyleReference, value: string) => {
    const newStyles = [...styles];
    newStyles[index] = { ...newStyles[index], [field]: value };
    onChange(newStyles);
  };

  return (
    <div className="space-y-4">
      {styles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No style references yet</p>
          <Button onClick={addStyle} className="mt-4" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Style Reference
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {styles.map((style, index) => (
              <Card key={style.id} className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => removeStyle(index)}
                >
                  <X className="h-4 w-4" />
                </Button>

                <CardContent className="space-y-4 pt-6">
                  <div className="grid gap-2">
                    <Label>Style Name</Label>
                    <Input
                      value={style.name}
                      onChange={(e) => updateStyle(index, 'name', e.target.value)}
                      placeholder="e.g., Anime, 3D Cartoon"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Reference Image</Label>
                    {style.imageUrl ? (
                      <div className="relative">
                        <img
                          src={getS3PublicUrl(style.imageUrl)}
                          alt={style.name}
                          className="h-32 w-full rounded-md object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute right-2 top-2 h-6 w-6"
                          onClick={() => updateStyle(index, 'imageUrl', '')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingIndex(index)}
                        className="cursor-pointer"
                      >
                        <UploadDropzone
                          control={uploadControl}
                          accept="image/jpeg,image/png,image/webp"
                          description={{
                            fileTypes: 'JPEG, PNG, WebP',
                            maxFileSize: '5MB',
                            maxFiles: 1,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label>Prompt Template</Label>
                    <Textarea
                      value={style.prompt}
                      onChange={(e) => updateStyle(index, 'prompt', e.target.value)}
                      placeholder="Create a {subject} in this style..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Use {'{subject}'} as a placeholder for user input
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {styles.length < maxStyles && (
            <Button onClick={addStyle} variant="outline" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Style Reference ({styles.length}/{maxStyles})
            </Button>
          )}
        </>
      )}
    </div>
  );
}
