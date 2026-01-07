import { useState, useEffect, useCallback } from 'react';
// @mui
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
// components
import { Document, Page, pdfjs } from 'react-pdf';
import Iconify from "src/components/iconify";
// hooks
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


export interface IFileDetails {
  fileName?: string;
  format: string;
  url: string;
  existing?: boolean;
  fileReference?: any;
}

interface IProps {
  controller: UseBooleanReturnType<IFileDetails>;
  onRemove?: (file: any) => void;
  onUpdateFileName?: (file: any, newName: string) => void;
}

export const PreviewDialog = ({ controller, onRemove, onUpdateFileName }: IProps) => {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [numOfPages, setNumOfPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedFileName, setEditedFileName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [displayFileName, setDisplayFileName] = useState<string>('');

  useEffect(() => {
    setPageLoaded(false);
    setNumOfPages(null);
    setPageNumber(1);
    setIsEditingName(false);
    setValidationError('');
    setDisplayFileName(controller.attribute?.fileName || '');
  }, [controller.attribute?.url, controller.attribute?.fileName]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumOfPages(numPages);
  }, [setNumOfPages]);

  // File name validation
  const validateFileName = useCallback((name: string): string => {
    if (!name.trim()) {
      return 'File name cannot be empty';
    }

    const invalidChars = /[/\\:*?<>|]/;
    if (invalidChars.test(name)) {
      return 'File name cannot contain: / \\ : * ? < > |';
    }

    return '';
  }, []);

  // Extract file name without extension
  const getFileNameWithoutExtension = useCallback((fullName: string): string => {
    const lastDotIndex = fullName.lastIndexOf('.');
    if (lastDotIndex === -1) return fullName;
    return fullName.substring(0, lastDotIndex);
  }, []);

  // Get file extension
  const getFileExtension = useCallback((fullName: string): string => {
    const lastDotIndex = fullName.lastIndexOf('.');
    if (lastDotIndex === -1) return '';
    return fullName.substring(lastDotIndex);
  }, []);

  // Handle edit mode entry
  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!displayFileName) return;

    const nameWithoutExt = getFileNameWithoutExtension(displayFileName);
    setEditedFileName(nameWithoutExt);
    setValidationError('');
    setIsEditingName(true);
  }, [displayFileName, getFileNameWithoutExtension]);

  // Handle save
  const handleSave = useCallback(() => {
    const error = validateFileName(editedFileName);
    if (error) {
      setValidationError(error);
      return;
    }

    const extension = getFileExtension(displayFileName);
    const newFullName = editedFileName + extension;

    if (onUpdateFileName && controller.attribute?.fileReference) {
      onUpdateFileName(controller.attribute.fileReference, newFullName);
    }

    // Update the displayed name immediately
    setDisplayFileName(newFullName);
    setIsEditingName(false);
  }, [editedFileName, validateFileName, getFileExtension, onUpdateFileName, controller.attribute?.fileReference, displayFileName]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setIsEditingName(false);
    setValidationError('');
  }, []);

  const handleDownload = useCallback(() => {
    const url = controller.attribute?.url;
    if (!url) return;

    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;

        const urlFileName = url.split('?')[0].split('/').pop() || 'download';
        let fileName = urlFileName;

        if (displayFileName) {
          fileName = displayFileName;
          const parts = urlFileName.split('.');
          const extension = parts.length > 1 ? parts.pop() : '';
          if (extension && !fileName.endsWith(`.${extension}`)) {
            fileName = `${fileName}.${extension}`;
          }
        }

        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => console.error('Error downloading file:', error));
  }, [controller.attribute?.url, displayFileName]);

  if (!controller.attribute?.url) {
    return null;
  }
  
  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={controller.value}
      onClose={() => controller.onFalse()}
    >
      <DialogTitle sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          {displayFileName && (
            <>
              {isEditingName ? (
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flex: 1 }}>
                  <TextField
                    size="small"
                    value={editedFileName}
                    onChange={(e) => {
                      setEditedFileName(e.target.value);
                      setValidationError('');
                    }}
                    error={!!validationError}
                    helperText={validationError}
                    autoFocus
                    fullWidth
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleSave}
                    color="primary"
                  >
                    <Iconify icon="eva:checkmark-fill" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={handleCancel}
                  >
                    <Iconify icon="eva:close-fill" />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body1"
                    onClick={onUpdateFileName ? handleEditClick : undefined}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                      minWidth: 0,
                      ...(onUpdateFileName && {
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }),
                    }}
                  >
                    {displayFileName}
                  </Typography>
                  {onUpdateFileName && (
                    <IconButton
                      size="small"
                      onClick={handleEditClick}
                      sx={{ flexShrink: 0 }}
                    >
                      <Iconify icon="eva:edit-2-fill" />
                    </IconButton>
                  )}
                </Box>
              )}
            </>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handleDownload}>
              <Iconify icon="eva:download-fill" />
            </IconButton>
            <IconButton onClick={() => controller.onFalse()}>
              <Iconify icon="mingcute:close-line" />
            </IconButton>
          </Box>
        </Box>
        {controller.attribute?.format === 'pdf' && numOfPages && (
          <Stack direction="row" alignItems="center" spacing={1} sx={{ justifyContent: 'center' }}>
            <IconButton disabled={pageNumber <= 1} onClick={() => setPageNumber(prev => prev - 1)}>
              <Iconify icon="eva:arrow-ios-back-fill" />
            </IconButton>
            <Typography variant="body2">
              {pageNumber} / {numOfPages}
            </Typography>
            <IconButton disabled={pageNumber >= numOfPages} onClick={() => setPageNumber(prev => prev + 1)}>
              <Iconify icon="eva:arrow-ios-forward-fill" />
            </IconButton>
          </Stack>
        )}
      </DialogTitle>
      <DialogContent sx={{ height: '75vh', overflow: 'hidden' }}>
        {controller.attribute?.format === 'pdf' ? (
          <TransformWrapper
            minScale={0.5}
            key={`${controller.attribute?.url}-${pageLoaded}`}
          >
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
              }}
            >
              <Document
                file={controller.attribute?.url}
                onLoadSuccess={onDocumentLoadSuccess}
              >
                <Page
                  pageNumber={pageNumber}
                  onLoadSuccess={() => setPageLoaded(true)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <Box
            component="img"
            src={controller.attribute?.url}
            sx={{
              width: 1,
              height: 1,
              objectFit: 'contain',
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
};
