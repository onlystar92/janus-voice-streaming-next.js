import { useRef, useState } from 'react';
import ChevronDown from 'icons/ChevronDown';
import clsx from 'clsx';

const Option = ({ index, value, onClick, isSelected, isLast }) => {
  const optionRef = useRef();

  function handleSelectKey(event) {
    if (!optionRef.current) return;
    if (!optionRef.current.focused || event.keyCode !== 13) return;
    optionRef.current.click();
  }

  return (
    <span
      ref={optionRef}
      className={clsx('w-full p-2 text-accent-text', {
        'bg-secondary-100 hover:bg-primary-300': !isSelected,
        'bg-primary-200': isSelected,
        'rounded-b-md': isLast,
      })}
      tabIndex={index}
      role="button"
      onClick={onClick}
      onKeyDown={handleSelectKey}
    >
      {value}
    </span>
  );
};

const OptionList = ({ className, selected, values, onClick }) => (
  <div className={clsx(className, 'flex flex-col')}>
    {values.map((value, index) => (
      <Option
        key={value}
        index={index}
        value={value}
        onClick={onClick}
        isSelected={selected === value}
        isLast={index === values.length - 1}
      />
    ))}
  </div>
);

const Select = ({ className, values, selected, onSelect }) => {
  const [open, setOpen] = useState(false);
  const selector = useRef();

  function handleClickAway(event) {
    if (
      !selector ||
      !selector.current ||
      selector.current.contains(event.target) ||
      selector.current === event.target
    ) {
      return;
    }

    setOpen(false);
    document.removeEventListener('mousedown', handleClickAway);
  }

  function openSelector() {
    setOpen(true);
    document.addEventListener('mousedown', handleClickAway);
  }

  function closeSelector() {
    setOpen(false);
    document.removeEventListener('mousedown', handleClickAway);
  }

  function handleOpen(event) {
    event.preventDefault();
    if (open) return;
    openSelector();
  }

  function handleOptionSelect(event) {
    event.preventDefault();

    // Execute callback
    onSelect(event.target.innerText);
    closeSelector();
  }

  function handleCloseKey(event) {
    if (!open) return;
    if (event.keyCode !== 27) return;
    closeSelector();
  }

  return (
    <div
      ref={selector}
      className={clsx(className, 'relative cursor-default')}
      tabIndex="0"
      role="button"
      onClick={handleOpen}
      onKeyDown={handleCloseKey}
    >
      <div
        className={clsx(
          'p-2 flex items-center justify-between border-2 border-solid border-transparent transition-colors duration-150 bg-secondary-100 text-accent-text',
          {
            'rounded-md hover:border-primary-300': !open,
            'rounded-t-md border-primary-300 shadow-md': open,
          }
        )}
      >
        <span className="truncate">{selected || values[0]}</span>
        <ChevronDown className="w-6 h-6 cursor-pointer transition-opacity duration-150 opacity-50 hover:opacity-100" />
      </div>
      <OptionList
        className={clsx(
          'absolute border-l-2 border-r-2 border-b-2 rounded-b-md border-primary-300 w-full overflow-hidden z-10',
          {
            'max-h-0 border-opacity-0': !open,
            'max-h-screen shadow-md': open,
          }
        )}
        values={values}
        selected={selected || values[0]}
        onClick={handleOptionSelect}
      />
    </div>
  );
};

export default Select;
