import { useId, useRef, useState, type SubmitEvent } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/constants/paths';
import { startProject } from '@/features/planner/state/project-slice';
import { useAppDispatch } from '@/app/store-hooks';
import type { RoomShape, RoomType } from '@/features/planner/types';
import { Button } from '@/components/ui/Button';
import '@/styles/text-input.css';
import { Dialog } from '@/components/ui/Dialog';
import kitchenIcon from '@/assets/icons/cbi_kitchen-alt.svg';
import selectedKitchenIcon from '@/assets/icons/cbi_kitchen-alt-clicked.svg';
import '@/styles/new-design.css';
import { RoomShapeStep } from '@/features/landing/components/RoomShapeStep';

const roomTypes = ['Kitchen', 'Laundry', 'Office', 'Linen', 'Garage', 'Other'] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NewDesignDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [projectName, setProjectName] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [step, setStep] = useState<'details' | 'shape'>('details');
  const [shape, setShape] = useState<RoomShape | null>(null);
  const [shapeMessage, setShapeMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const firstRoomRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const roomError = attempted && !roomType;
  const nameError = attempted && !projectName.trim();

  function close() {
    setRoomType(null);
    setProjectName('');
    setAttempted(false);
    setStep('details');
    setShape(null);
    setShapeMessage('');
    onClose();
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (!projectName.trim()) setProjectName('');
    if (!roomType) {
      firstRoomRef.current?.focus();
      return;
    }
    if (!projectName.trim()) {
      inputRef.current?.focus();
      return;
    }
    setProjectName(projectName.trim());
    setStep('shape');
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      layout={step === 'shape' ? 'room-shape' : 'new-design'}
      title={step === 'shape' ? projectName : 'What are you designing?'}
      subtitle={
        step === 'shape' ? 'Select the shape of your room' : 'Choose a room type to get started.'
      }

      footer={
        <>
          <Button
            variant="outline"
            size="compact"
            className="new-design-back rounded-[0.625rem]! text-base uppercase"
            onClick={() => {
              if (step === 'shape') {
                setStep('details');
                setShapeMessage('');
              } else close();
            }}
          >
            <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
              <path
                d="M26 10H2m0 0 7-7m-7 7 7 7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Button>
          {step === 'shape' && (
            <Button
              variant="outline"
              size="compact"
              className="room-shape-next rounded-[0.625rem]! border-brand! text-base uppercase"
              disabled={!shape}
              onClick={() => {
                if (!shape || !roomType) return;
                dispatch(startProject({ projectName: projectName.trim(), roomType, shape }));
                close();
                void navigate(paths.roomSetup);
              }}
            >
              Next
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                <path
                  d="M2 10h24m0 0-7-7m7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          )}
        </>
      }
    >
      {step === 'shape' ? (
        <RoomShapeStep
          selected={shape}
          onSelect={(value) => {
            setShape(value);
            setShapeMessage('');
          }}
          onCustom={() => {
            setShapeMessage('Custom wall drawing is not available yet.');
          }}
          message={shapeMessage}
        />
      ) : (
        <form onSubmit={submit} noValidate>
          <fieldset
            className="new-design-rooms"
            aria-describedby={roomError ? `${id}-room-error` : undefined}
          >
            <legend className="sr-only">Choose a room type</legend>
            <div className="room-type-grid">
              {roomTypes.map((room, index) => (
                <label key={room} className="room-type-card">
                  <input
                    ref={index === 0 ? firstRoomRef : undefined}
                    className="room-type-input"
                    type="radio"
                    name={`${id}-room-type`}
                    value={room}
                    checked={roomType === room}
                    required
                    aria-invalid={roomError}
                    onChange={() => {
                      setRoomType(room);
                    }}
                  />
                  <span className="room-type-icon" aria-hidden="true">
                    <img
                      src={kitchenIcon}
                      width={122}
                      height={101}
                      alt=""
                      className="room-icon-default"
                    />
                    <img
                      src={selectedKitchenIcon}
                      width={122}
                      height={101}
                      alt=""
                      className="room-icon-selected"
                    />
                  </span>
                  <span className="room-type-label">{room}</span>
                </label>
              ))}
            </div>
            {roomError && (
              <p id={`${id}-room-error`} className="sr-only">
                Choose a room type.
              </p>
            )}
          </fieldset>
          <div className="new-design-project">
            <div className="project-name-field">
              <label htmlFor={`${id}-name`} className="sr-only">
                Enter project name
              </label>
              <input
                ref={inputRef}
                id={`${id}-name`}
                name="projectName"
                type="text"
                placeholder={nameError ? 'Please enter a project name' : 'Enter project name'}
                value={projectName}
                maxLength={100}
                required
                aria-invalid={nameError}
                aria-describedby={nameError ? `${id}-name-error` : undefined}
                onChange={(event) => {
                  setProjectName(event.target.value);
                }}
                className="project-name-input"
              />
              {nameError && (
                <span id={`${id}-name-error`} role="alert" className="sr-only">
                  Please enter a project name.
                </span>
              )}
            </div>
            <Button
              type="submit"
              size="compact"
              className="create-design-button min-w-[12.125rem] rounded-[0.625rem]! text-base uppercase"
            >
              Create design
              <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden="true">
                <path
                  d="M2 10h24m0 0-7-7m7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
