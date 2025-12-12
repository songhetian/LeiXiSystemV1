import React from 'react';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import DOMPurify from 'dompurify';

const LazyImageRenderer = ({ htmlContent }) => {
  const sanitizedHtml = DOMPurify.sanitize(htmlContent, {
    ADD_ATTR: ['loading'],
    FORBID_TAGS: ['script'], // Forbid script tags for security
  });

  // Parse the sanitized HTML and add loading="lazy" to img tags
  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, 'text/html');
  doc.querySelectorAll('img').forEach(img => {
    img.setAttribute('loading', 'lazy');
  });

  return (
    <div dangerouslySetInnerHTML={{ __html: doc.body.innerHTML }} />
  );
};

export default LazyImageRenderer;
