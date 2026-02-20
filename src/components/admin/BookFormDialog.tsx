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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useCreateBook, useUpdateBook } from '@/hooks/useBooksAdmin';
import type { Book, Category } from '@/types';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';

const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  authorName: z.string().min(1, 'Author is required'),
  isbn: z.string().min(1, 'ISBN is required'),
  categoryId: z.string().min(1, 'Category is required'), // stored as string in form, parsed to number
  publishedYear: z.string().regex(/^\d{4}$/, 'Must be a valid year'), // input as string
  totalCopies: z.string().regex(/^\d+$/, 'Must be a number'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  coverImage: z.string().optional(), // Base64
});

type BookFormValues = z.infer<typeof bookSchema>;

interface BookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: Book | null; // If provided, edit mode
}

export default function BookFormDialog({
  open,
  onOpenChange,
  book,
}: BookFormDialogProps) {
  const isEdit = !!book;
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      authorName: '',
      isbn: '',
      categoryId: '',
      publishedYear: new Date().getFullYear().toString(),
      totalCopies: '1',
      description: '',
      coverImage: '',
    },
  });

  // Fetch categories for dropdown
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/api/categories');
      // Backend: { success, message, data: [...] } or { data: { categories: [...] } }
      const payload = data?.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.categories)) return payload.categories;
      return [];
    },
  });

  // Pre-fill form on edit
  useEffect(() => {
    if (book) {
      reset({
        title: book.title,
        authorName: book.author?.name || '',
        isbn: book.isbn || '',
        categoryId: book.categoryId.toString(),
        publishedYear: (
          book.publishedYear || new Date().getFullYear()
        ).toString(),
        totalCopies: book.totalCopies.toString(),
        description: book.description || '',
        coverImage: book.coverImage || '',
      });
    } else {
      reset({
        title: '',
        authorName: '',
        isbn: '',
        categoryId: '',
        publishedYear: new Date().getFullYear().toString(),
        totalCopies: '1',
        description: '',
        coverImage: '',
      });
    }
  }, [book, reset, open]);

  const onSubmit = (values: BookFormValues) => {
    const payload = {
      ...values,
      categoryId: parseInt(values.categoryId),
      publishedYear: parseInt(values.publishedYear),
      totalCopies: parseInt(values.totalCopies),
      isbn: values.isbn,
      coverImage: values.coverImage || '',
    };

    if (isEdit && book) {
      updateBook.mutate(
        { id: book.id, data: payload },
        {
          onSuccess: () => {
            onOpenChange(false);
            reset();
          },
        }
      );
    } else {
      createBook.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
          reset();
        },
      });
    }
  }; // ── Client-side image compression via Canvas ──────────────────────────────
  // Resizes to fit within MAX_W × MAX_H and encodes as JPEG at JPEG_QUALITY.
  // Typical output: 60–130 KB regardless of input size.
  const MAX_W = 500;
  const MAX_H = 750;
  const JPEG_QUALITY = 0.78;

  const compressImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        // Compute scaled dimensions keeping aspect ratio
        let { width, height } = img;
        if (width > MAX_W || height > MAX_H) {
          const ratio = Math.min(MAX_W / width, MAX_H / height);
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
      setValue('coverImage', compressed);
    } catch {
      // Ignore compression error — leave field empty
    } finally {
      setCompressing(false);
      // Reset input so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const coverImage = watch('coverImage');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Book' : 'Add Book'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the book details below.'
              : 'Fill in the details to add a new book to the library.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-2'>
          {/* Title */}
          <div className='space-y-2'>
            <Label htmlFor='title'>Title</Label>
            <Input
              id='title'
              placeholder='e.g. The Psychology of Money'
              {...register('title')}
            />
            {errors.title && (
              <p className='text-xs text-red-500'>{errors.title.message}</p>
            )}
          </div>

          {/* Author */}
          <div className='space-y-2'>
            <Label htmlFor='authorName'>Author</Label>
            <Input
              id='authorName'
              placeholder='e.g. Morgan Housel'
              {...register('authorName')}
            />
            {errors.authorName && (
              <p className='text-xs text-red-500'>
                {errors.authorName.message}
              </p>
            )}
          </div>

          {/* ISBN */}
          <div className='space-y-2'>
            <Label htmlFor='isbn'>ISBN</Label>
            <Input
              id='isbn'
              placeholder='e.g. 978-3-16-148410-0'
              {...register('isbn')}
            />
            {errors.isbn && (
              <p className='text-xs text-red-500'>{errors.isbn.message}</p>
            )}
          </div>

          {/* Category */}
          <div className='space-y-2'>
            <Label htmlFor='category'>Category</Label>
            <Select
              onValueChange={(val) => setValue('categoryId', val)}
              value={watch('categoryId')}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Category' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className='text-xs text-red-500'>
                {errors.categoryId.message}
              </p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            {/* Pages / Stocks */}
            <div className='space-y-2'>
              <Label htmlFor='totalCopies'>Stocks</Label>
              <Input
                type='number'
                id='totalCopies'
                {...register('totalCopies')}
              />
              {errors.totalCopies && (
                <p className='text-xs text-red-500'>
                  {errors.totalCopies.message}
                </p>
              )}
            </div>
            {/* Year */}
            <div className='space-y-2'>
              <Label htmlFor='publishedYear'>Year</Label>
              <Input
                type='number'
                id='publishedYear'
                {...register('publishedYear')}
              />
              {errors.publishedYear && (
                <p className='text-xs text-red-500'>
                  {errors.publishedYear.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Book summary...'
              className='h-24'
              {...register('description')}
            />
            {errors.description && (
              <p className='text-xs text-red-500'>
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Cover Image — client-side compressed file upload */}
          <div className='space-y-2'>
            <Label>Cover Image</Label>
            <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-5 hover:bg-neutral-50 transition min-h-[120px]'>
              {compressing ? (
                <div className='flex flex-col items-center gap-2 text-neutral-400'>
                  <Loader2 className='h-6 w-6 animate-spin' />
                  <span className='text-xs'>Compressing…</span>
                </div>
              ) : coverImage ? (
                <div className='relative'>
                  <img
                    src={coverImage}
                    alt='Cover preview'
                    className='h-36 w-auto object-contain rounded shadow-sm'
                  />
                  <button
                    type='button'
                    onClick={() => setValue('coverImage', '')}
                    className='absolute -top-2 -right-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 transition'
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className='flex flex-col items-center cursor-pointer gap-1'>
                  <Upload className='h-7 w-7 text-neutral-400' />
                  <span className='text-sm font-medium text-neutral-600'>
                    Click to upload
                  </span>
                  <span className='text-xs text-neutral-400'>
                    JPG, PNG, WEBP — auto-compressed
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
            {coverImage && !compressing && (
              <label className='flex items-center gap-1 cursor-pointer text-xs text-primary-600 hover:underline w-fit'>
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

          <Button
            type='submit'
            className='w-full bg-primary-600 hover:bg-primary-700 text-white'
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            {isEdit ? 'Save Changes' : 'Create Book'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
