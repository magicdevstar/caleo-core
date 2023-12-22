import { useRef, useState, useLayoutEffect } from 'react';
// @mui
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
// routes
import { RouterLink } from 'src/routes/components';
//
import { BreadcrumbsLinkProps } from './types';

// ----------------------------------------------------------------------

type Props = {
  link: BreadcrumbsLinkProps;
  activeLast?: boolean;
  disabled: boolean;
  maxWidth?: number;
};

export default function BreadcrumbsLink({ link, activeLast, disabled, maxWidth }: Props) {
  const { name, href, icon } = link;
  const linkRef = useRef<HTMLDivElement | null>(null);
  const [linkWidth, setLinkWidth] = useState(0);

  const styles = {
    typography: 'body2',
    alignItems: 'center',
    color: 'text.primary',
    display: 'inline-flex',
    ...(maxWidth && {
      display: 'inline-block',
      maxWidth: `${maxWidth}px`,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    }),
    ...(disabled &&
      !activeLast && {
        cursor: 'default',
        pointerEvents: 'none',
        color: 'text.disabled',
      }),
  };

  useLayoutEffect(() => {
    if (linkRef.current) {
      const { width } = linkRef.current.getBoundingClientRect();
      setLinkWidth(width);
    }
  }, []);

  const renderTextContent = (
    <>
      {icon && (
        <Box
          component="span"
          sx={{
            mr: 1,
            display: 'inherit',
            '& svg': { width: 20, height: 20 },
          }}
        >
          {icon}
        </Box>
      )}
      <span ref={linkRef}>
        {name}
      </span>
    </>
  );

  const renderContent = href ? (
    <Link component={RouterLink} href={href} sx={styles}>
      {renderTextContent}
    </Link>
  ) : (
    <Box sx={styles}> {renderTextContent} </Box>
  );

  return (
    <Tooltip title={maxWidth && linkWidth >= maxWidth ? name : ''} enterDelay={500} placement='top'>
      {renderContent}
    </Tooltip>
  );
}
