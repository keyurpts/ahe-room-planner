import defaultIcon from '@/assets/icons/Close.svg';
import hoverIcon from '@/assets/icons/Close-h.svg';
import '@/styles/close-icon.css';

export function CloseIcon() {
  return (
    <span className="close-icon" aria-hidden="true">
      <img src={defaultIcon} width={30} height={30} alt="" className="close-icon-default" />
      <img src={hoverIcon} width={30} height={30} alt="" className="close-icon-hover" />
    </span>
  );
}
