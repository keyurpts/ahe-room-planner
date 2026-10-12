interface Props {
  expanded: boolean;
  closedDirection?: 'down' | 'right';
}

export function SidebarChevron({ expanded, closedDirection = 'down' }: Props) {
  const path = expanded
    ? 'm4 11 5-5 5 5'
    : closedDirection === 'right'
      ? 'm6 4 5 5-5 5'
      : 'm4 6 5 5 5-5';
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d={path} stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
