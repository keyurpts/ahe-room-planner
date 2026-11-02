import layoutIcon from '@/assets/icons/Subtract.svg';
import layoutHoverIcon from '@/assets/icons/Subtract-h.svg';
import newDesignIcon from '@/assets/icons/bi_pencil-square.svg';
import newDesignHoverIcon from '@/assets/icons/bi_pencil-square-h.svg';
import savedDesignIcon from '@/assets/icons/fluent_folder-document-28-regular.svg';
import savedDesignHoverIcon from '@/assets/icons/fluent_folder-document-28-regular-h.svg';

export const actions = [
  {
    id: 'layout',
    label: 'Use a pre-designed layout',
    icon: layoutIcon,
    hoverIcon: layoutHoverIcon,
    iconSize: 38,
  },
  {
    id: 'new',
    label: 'Start a new design',
    icon: newDesignIcon,
    hoverIcon: newDesignHoverIcon,
    iconSize: 34,
  },
  {
    id: 'saved',
    label: 'Open saved project',
    icon: savedDesignIcon,
    hoverIcon: savedDesignHoverIcon,
    iconSize: 39,
  },
] as const;