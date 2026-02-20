import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateAuthor, useUpdateAuthor } from '@/hooks/useAuthorsAdmin';
import type { Author } from '@/types';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';

const authorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  bio: z.string().optional(),
  profilePhoto: z.string().optional(), // Base64
});

type AuthorFormValues = z.infer<typeof authorSchema>;

interface AuthorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  author?: Author | null;
}

export default function AuthorFormDialog({
  open,
  onOpenChange,
  author,
}: AuthorFormDialogProps) {
  const isEdit = !!author;
  const createAuthor = useCreateAuthor();
  const updateAuthor = useUpdateAuthor();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthorFormValues>({
    resolver: zodResolver(authorSchema),
    defaultValues: {
      name: '',
      bio: '',
      profilePhoto: '',
    },
  });

  useEffect(() => {
    if (author) {
      reset({
        name: author.name,
        bio: author.bio || '',
        profilePhoto: (author as any).profilePhoto || '', // type has bio, name
      });
    } else {
      reset({
        name: '',
        bio: '',
        profilePhoto: '',
      });
    }
  }, [author, reset, open]);

  const onSubmit = (values: AuthorFormValues) => {
    if (isEdit && author) {
      updateAuthor.mutate(
        { id: author.id, data: values },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
          },
        }
      );
    } else {
      createAuthor.mutate(values, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      });
    }
  };

  const MAX_SIZE = 400;
  const JPEG_QUALITY = 0.8;

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = reject;
      img.src = url;
    });

  const [compressing, setCompressing] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setValue('profilePhoto', compressed);
    } catch {
      // Ignore compression error — leave field empty
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const profilePhoto = watch('profilePhoto');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Author' : 'Add Author'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the author profile details.'
              : 'Add a new author to the system.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-2'>
          {/* Cover Image — client-side compressed file upload */}
          <div className='space-y-2'>
            <Label>Author Avatar</Label>
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-5 hover:bg-neutral-50 transition min-h-[120px]'>
              {compressing ? (
                <div className='flex flex-col items-center gap-2 text-neutral-400'>
                  <Loader2 className='h-6 w-6 animate-spin' />
                  <span className='text-xs'>Compressing…</span>
                </div>
              ) : profilePhoto ? (
                <div className='relative'>
                  <img
                    src={profilePhoto}
                    alt='Author preview'
                    className='h-24 w-24 object-cover rounded-full shadow-sm border border-neutral-200'
                  />
                  <button
                    type='button'
                    onClick={() => setValue('profilePhoto', '')}
                    className='absolute top-0 right-0 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 transition'
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className='flex flex-col items-center cursor-pointer gap-1'>
                  <Upload className='h-7 w-7 text-neutral-400' />
                  <span className='text-sm font-medium text-neutral-600'>
                    Click to upload avatar
                  </span>
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
            {profilePhoto && !compressing && (
              <label className='flex items-center justify-center gap-1 cursor-pointer text-xs text-primary-600 hover:underline w-full'>
                <ImageIcon className='h-3 w-3' />
                Replace image
                <input
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='name'>Name</Label>
            <Input
              id='name'
              placeholder='e.g. J.K. Rowling'
              {...register('name')}
            />
            {errors.name && (
              <p className='text-xs text-red-500'>{errors.name.message}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='bio'>Bio (Optional)</Label>
            <Textarea
              id='bio'
              placeholder='Author biography...'
              className='h-24'
              {...register('bio')}
            />
            {errors.bio && (
              <p className='text-xs text-red-500'>{errors.bio.message}</p>
            )}
          </div>

          <Button
            type='submit'
            className='w-full bg-primary-600 hover:bg-primary-700 text-white'
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isEdit ? 'Save Changes' : 'Create Author'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
