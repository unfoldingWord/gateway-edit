/* eslint-disable no-use-before-define */

// Based on Material UI Creatable example: https://material-ui.com/components/autocomplete/#creatable
//    and https://material-ui.com/components/autocomplete/#checkboxes

import React from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
import IconButton from '@material-ui/core/IconButton';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import Tooltip from '@material-ui/core/Tooltip';
import PropTypes from "prop-types";

const filter = createFilterOptions();

export function delay(ms) {
  return new Promise((resolve) =>
    setTimeout(resolve, ms),
  );
}

export function ComboBox({label, options: options_, current, allowUserInput, onChange, deleteItem, style}) {
  const currentOption_ = ((current >= 0) && (current < options_.length)) ? options_[current] : '';
  const [currentValue, setCurrentValue] = React.useState(currentOption_);
  const [options, setOptions] = React.useState(options_);

  function handleChange(newValue) {
    let newSelection = newValue;
    if (typeof newValue === 'string') {
       setCurrentValue({
        title: newValue,
      });
    } else if (newValue && newValue.inputValue) {
       // Create a new value from the user input
      setCurrentValue({
        title: newValue.inputValue,
      });
      newSelection = newValue.inputValue;
    } else if (newValue === null) {
      return;
    } else if (newValue.deleting) {
      return;
    } else {
      setCurrentValue(newValue);
      newSelection = newValue?.title;
    }
    const index = options.findIndex(option => (option.title === newSelection));
    onChange && onChange(newSelection, index);
  }

  function findTitle(title) {
    const index = options.findIndex(item => (item.title === title));
    return index;
  }

  function handleDelete(option) {
    const currentTitle = currentValue.title;
    const removeTitle = option.title;
    deleteItem(removeTitle);
    const index = findTitle(removeTitle);
    if (index >= 0) {
      options[index].deleting = true; // flag we are deleting before onChange called
      options.splice(index, 1);
      setOptions(options);

      if (currentTitle === removeTitle) { // if we removed current, we need to select another
        const newIndex = 0;
        const newSelection = options[newIndex];
        setCurrentValue(newSelection);
        onChange && onChange(newSelection.title, newIndex);
      } else { // reselect current item since race condition can leave wrong item shown selected
        const index = findTitle(currentTitle);
        if (index >= 0) {
          delay(50).then(() => {
            const currentSelection = options[index];
            setCurrentValue(currentSelection.title);
            setOptions(options);
            onChange && onChange(currentSelection.title, index);
          });
        }
      }
    }
  }

  return (
    <Autocomplete
      value={currentValue}
      onChange={(event, newValue) => {
        handleChange(newValue);
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        // Suggest the creation of a new value
        if (params.inputValue !== '') {
          filtered.push({
            inputValue: params.inputValue,
            title: `Add "${params.inputValue}"`,
          });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      id="settings-combo-box"
      options={options}
      getOptionLabel={(option) => {
        // Value selected with enter, right from the input
        if (typeof option === 'string') {
          return option;
        }
        // Add "xxx" option created dynamically
        if (option.inputValue) {
          return option.inputValue;
        }
        // Regular option
        return option.title;
      }}
      renderOption={(option) => (
        <React.Fragment>
          {option.title}
          {option.userAdded &&
          <Tooltip title="Remove">
            <IconButton aria-label="delete" onClick={() => { handleDelete(option) }} >
              <HighlightOffIcon/>
            </IconButton>
          </Tooltip>
          }
        </React.Fragment>
      )}
      style={style || {marginTop: '16px', width: '500px'}}
      freeSolo={!!allowUserInput}
      renderInput={(params) => (
        <TextField {...params} label={label} variant="outlined" />
      )}
    />
  );
}

// {, , , allowUserInput, }
ComboBox.propTypes = {
  /** array of choices to show in dropdown. To give flexibility in data sources, each item is an object and only the title member is required to show the user */
  options: PropTypes.array.isRequired,
  /** The Prompt */
  label: PropTypes.string.isRequired,
  /** callback function when a new selection is made */
  onChange: PropTypes.func,
  /** index of current selection (optional - default is no selection) */
  current: PropTypes.number,
  /** if true then the user can type in anything and add as selection (optional - default is false) */
  allowUserInput: PropTypes.bool,
  /** style to use for comboBox (optional) */
  style: PropTypes.object,
}

export default ComboBox
