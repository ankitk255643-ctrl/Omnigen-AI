import { PDFTool } from './types';

export const TOOL_CATEGORIES = [
  { id: 'all', name: 'All Tools' },
  { id: 'organize', name: 'Organize PDF' },
  { id: 'optimize', name: 'Optimize PDF' },
  { id: 'convert-to', name: 'Convert to PDF' },
  { id: 'convert-from', name: 'Convert from PDF' },
  { id: 'edit', name: 'Edit PDF' },
  { id: 'security', name: 'Security' },
  { id: 'ai', name: 'AI PDF Tools' },
];

export const PDF_TOOLS: PDFTool[] = [
  // Organize
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one file in seconds.',
    category: 'organize',
    iconName: 'Merge',
    path: '/merge-pdf'
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Split one PDF by page range or extract all pages into separate PDFs.',
    category: 'organize',
    iconName: 'Split',
    path: '/split-pdf'
  },
  {
    id: 'remove-pages',
    name: 'Remove Pages',
    description: 'Delete unwanted pages from a PDF document easily.',
    category: 'organize',
    iconName: 'Trash2',
    path: '/remove-pages'
  },
  {
    id: 'extract-pages',
    name: 'Extract Pages',
    description: 'Select specific pages you need and save them as a separate PDF.',
    category: 'organize',
    iconName: 'Copy',
    path: '/extract-pages'
  },
  {
    id: 'organize-pages',
    name: 'Organize Pages',
    description: 'Reorder, rotate, and delete pages inside your PDF file.',
    category: 'organize',
    iconName: 'LayoutGrid',
    path: '/organize-pages'
  },
  {
    id: 'scan-to-pdf',
    name: 'Scan to PDF',
    description: 'Upload image scans or capture photo to create a PDF document.',
    category: 'organize',
    iconName: 'Camera',
    path: '/scan-to-pdf'
  },

  // Optimize
  {
    id: 'compress-pdf',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining original quality.',
    category: 'optimize',
    iconName: 'Minimize2',
    path: '/compress-pdf'
  },
  {
    id: 'repair-pdf',
    name: 'Repair PDF',
    description: 'Recover or fix corrupted and damaged PDF files.',
    category: 'optimize',
    iconName: 'Wrench',
    path: '/repair-pdf'
  },
  {
    id: 'ocr-pdf',
    name: 'OCR PDF',
    description: 'Convert scanned legacy PDFs into fully searchable, selectable documents.',
    category: 'optimize',
    iconName: 'ScanText',
    path: '/ocr-pdf',
    isPremium: true
  },

  // Convert to
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Convert multiple JPG, PNG, or GIF images into a PDF with style.',
    category: 'convert-to',
    iconName: 'Image',
    path: '/jpg-to-pdf'
  },
  {
    id: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Convert DOC and DOCX Word documents into clean PDFs.',
    category: 'convert-to',
    iconName: 'FileText',
    path: '/word-to-pdf'
  },
  {
    id: 'powerpoint-to-pdf',
    name: 'PowerPoint to PDF',
    description: 'Convert PPT and PPTX PowerPoint slider decks into PDF format.',
    category: 'convert-to',
    iconName: 'Presentation',
    path: '/powerpoint-to-pdf'
  },
  {
    id: 'excel-to-pdf',
    name: 'Excel to PDF',
    description: 'Transform XLS and XLSX Excel sheets into precise PDF worksheets.',
    category: 'convert-to',
    iconName: 'Table',
    path: '/excel-to-pdf'
  },
  {
    id: 'html-to-pdf',
    name: 'HTML to PDF',
    description: 'Convert any web page or uploaded HTML file directly to PDF.',
    category: 'convert-to',
    iconName: 'Code',
    path: '/html-to-pdf'
  },

  // Convert from
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Extract all pages of a PDF file as individual JPEG.ZIP images.',
    category: 'convert-from',
    iconName: 'FileImage',
    path: '/pdf-to-jpg'
  },
  {
    id: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Convert PDF files into fully editable Word DOCX documents.',
    category: 'convert-from',
    iconName: 'FileOutput',
    path: '/pdf-to-word'
  },
  {
    id: 'pdf-to-powerpoint',
    name: 'PDF to PowerPoint',
    description: 'Convert PDF document pages back into PPTX presentation slides.',
    category: 'convert-from',
    iconName: 'MonitorPlay',
    path: '/pdf-to-powerpoint'
  },
  {
    id: 'pdf-to-excel',
    name: 'PDF to Excel',
    description: 'Extract tables from PDF into structured, searchable Excel sheet.',
    category: 'convert-from',
    iconName: 'Sheet',
    path: '/pdf-to-excel'
  },
  {
    id: 'pdf-to-pdfa',
    name: 'PDF to PDF/A',
    description: 'Convert PDFs to archive-standard PDF/A for long-term storage.',
    category: 'convert-from',
    iconName: 'Archive',
    path: '/pdf-to-pdfa'
  },

  // Edit
  {
    id: 'edit-pdf',
    name: 'Edit PDF',
    description: 'Add text, shapes, draw freehand, highlight and edit original PDFs.',
    category: 'edit',
    iconName: 'FilePenLine',
    path: '/edit-pdf'
  },
  {
    id: 'rotate-pdf',
    name: 'Rotate PDF',
    description: 'Rotate and re-save individual or all pages within a PDF.',
    category: 'edit',
    iconName: 'RotateCw',
    path: '/rotate-pdf'
  },
  {
    id: 'add-page-numbers',
    name: 'Header & Page Numbers',
    description: 'Apply formatted page numbers or headers to custom PDF zones.',
    category: 'edit',
    iconName: 'Binary',
    path: '/add-page-numbers'
  },
  {
    id: 'add-watermark',
    name: 'Add Watermark',
    description: 'Overlay custom texts or transparent images as watermarks.',
    category: 'edit',
    iconName: 'Stamp',
    path: '/add-watermark'
  },
  {
    id: 'crop-pdf',
    name: 'Crop PDF',
    description: 'Crop and trim margins or selected areas of your document.',
    category: 'edit',
    iconName: 'Crop',
    path: '/crop-pdf'
  },
  {
    id: 'pdf-forms',
    name: 'Interactive Forms',
    description: 'Add text fields, checkboxes, and interactive inputs to PDFs.',
    category: 'edit',
    iconName: 'FormInput',
    path: '/pdf-forms'
  },

  // Security
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    description: 'Secure files with military-grade passwords and user restrictions.',
    category: 'security',
    iconName: 'Lock',
    path: '/protect-pdf'
  },
  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    description: 'Remove password security, locks, and restrictions from files.',
    category: 'security',
    iconName: 'Unlock',
    path: '/unlock-pdf'
  },
  {
    id: 'sign-pdf',
    name: 'Sign PDF',
    description: 'Sign documents digitally by drawing, typing, or placing image.',
    category: 'security',
    iconName: 'PenTool',
    path: '/sign-pdf'
  },
  {
    id: 'redact-pdf',
    name: 'Redact PDF',
    description: 'Permanently blackout sensitive visual layout fields or texts.',
    category: 'security',
    iconName: 'EyeOff',
    path: '/redact-pdf'
  },
  {
    id: 'compare-pdf',
    name: 'Compare PDF',
    description: 'Show visual differences side-by-side or highlight changes.',
    category: 'security',
    iconName: 'Compass',
    path: '/compare-pdf'
  },

  // AI PDF
  {
    id: 'ai-summarizer',
    name: 'AI Summarizer',
    description: 'Get key insights, chapter summaries, and ask Qs directly to PDFs.',
    category: 'ai',
    iconName: 'BrainCircuit',
    path: '/ai-summarizer',
    isPremium: true
  },
  {
    id: 'translate-pdf',
    name: 'Translate PDF',
    description: 'Instantly translate entire PDF texts into 50+ languages with AI.',
    category: 'ai',
    iconName: 'Languages',
    path: '/translate-pdf',
    isPremium: true
  }
];
