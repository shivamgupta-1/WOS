import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  onBlur?: () => void;
  className?: string;
}

export default function Dropdown({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = 'Select an option',
  disabled = false,
  invalid = false,
  onBlur,
  className = '',
}: DropdownProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((option) => option.value === value)));
  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    if (!isOpen) return undefined;
    function closeOnOutsidePointer(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [isOpen, onBlur]);

  useEffect(() => {
    if (isOpen) optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, isOpen]);

  function openAt(index: number) {
    const enabledOptions = options.map((option, optionIndex) => option.disabled ? -1 : optionIndex).filter((optionIndex) => optionIndex >= 0);
    if (enabledOptions.length === 0) return;
    const selectedIndex = options.findIndex((option) => option.value === value && !option.disabled);
    const requestedIndex = index < 0
      ? enabledOptions[enabledOptions.length - 1] ?? 0
      : index >= options.length
        ? enabledOptions[0] ?? 0
        : options[index]?.disabled
          ? enabledOptions.find((optionIndex) => optionIndex > index) ?? enabledOptions[0] ?? 0
          : index;
    setActiveIndex(index === -2 ? Math.max(selectedIndex, 0) : requestedIndex);
    setIsOpen(true);
  }

  function moveActive(offset: number) {
    const enabledOptions = options.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0);
    if (enabledOptions.length === 0) return;
    const position = enabledOptions.indexOf(activeIndex);
    const nextPosition = (position + offset + enabledOptions.length) % enabledOptions.length;
    setActiveIndex(enabledOptions[nextPosition] ?? 0);
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAt(-2);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(-1);
    }
  }

  function handleOptionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      openAt(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      openAt(options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      rootRef.current?.querySelector('button')?.focus();
    } else if (event.key === 'Tab') {
      setIsOpen(false);
      onBlur?.();
    }
  }

  function selectOption(option: DropdownOption) {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
    onBlur?.();
    rootRef.current?.querySelector('button')?.focus();
  }

  return (
    <div className={`dropdown ${className}`} ref={rootRef}>
      <button
        type="button"
        className={`dropdown-trigger${isOpen ? ' is-open' : ''}${invalid ? ' is-invalid' : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => isOpen ? setIsOpen(false) : openAt(-2)}
        onKeyDown={handleTriggerKeyDown}
        onBlur={(event) => {
          if (!rootRef.current?.contains(event.relatedTarget as Node | null)) onBlur?.();
        }}
      >
        <span className={!selectedOption ? 'dropdown-placeholder' : undefined}>{selectedOption?.label ?? placeholder}</span>
        <svg className="dropdown-chevron" aria-hidden="true" viewBox="0 0 20 20"><path d="m5 7.5 5 5 5-5" /></svg>
      </button>
      {isOpen && (
        <div id={listId} className="dropdown-menu" role="listbox" aria-label={ariaLabel} aria-activedescendant={`${listId}-option-${activeIndex}`}>
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={(element) => { optionRefs.current[index] = element; }}
              id={`${listId}-option-${index}`}
              type="button"
              role="option"
              aria-selected={option.value === value}
              disabled={option.disabled}
              className={`dropdown-option${option.value === value ? ' is-selected' : ''}`}
              tabIndex={activeIndex === index ? 0 : -1}
              onClick={() => selectOption(option)}
              onKeyDown={handleOptionKeyDown}
            >
              <span>{option.label}</span>
              {option.value === value && <span className="dropdown-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
